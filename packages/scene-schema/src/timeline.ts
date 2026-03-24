import { z } from 'zod';

/**
 * Every observable event in the classroom is typed here.
 * This enables replay, debugging, export, and time travel.
 */

export const TimelineEventTypeSchema = z.enum([
  'agent.speak.started',
  'agent.speak.ended',
  'agent.speak.delta',
  'whiteboard.open',
  'whiteboard.close',
  'whiteboard.clear',
  'whiteboard.draw.text',
  'whiteboard.draw.shape',
  'whiteboard.draw.chart',
  'whiteboard.draw.latex',
  'whiteboard.draw.table',
  'whiteboard.draw.line',
  'whiteboard.element.deleted',
  'slide.transition',
  'slide.element.spotlight',
  'slide.element.laser',
  'video.play.started',
  'video.play.ended',
  'quiz.answer.submitted',
  'quiz.graded',
  'discussion.started',
  'discussion.ended',
  'discussion.message',
  'teacher.interrupted',
  'session.started',
  'session.ended',
  'scene.started',
  'scene.ended',
]);

export type TimelineEventType = z.infer<typeof TimelineEventTypeSchema>;

export const TimelineEventBaseSchema = z.object({
  id: z.string(),
  type: TimelineEventTypeSchema,
  sessionId: z.string(),
  sceneId: z.string().optional(),
  /** Wall-clock timestamp (ms since epoch) */
  timestamp: z.number().int().positive(),
  /** Offset from session start (ms) */
  offset: z.number().int().nonnegative(),
});

export type TimelineEventBase = z.infer<typeof TimelineEventBaseSchema>;

/** Generic timeline event with typed payload */
export const TimelineEventSchema = TimelineEventBaseSchema.extend({
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

/** A complete timeline of events for one session */
export const SessionTimelineSchema = z.object({
  sessionId: z.string(),
  lessonId: z.string(),
  startedAt: z.number().int().positive(),
  endedAt: z.number().int().positive().optional(),
  events: z.array(TimelineEventSchema),
});

export type SessionTimeline = z.infer<typeof SessionTimelineSchema>;
