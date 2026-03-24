import { z } from 'zod';

export const ClassroomStatusSchema = z.enum([
  'scheduled',
  'live',
  'ended',
  'archived',
]);

export type ClassroomStatus = z.infer<typeof ClassroomStatusSchema>;

export const ClassroomSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  title: z.string(),
  status: ClassroomStatusSchema,
  hostId: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  sessionTimelineId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Classroom = z.infer<typeof ClassroomSchema>;
