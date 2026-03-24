import type { SessionTimeline, TimelineEvent } from '@openmaic/scene-schema';
import type { TimelineEventHandler, TimelineSubscription } from './events';

export type PlayerState = 'idle' | 'playing' | 'paused' | 'ended';

export interface TimelinePlayerOptions {
  /** Playback speed multiplier, default 1 */
  speed?: number;
  /** Start offset in ms, default 0 */
  startOffset?: number;
}

/**
 * TimelinePlayer drives a recorded SessionTimeline at wall-clock speed.
 *
 * Usage:
 *   const player = new TimelinePlayer(timeline);
 *   player.on('agent.speak.started', handler);
 *   player.play();
 */
export class TimelinePlayer {
  private timeline: SessionTimeline;
  private speed: number;
  private startOffset: number;

  private state: PlayerState = 'idle';
  private currentOffset = 0;
  private handlers = new Map<string, Set<TimelineEventHandler>>();
  private stateHandlers = new Set<(state: PlayerState) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pendingEvents: TimelineEvent[] = [];

  constructor(timeline: SessionTimeline, options: TimelinePlayerOptions = {}) {
    this.timeline = timeline;
    this.speed = options.speed ?? 1;
    this.startOffset = options.startOffset ?? 0;
  }

  /** Subscribe to a specific timeline event type */
  on(type: string, handler: TimelineEventHandler): TimelineSubscription {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return { remove: () => this.handlers.get(type)?.delete(handler) };
  }

  /** Subscribe to player state changes */
  onStateChange(handler: (state: PlayerState) => void): TimelineSubscription {
    this.stateHandlers.add(handler);
    return { remove: () => this.stateHandlers.delete(handler) };
  }

  get currentState(): PlayerState {
    return this.state;
  }

  get offsetMs(): number {
    return this.currentOffset;
  }

  play(): void {
    if (this.state === 'playing') return;
    this.pendingEvents = this.timeline.events
      .filter((e) => e.offset >= this.startOffset)
      .sort((a, b) => a.offset - b.offset);
    this.setState('playing');
    this.scheduleNext();
  }

  pause(): void {
    if (this.state !== 'playing') return;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.setState('playing');
    this.scheduleNext();
  }

  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentOffset = 0;
    this.pendingEvents = [];
    this.setState('idle');
  }

  seek(offsetMs: number): void {
    const wasPaused = this.state === 'paused';
    this.stop();
    this.startOffset = offsetMs;
    if (!wasPaused) this.play();
  }

  private setState(next: PlayerState): void {
    this.state = next;
    this.stateHandlers.forEach((h) => h(next));
  }

  private scheduleNext(): void {
    if (this.pendingEvents.length === 0) {
      this.setState('ended');
      return;
    }

    const next = this.pendingEvents[0];
    const delay = Math.max(0, (next.offset - this.currentOffset) / this.speed);

    this.timer = setTimeout(() => {
      if (this.state !== 'playing') return;
      this.pendingEvents.shift();
      this.currentOffset = next.offset;
      this.fireEvent(next);
      this.scheduleNext();
    }, delay);
  }

  private fireEvent(event: TimelineEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(event);
        } catch {
          // swallow handler errors to keep playback running
        }
      });
    }
  }
}
