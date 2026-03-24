/**
 * gateway-realtime
 *
 * Low-latency WebSocket / SSE gateway for live classroom sessions.
 *
 * Responsibilities:
 *   - Accept WebSocket connections from classroom clients
 *   - Fan out timeline events to all connected participants
 *   - Handle teacher interrupts and discussion starts
 *   - Bridge to the playback engine for timeline-driven sessions
 *
 * Intended runtime: standalone Node.js HTTP server.
 * Production: use uWebSockets.js or Bun for high-throughput WS.
 */

import type { TimelineEvent } from '@openmaic/scene-schema';

export interface GatewaySession {
  id: string;
  classroomId: string;
  connectedAt: Date;
  /** Send a timeline event to this session's client */
  send(event: TimelineEvent): void;
  /** Close the connection */
  close(): void;
}

export interface RealtimeGatewayConfig {
  port?: number;
  heartbeatIntervalMs?: number;
}

/**
 * Starts the realtime gateway server.
 *
 * Production implementation should use an HTTP framework (Hono, Fastify, Bun)
 * with native WebSocket support and integrate with the playback engine.
 */
export async function startRealtimeGateway(
  config: RealtimeGatewayConfig = {},
): Promise<void> {
  const port = config.port ?? 4001;
  console.log('[gateway-realtime] Listening on port %d (stub)', port);
  // TODO: initialize WebSocket server and connect to playback engine
}
