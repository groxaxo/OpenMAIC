import { z } from 'zod';

export const JobTypeSchema = z.enum([
  'lesson-generation',
  'scene-generation',
  'tts',
  'image-generation',
  'video-generation',
  'pdf-parse',
  'export-pptx',
  'export-html',
  'evaluation',
]);

export type JobType = z.infer<typeof JobTypeSchema>;

export const JobStatusSchema = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled',
]);

export type JobStatus = z.infer<typeof JobStatusSchema>;

export const JobSchema = z.object({
  id: z.string(),
  type: JobTypeSchema,
  status: JobStatusSchema,
  payload: z.record(z.string(), z.unknown()),
  result: z.unknown().optional(),
  error: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().positive().default(3),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

export type Job = z.infer<typeof JobSchema>;
