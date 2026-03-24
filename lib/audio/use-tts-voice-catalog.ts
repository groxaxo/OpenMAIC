'use client';

import { useEffect, useMemo, useState } from 'react';
import { getTTSVoices } from './constants';
import type { TTSProviderId, TTSVoiceInfo } from './types';

interface UseTtsVoiceCatalogInput {
  providerId: TTSProviderId;
  apiKey?: string;
  baseUrl?: string;
  isServerConfigured?: boolean;
}

interface UseTtsVoiceCatalogResult {
  voices: TTSVoiceInfo[];
  loading: boolean;
  error: string | null;
}

export function useTtsVoiceCatalog({
  providerId,
  apiKey,
  baseUrl,
  isServerConfigured,
}: UseTtsVoiceCatalogInput): UseTtsVoiceCatalogResult {
  const staticVoices = useMemo(() => getTTSVoices(providerId), [providerId]);
  const [dynamicVoices, setDynamicVoices] = useState<TTSVoiceInfo[]>(staticVoices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providerId !== 'inworld-tts') {
      setDynamicVoices(staticVoices);
      setLoading(false);
      setError(null);
      return;
    }

    const effectiveApiKey = apiKey?.trim();
    const effectiveBaseUrl = baseUrl?.trim();
    if (!effectiveApiKey && !isServerConfigured) {
      setDynamicVoices([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/voices?provider=inworld', {
          method: 'GET',
          headers: {
            ...(effectiveApiKey ? { 'x-tts-api-key': effectiveApiKey } : {}),
            ...(effectiveBaseUrl ? { 'x-tts-base-url': effectiveBaseUrl } : {}),
          },
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | { voices?: TTSVoiceInfo[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load voices');
        }

        setDynamicVoices(payload?.voices ?? []);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setDynamicVoices([]);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load voices');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [apiKey, baseUrl, isServerConfigured, providerId, staticVoices]);

  return {
    voices: providerId === 'inworld-tts' ? dynamicVoices : staticVoices,
    loading,
    error,
  };
}
