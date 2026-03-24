import { z } from 'zod';

export const EvalResultSchema = z.object({
  evalId: z.string(),
  sceneId: z.string().optional(),
  lessonId: z.string().optional(),
  score: z.number().min(0).max(1),
  passed: z.boolean(),
  details: z.record(z.string(), z.unknown()).optional(),
  evaluatedAt: z.string().datetime(),
});

export type EvalResult = z.infer<typeof EvalResultSchema>;

export const EvalDimensionSchema = z.enum([
  'factual-grounding',
  'pedagogical-coherence',
  'quiz-correctness',
  'slide-density',
  'narration-quality',
  'export-fidelity',
  'latency',
  'token-cost',
]);

export type EvalDimension = z.infer<typeof EvalDimensionSchema>;

export interface Evaluator<T> {
  dimension: EvalDimension;
  evaluate(input: T): Promise<EvalResult>;
}
