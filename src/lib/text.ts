/**
 * The first `count` sentences of a text. A sentence ends at . ! or ? followed by
 * a space and a capital letter, so "U.S. Space Force" is not split in the middle.
 */
export function firstSentences(text: string, count: number): string {
  const pieces = text.trim().split(/(?<=[.!?])\s+(?=["“A-Z])/);
  const sentences: string[] = [];
  for (const piece of pieces) {
    const previous = sentences[sentences.length - 1];
    if (previous !== undefined && /\b[A-Z]\.$/.test(previous)) {
      sentences[sentences.length - 1] = `${previous} ${piece}`; // an initial like "U.S." — glue back
    } else {
      sentences.push(piece);
    }
  }
  return sentences.slice(0, count).join(' ');
}
