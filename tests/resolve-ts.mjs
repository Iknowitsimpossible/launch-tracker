/*
 * Lets Node's built-in test runner load the app's TypeScript as written.
 *
 * Node runs .ts files directly (type stripping), but its import rules are
 * stricter than Next's bundler: it needs the file extension ("./links.ts") and
 * knows nothing about the "@/" alias from tsconfig.json. The app's code uses
 * both shortcuts, so this hook fills them in, only when a plain lookup fails.
 * It also tells Node the app's .ts files are ES modules (the root package.json
 * doesn't say, and changing it could affect Next's own config loading).
 *
 * Loaded with: node --import ./tests/resolve-ts.mjs --test
 */
import { registerHooks } from 'node:module';

const srcDir = new URL('../src/', import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      specifier = new URL(specifier.slice(2), srcDir).href;
    }
    let result;
    try {
      result = nextResolve(specifier, context);
    } catch (error) {
      const isRelative = /^(\.{1,2}\/|file:)/.test(specifier);
      if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !isRelative) throw error;
      result = nextResolve(`${specifier}.ts`, context);
    }
    return result.url.endsWith('.ts') ? { ...result, format: 'module-typescript' } : result;
  },
});
