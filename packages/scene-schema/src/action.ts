import { z } from 'zod';

export const ActionBaseSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const SpotlightActionSchema = ActionBaseSchema.extend({
  type: z.literal('spotlight'),
  elementId: z.string(),
  dimOpacity: z.number().min(0).max(1).optional(),
});

export const LaserActionSchema = ActionBaseSchema.extend({
  type: z.literal('laser'),
  elementId: z.string(),
  color: z.string().optional(),
});

export const SpeechActionSchema = ActionBaseSchema.extend({
  type: z.literal('speech'),
  text: z.string().min(1),
  audioId: z.string().optional(),
  audioUrl: z.string().url().optional(),
  voice: z.string().optional(),
  speed: z.number().positive().optional(),
});

export const WbOpenActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_open'),
});

export const WbDrawTextActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_draw_text'),
  elementId: z.string().optional(),
  content: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional(),
});

export const WbDrawShapeActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_draw_shape'),
  elementId: z.string().optional(),
  shape: z.enum(['rectangle', 'circle', 'triangle']),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  fillColor: z.string().optional(),
});

export const WbDrawChartActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_draw_chart'),
  elementId: z.string().optional(),
  chartType: z.enum(['bar', 'column', 'line', 'pie', 'ring', 'area', 'radar', 'scatter']),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  data: z.object({
    labels: z.array(z.string()),
    legends: z.array(z.string()),
    series: z.array(z.array(z.number())),
  }),
  themeColors: z.array(z.string()).optional(),
});

export const WbDrawLatexActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_draw_latex'),
  elementId: z.string().optional(),
  latex: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  color: z.string().optional(),
});

export const WbDrawTableActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_draw_table'),
  elementId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  data: z.array(z.array(z.string())),
  outline: z.object({
    width: z.number(),
    style: z.string(),
    color: z.string(),
  }).optional(),
  theme: z.object({ color: z.string() }).optional(),
});

export const WbDrawLineActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_draw_line'),
  elementId: z.string().optional(),
  startX: z.number(),
  startY: z.number(),
  endX: z.number(),
  endY: z.number(),
  color: z.string().optional(),
  width: z.number().positive().optional(),
  style: z.enum(['solid', 'dashed']).optional(),
  points: z.tuple([z.enum(['', 'arrow']), z.enum(['', 'arrow'])]).optional(),
});

export const WbClearActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_clear'),
});

export const WbDeleteActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_delete'),
  elementId: z.string(),
});

export const WbCloseActionSchema = ActionBaseSchema.extend({
  type: z.literal('wb_close'),
});

export const PlayVideoActionSchema = ActionBaseSchema.extend({
  type: z.literal('play_video'),
  elementId: z.string(),
});

export const DiscussionActionSchema = ActionBaseSchema.extend({
  type: z.literal('discussion'),
  topic: z.string().min(1),
  prompt: z.string().optional(),
  agentId: z.string().optional(),
});

export const ActionSchema = z.discriminatedUnion('type', [
  SpotlightActionSchema,
  LaserActionSchema,
  SpeechActionSchema,
  WbOpenActionSchema,
  WbDrawTextActionSchema,
  WbDrawShapeActionSchema,
  WbDrawChartActionSchema,
  WbDrawLatexActionSchema,
  WbDrawTableActionSchema,
  WbDrawLineActionSchema,
  WbClearActionSchema,
  WbDeleteActionSchema,
  WbCloseActionSchema,
  PlayVideoActionSchema,
  DiscussionActionSchema,
]);

export type Action = z.infer<typeof ActionSchema>;
export type ActionType = Action['type'];
