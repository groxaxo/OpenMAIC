/**
 * worker-generation
 *
 * Background worker responsible for running the lesson generation pipeline:
 *   pending jobs → outline generation → scene generation → mark succeeded
 *
 * Intended runtime: Node.js process (or container).
 * Job queue: integrate with BullMQ / Temporal in production.
 *
 * For now this is a stub that documents the expected interface.
 */

import type { Job } from '@openmaic/core-domain';

export interface GenerationWorkerConfig {
  /** Poll interval for new jobs (ms), default 5000 */
  pollIntervalMs?: number;
  /** Max concurrent jobs, default 3 */
  concurrency?: number;
}

export interface JobQueue {
  /** Dequeue the next pending job of given type */
  dequeue(type: Job['type']): Promise<Job | null>;
  /** Update job status and result */
  update(id: string, patch: Partial<Pick<Job, 'status' | 'progress' | 'result' | 'error'>>): Promise<void>;
}

export async function startGenerationWorker(
  queue: JobQueue,
  config: GenerationWorkerConfig = {},
): Promise<void> {
  const pollIntervalMs = config.pollIntervalMs ?? 5000;

  console.log('[worker-generation] Starting. pollIntervalMs=%d', pollIntervalMs);

  // Production: replace this loop with a BullMQ Worker or Temporal workflow.
  const poll = async () => {
    const job = await queue.dequeue('lesson-generation');
    if (job) {
      console.log('[worker-generation] Processing job %s', job.id);
      await queue.update(job.id, { status: 'processing', progress: 0 });
      try {
        // TODO: invoke generation pipeline here
        await queue.update(job.id, { status: 'succeeded', progress: 100 });
      } catch (err) {
        await queue.update(job.id, {
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    setTimeout(poll, pollIntervalMs);
  };

  await poll();
}
