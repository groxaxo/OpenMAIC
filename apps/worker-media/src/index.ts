/**
 * worker-media
 *
 * Background worker responsible for media asset generation:
 *   - TTS audio synthesis
 *   - AI image generation
 *   - Video generation / transcription
 *   - PDF page rendering / OCR
 *
 * Intended runtime: Node.js process (or container).
 * Job queue: integrate with BullMQ / Temporal in production.
 */

import type { Job } from '@openmaic/core-domain';

const MEDIA_JOB_TYPES: Array<Job['type']> = ['tts', 'image-generation', 'video-generation', 'pdf-parse'];

export interface MediaWorkerConfig {
  pollIntervalMs?: number;
  concurrency?: number;
}

export interface JobQueue {
  dequeue(type: Job['type']): Promise<Job | null>;
  update(id: string, patch: Partial<Pick<Job, 'status' | 'progress' | 'result' | 'error'>>): Promise<void>;
}

export async function startMediaWorker(
  queue: JobQueue,
  config: MediaWorkerConfig = {},
): Promise<void> {
  const pollIntervalMs = config.pollIntervalMs ?? 5000;

  console.log('[worker-media] Starting. pollIntervalMs=%d', pollIntervalMs);

  const poll = async () => {
    for (const type of MEDIA_JOB_TYPES) {
      const job = await queue.dequeue(type);
      if (job) {
        console.log('[worker-media] Processing %s job %s', type, job.id);
        await queue.update(job.id, { status: 'processing', progress: 0 });
        try {
          // TODO: invoke provider-specific handler here
          await queue.update(job.id, { status: 'succeeded', progress: 100 });
        } catch (err) {
          await queue.update(job.id, {
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
          });
        }
        break;
      }
    }
    setTimeout(poll, pollIntervalMs);
  };

  await poll();
}
