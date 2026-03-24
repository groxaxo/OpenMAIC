import { nanoid } from 'nanoid';
import type { TextChunk } from './types';

export interface ChunkOptions {
  /** Target number of characters per chunk, default 1000 */
  chunkSize?: number;
  /** Overlap between consecutive chunks in characters, default 200 */
  overlap?: number;
}

/**
 * Splits raw text into overlapping chunks suitable for retrieval.
 * This is a simple character-based chunker; production use should
 * prefer token-aware chunking (e.g., tiktoken) and sentence-boundary splitting.
 */
export function chunkText(
  text: string,
  documentId: string,
  documentName: string,
  options: ChunkOptions = {},
): TextChunk[] {
  const chunkSize = options.chunkSize ?? 1000;
  const overlap = options.overlap ?? 200;
  const chunks: TextChunk[] = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      id: nanoid(),
      documentId,
      documentName,
      chunkIndex: chunkIndex++,
      text: text.slice(start, end),
    });
    if (end === text.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}
