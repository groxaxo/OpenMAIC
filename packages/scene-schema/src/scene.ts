import { z } from 'zod';
import { ActionSchema } from './action';
import { CitationSchema } from './citation';

export const SCENE_DSL_VERSION = '1.0';

export const SceneTypeSchema = z.enum(['slide', 'quiz', 'interactive', 'pbl']);

export const PedagogicalGoalSchema = z.object({
  objective: z.string().min(1),
  bloomsLevel: z.enum([
    'remember',
    'understand',
    'apply',
    'analyze',
    'evaluate',
    'create',
  ]).optional(),
  estimatedDurationSeconds: z.number().positive().optional(),
  prerequisites: z.array(z.string()).optional(),
});

export const ExportRulesSchema = z.object({
  includePptx: z.boolean().default(true),
  includeHtml: z.boolean().default(false),
  includeTranscript: z.boolean().default(true),
  speakerNotes: z.string().optional(),
});

export const ValidationRulesSchema = z.object({
  minActions: z.number().int().nonnegative().optional(),
  maxActions: z.number().int().positive().optional(),
  requiresSpeech: z.boolean().optional(),
  requiresCitation: z.boolean().optional(),
});

/** The core Scene DSL — every scene in OpenMAIC compiles to this shape */
export const SceneDSLSchema = z.object({
  /** DSL version for forward/backward compat */
  dslVersion: z.literal(SCENE_DSL_VERSION),
  id: z.string(),
  stageId: z.string(),
  type: SceneTypeSchema,
  title: z.string().min(1),
  order: z.number().int().nonnegative(),

  /** What students should learn from this scene */
  pedagogicalGoal: PedagogicalGoalSchema,

  /**
   * Render payload — type-specific content.
   * Intentionally kept as unknown here; each scene type's
   * renderer validates its own payload shape.
   */
  renderPayload: z.unknown(),

  /** Agent script — ordered list of actions to execute */
  agentScript: z.array(ActionSchema),

  /** Source citations that produced this scene */
  citations: z.array(CitationSchema).optional(),

  /** Export configuration */
  exportRules: ExportRulesSchema.optional(),

  /** Validation constraints */
  validationRules: ValidationRulesSchema.optional(),

  /** Multi-agent configuration */
  multiAgent: z.object({
    enabled: z.boolean(),
    agentIds: z.array(z.string()),
    directorPrompt: z.string().optional(),
  }).optional(),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type SceneDSL = z.infer<typeof SceneDSLSchema>;

/** Validate a scene object against the DSL schema */
export function validateScene(data: unknown): SceneDSL {
  return SceneDSLSchema.parse(data);
}

/** Safely validate a scene — returns null on failure */
export function tryValidateScene(data: unknown): SceneDSL | null {
  const result = SceneDSLSchema.safeParse(data);
  return result.success ? result.data : null;
}
