import { z } from 'zod';
import { SCENE_DSL_VERSION, SceneDSLSchema } from './scene';

export const LessonStatusSchema = z.enum([
  'draft',
  'generating',
  'ready',
  'published',
  'archived',
]);

export type LessonStatus = z.infer<typeof LessonStatusSchema>;

export const LessonSchema = z.object({
  id: z.string(),
  dslVersion: z.literal(SCENE_DSL_VERSION),
  title: z.string().min(1),
  description: z.string().optional(),
  language: z.enum(['zh-CN', 'en-US']),
  status: LessonStatusSchema,
  scenes: z.array(SceneDSLSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  metadata: z.object({
    topic: z.string().optional(),
    tags: z.array(z.string()).optional(),
    audienceLevel: z.string().optional(),
    estimatedDurationMinutes: z.number().positive().optional(),
    authorId: z.string().optional(),
  }).optional(),
});

export type Lesson = z.infer<typeof LessonSchema>;
