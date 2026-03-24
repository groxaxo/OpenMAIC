import type { TimelineEvent, TimelineEventType } from '@openmaic/scene-schema';

export type { TimelineEvent, TimelineEventType };

/** Handler called when a timeline event fires */
export type TimelineEventHandler = (event: TimelineEvent) => void | Promise<void>;

/** Subscription returned by subscribe() — call remove() to unsubscribe */
export interface TimelineSubscription {
  remove: () => void;
}
