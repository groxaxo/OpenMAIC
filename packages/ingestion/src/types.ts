import { z } from 'zod';

export const DocumentTypeSchema = z.enum(['pdf', 'docx', 'txt', 'md', 'pptx', 'image']);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const IngestedDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: DocumentTypeSchema,
  sizeBytes: z.number().int().positive(),
  pageCount: z.number().int().positive().optional(),
  ingestedAt: z.string().datetime(),
  chunkCount: z.number().int().nonnegative().optional(),
});

export type IngestedDocument = z.infer<typeof IngestedDocumentSchema>;

export const TextChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentName: z.string(),
  pageNumber: z.number().int().positive().optional(),
  chunkIndex: z.number().int().nonnegative(),
  text: z.string(),
  tokenCount: z.number().int().nonnegative().optional(),
  embedding: z.array(z.number()).optional(),
});

export type TextChunk = z.infer<typeof TextChunkSchema>;
