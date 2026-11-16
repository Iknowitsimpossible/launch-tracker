/**
 * The translation step: runs after fetch-launches.ts and writes Simplified
 * Chinese versions of the English text that comes from Launch Library.
 *
 *   node scripts/translate.ts
 *
 * Reads   data/launches.json          (the snapshot both languages are built from)
 *         data/glossary.zh.json       (reviewed names; always wins)
 *         data/translations.zh.json   (earlier results; the cache)
 * Writes  data/translations.zh.json   (English text -> Chinese, for every text in the snapshot)
 *
 * Environment:
 *   ANTHROPIC_API_KEY  Needed to translate new text. Without it nothing new is
 *                      translated and the site shows those texts in English.
 *
 * This step never fails the build. Any text without a translation is simply
 * shown in English on the Chinese pages, labelled 原文, and is tried again on
 * the next hourly run. The English site must never wait on the translator.
 */
import { createHash } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type { Launch, LaunchData } from '../src/lib/types.ts';

// ─── Configuration ────────────────────────────────────────────────────────────

const LAUNCHES_PATH = resolve('data/launches.json');
const GLOSSARY_PATH = resolve('data/glossary.zh.json');
const TRANSLATIONS_PATH = resolve('data/translations.zh.json');

/** Haiku: the smallest, cheapest current Claude model, plenty for short news translation. */
const MODEL = 'claude-haiku-5-5';
/** Texts per request. Small enough that one bad answer costs little. */
const BATCH_SIZE = 30;
/** A hard ceiling per run, so a bug can never send thousands of texts. */
const MAX_NEW_TEXTS_PER_RUN = 300;

// ─── What gets translated ─────────────────────────────────────────────────────

/**
 * 'name': short proper names (rockets, companies, pads, places). Glossary first.
 * 'prose': sentences (mission descriptions, schedule notes, failure reasons, link titles).
 */
type TextKind = 'name' | 'prose';

interface SourceText {
  text: string;
  kind: TextKind;
}

/**
 * Every English text the Chinese pages show that comes from the API. Mission
 * names and capsule names are left out on purpose: they are official
 * identifiers ("USSF-317", "Crew Dragon Grace"), and only the glossary may
 * change them.
 */
function collectTexts(launches: Launch[]): SourceText[] {
  const found = new Map<string, TextKind>();
  const add = (text: string | null | undefined, kind: TextKind) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    // If the same text appears as both, treat it as prose (the stricter prompt rules still keep names intact).
    if (found.get(trimmed) !== 'prose') found.set(trimmed, kind);
  };

  for (const launch of launches) {
    add(launch.rocket.name, 'name');
    add(launch.rocket.fullName, 'name');
    add(launch.provider.name, 'name');
    add(launch.pad.name, 'name');
    add(launch.pad.locationName, 'name');
    add(launch.landing?.locationName, 'name');
    add(launch.spacecraft?.destination, 'name');

    add(launch.mission.description, 'prose');
    add(launch.latestUpdate?.comment, 'prose');
    add(launch.failReason, 'prose');
    for (const link of [...launch.webcasts, ...launch.infoLinks]) add(link.title, 'prose');
  }
  return [...found].map(([text, kind]) => ({ text, kind }));
}

// ─── Files ────────────────────────────────────────────────────────────────────

interface Glossary {
  names: Record<string, string>;
}

interface TranslationsFile {
  /** When this file was written (UTC). */
  generatedAt: string;
  model: string;
  /**
   * Fingerprint of the model, instructions and glossary that produced `entries`.
   * When any of them changes, the old translations no longer follow the rules,
   * so the cache is thrown away and everything is translated again once.
   */
  promptFingerprint?: string;
  /** English text exactly as it appears in launches.json -> Simplified Chinese. */
  entries: Record<string, string>;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function readCache(fingerprint: string): Promise<Record<string, string>> {
  try {
    const file = await readJson<TranslationsFile>(TRANSLATIONS_PATH);
    if (file.promptFingerprint !== fingerprint) {
      if (Object.keys(file.entries ?? {}).length > 0) {
        console.log('The model, instructions or glossary changed since the cache was made: translating everything again.');
      }
      return {};
    }
    return file.entries ?? {};
  } catch {
    return {}; // first run, or a damaged file: start empty
  }
}

/** Write to a temporary file, then rename, so a crash never leaves half a file. */
async function writeJsonAtomically(path: string, data: unknown): Promise<void> {
  const temporaryPath = `${path}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

// ─── The translation request ──────────────────────────────────────────────────

const TranslationBatch = z.object({
  translations: z.array(
    z.object({
      id: z.number().int(),
      zh: z.string(),
    }),
  ),
});

function systemPrompt(glossary: Glossary): string {
  const glossaryLines = Object.entries(glossary.names)
    .map(([english, chinese]) => `${english} => ${chinese}`)
    .join('\n');
  return [
    'You translate text for Liftoff, a rocket launch tracking website, from English into Simplified Chinese for a general Chinese-speaking audience.',
    '',
    'Each item has a kind:',
    '- "name": a rocket, company, launch pad, launch site or landing place. Use the established Chinese name when one exists (for example the name Chinese space media use).',
    '  For launch pads, launch complexes, launch areas and landing zones, translate the generic words and keep the number or code, the way Chinese space news writes them. Examples: "Space Launch Complex 41" => "41号发射台"; "Launch Complex 9A" => "9A号发射工位"; "Launch Area 94 (SLS-2 / 603)" => "94号发射区（SLS-2 / 603）"; "Landing Zone 4" => "4号着陆区"; "Satish Dhawan Space Centre Second Launch Pad" => "萨迪什·达万航天中心第二发射台".',
    '  Keep the English only for a rocket or company that has no Chinese name, and for ships (see below).',
    '- "prose": a sentence or short passage, such as a mission description, a schedule update or a link title. Translate it naturally, in the concise style of Chinese space news.',
    '',
    'Rules for every item:',
    '- Always use the glossary below for any name it lists, including names that appear inside prose.',
    '- Keep official identifiers exactly as written: mission and satellite designations (USSF-317, NROL-136, Starlink Group 15-21), booster serials (B1100), short codes such as SLC-40 or LC-39A, and catalog numbers.',
    '- Keep the names of ships, drone ships and individual spacecraft in their original language (for example "Of Course I Still Love You", "Crew Dragon Grace").',
    '- Keep numbers, dates, times and units exactly as they are. Do not convert units or time zones.',
    '- Do not add facts, explanations or notes that are not in the English text.',
    '- Return one translation for every id you are given.',
    '',
    'Glossary (English => Chinese):',
    glossaryLines,
  ].join('\n');
}

/** A short hash of everything that decides how a text gets translated. */
function promptFingerprint(glossary: Glossary): string {
  return createHash('sha256').update(`${MODEL}\n${systemPrompt(glossary)}`).digest('hex').slice(0, 16);
}

async function translateBatch(client: Anthropic, glossary: Glossary, items: SourceText[]): Promise<Map<string, string>> {
  const payload = items.map((item, id) => ({ id, kind: item.kind, text: item.text }));
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Translation needs little reasoning; low effort keeps it fast and cheap.
    output_config: { effort: 'low', format: zodOutputFormat(TranslationBatch) },
    system: systemPrompt(glossary),
    messages: [
      {
        role: 'user',
        content: `Translate these items into Simplified Chinese:\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  // Haiku has no automatic fallback model; a declined batch just stays English and is retried next run.
  if (response.stop_reason === 'refusal') throw new Error('the model declined this batch');
  if (response.stop_reason === 'max_tokens') throw new Error('the answer was cut off (max_tokens)');
  const parsed = response.parsed_output;
  if (!parsed) throw new Error('the answer did not match the expected format');

  const results = new Map<string, string>();
  for (const { id, zh } of parsed.translations) {
    const item = items[id];
    const chinese = zh.trim();
    if (item && chinese) results.set(item.text, chinese);
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const data = await readJson<LaunchData>(LAUNCHES_PATH);
  const glossary = await readJson<Glossary>(GLOSSARY_PATH);
  const fingerprint = promptFingerprint(glossary);
  const cache = await readCache(fingerprint);

  const texts = collectTexts([...data.upcoming, ...data.recent]);
  // Only texts in the current snapshot are kept, so the file never grows without limit.
  const entries: Record<string, string> = {};
  const needed: SourceText[] = [];
  let fromGlossary = 0;
  let fromCache = 0;

  for (const item of texts) {
    const reviewed = glossary.names[item.text];
    if (reviewed !== undefined) {
      fromGlossary++; // the site reads the glossary directly; nothing to store
    } else if (cache[item.text] !== undefined) {
      entries[item.text] = cache[item.text];
      fromCache++;
    } else {
      needed.push(item);
    }
  }

  const toSend = needed.slice(0, MAX_NEW_TEXTS_PER_RUN);
  let newlyTranslated = 0;
  const machineNames: string[] = [];

  if (toSend.length > 0 && !process.env.ANTHROPIC_API_KEY) {
    console.warn(`ANTHROPIC_API_KEY is not set: ${toSend.length} new texts stay in English this run.`);
  } else if (toSend.length > 0) {
    const client = new Anthropic();
    for (let start = 0; start < toSend.length; start += BATCH_SIZE) {
      const batch = toSend.slice(start, start + BATCH_SIZE);
      try {
        const results = await translateBatch(client, glossary, batch);
        for (const item of batch) {
          const chinese = results.get(item.text);
          if (chinese === undefined) continue;
          entries[item.text] = chinese;
          newlyTranslated++;
          if (item.kind === 'name') machineNames.push(`${item.text} => ${chinese}`);
        }
      } catch (error) {
        console.warn(`Translation batch failed, continuing without it: ${describeError(error)}`);
        // A bad key or an exhausted quota will fail every batch the same way; stop asking.
        if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.RateLimitError) break;
      }
    }
  }

  const output: TranslationsFile = {
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    model: MODEL,
    promptFingerprint: fingerprint,
    entries: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))),
  };
  await writeJsonAtomically(TRANSLATIONS_PATH, output);

  const missing = texts.length - fromGlossary - fromCache - newlyTranslated;
  console.log(
    [
      `Wrote ${TRANSLATIONS_PATH}`,
      `  texts: ${texts.length} (glossary ${fromGlossary}, cached ${fromCache}, new ${newlyTranslated}, still English ${missing})`,
    ].join('\n'),
  );
  if (machineNames.length > 0) {
    // Candidates to review and copy into data/glossary.zh.json.
    console.log(`Names translated by the model, not in the glossary yet:\n  ${machineNames.join('\n  ')}`);
  }
}

/** The error's message plus its causes; Node's fetch hides the real reason in `cause`. */
function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current !== undefined && current !== null && parts.length < 5) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(' ← caused by: ');
}

main().catch((error: unknown) => {
  // Even an unexpected crash must not block the deploy; the site falls back to English.
  console.error(`translate failed, the Chinese pages will show English text: ${describeError(error)}`);
});
