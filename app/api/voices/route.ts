import { NextRequest } from 'next/server';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { createLogger } from '@/lib/logger';
import { listInworldVoices, INWORLD_DEFAULT_BASE_URL } from '@/lib/audio/inworld';
import { resolveTTSApiKey, resolveTTSBaseUrl } from '@/lib/server/provider-config';
import { validateUrlForSSRF } from '@/lib/server/ssrf-guard';

const log = createLogger('Voices API');

export const maxDuration = 30;

function getRequestedLanguages(searchParams: URLSearchParams): string[] {
  const values = new Set<string>();
  for (const key of ['language', 'languages'] as const) {
    for (const rawValue of searchParams.getAll(key)) {
      for (const value of rawValue.split(',')) {
        const normalized = value.trim();
        if (normalized) {
          values.add(normalized);
        }
      }
    }
  }
  return [...values];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');

    if (provider !== 'inworld' && provider !== 'inworld-tts') {
      return apiError(
        'INVALID_REQUEST',
        400,
        'Only provider=inworld is currently supported by this route',
      );
    }

    const clientApiKey = req.headers.get('x-tts-api-key')?.trim() || undefined;
    const clientBaseUrl = req.headers.get('x-tts-base-url')?.trim() || undefined;

    if (clientBaseUrl && process.env.NODE_ENV === 'production') {
      const ssrfError = validateUrlForSSRF(clientBaseUrl);
      if (ssrfError) {
        return apiError('INVALID_URL', 403, ssrfError);
      }
    }

    const apiKey = resolveTTSApiKey('inworld-tts', clientApiKey);
    if (!apiKey) {
      return apiError('MISSING_API_KEY', 400, 'API Key is required');
    }

    const baseUrl = resolveTTSBaseUrl('inworld-tts', clientBaseUrl) || INWORLD_DEFAULT_BASE_URL;
    const voices = await listInworldVoices({
      apiKey,
      baseUrl,
      languages: getRequestedLanguages(searchParams),
    });

    return apiSuccess({ voices });
  } catch (error) {
    log.error('Failed to fetch voices:', error);
    return apiError(
      'INTERNAL_ERROR',
      500,
      'Failed to fetch voices',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}
