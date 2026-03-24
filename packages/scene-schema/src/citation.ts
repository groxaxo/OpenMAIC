import { z } from 'zod';

/** A chunk of source content that was used to produce scene content */
export const SourceChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentName: z.string(),
  pageNumber: z.number().int().positive().optional(),
  chunkIndex: z.number().int().nonnegative(),
  text: z.string(),
  score: z.number().min(0).max(1).optional(),
});

export type SourceChunk = z.infer<typeof SourceChunkSchema>;

/** A citation linking a scene to specific source chunks */
export const CitationSchema = z.object({
  sceneId: z.string(),
  chunks: z.array(SourceChunkSchema),
  generatedAt: z.string().datetime(),
});

export type Citation = z.infer<typeof CitationSchema>;
