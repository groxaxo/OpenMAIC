import { createHash } from 'crypto';
import type { TTSVoiceInfo } from './types';

export const INWORLD_DEFAULT_BASE_URL = 'https://api.inworld.ai';

const INWORLD_SUPPORTED_LANGUAGES = new Set([
  'en',
  'zh',
  'ja',
  'ko',
  'ru',
  'it',
  'es',
  'pt',
  'fr',
  'de',
  'pl',
  'nl',
  'hi',
  'he',
  'ar',
]);

const INWORLD_DEFAULT_LOCALE_PREFERENCE: string[] = [
  'EN_US',
  'ES_ES',
  'PT_BR',
  'AR_SA',
  'HE_IL',
  'HI_IN',
  'ZH_CN',
  'JA_JP',
  'KO_KR',
  'RU_RU',
  'FR_FR',
  'DE_DE',
  'IT_IT',
  'PL_PL',
  'NL_NL',
];

const INWORLD_DEFAULT_LOCALE_BY_LANGUAGE: Record<string, string> = {
  en: 'EN_US',
  es: 'ES_ES',
  pt: 'PT_BR',
  ar: 'AR_SA',
  he: 'HE_IL',
  hi: 'HI_IN',
  zh: 'ZH_CN',
  ja: 'JA_JP',
  ko: 'KO_KR',
  ru: 'RU_RU',
  fr: 'FR_FR',
  de: 'DE_DE',
  it: 'IT_IT',
  pl: 'PL_PL',
  nl: 'NL_NL',
};

type InworldVoice = {
  voiceId: string;
  displayName?: string;
  description?: string;
  tags?: string[];
  source?: 'SYSTEM' | 'IVC' | 'PVC';
  langCode?: string;
};

type InworldListVoicesResponse = {
  voices?: InworldVoice[];
};

type CachedVoiceList = {
  expiresAt: number;
  voices: TTSVoiceInfo[];
};

const voiceCache = new Map<string, CachedVoiceList>();
const CACHE_TTL_MILLISECONDS = 5 * 60 * 1000;

function purgeExpiredVoiceCache(now: number): void {
  for (const [key, value] of voiceCache.entries()) {
    if (value.expiresAt <= now) {
      voiceCache.delete(key);
    }
  }
}

function getInworldAuthHeader(apiKey: string): string {
  return apiKey.startsWith('Basic ') ? apiKey : `Basic ${apiKey}`;
}

export function normalizeInworldLanguageCode(input?: string): string | undefined {
  if (!input) return undefined;
  const normalized = input.trim().toLowerCase().replace(/-/g, '_');
  const [base] = normalized.split('_');
  return INWORLD_SUPPORTED_LANGUAGES.has(base) ? base : undefined;
}

function compareVoicesByLocalePreference(a?: string, b?: string): number {
  const normalizedA = a?.toUpperCase();
  const normalizedB = b?.toUpperCase();
  const aIndex = normalizedA ? INWORLD_DEFAULT_LOCALE_PREFERENCE.indexOf(normalizedA) : -1;
  const bIndex = normalizedB ? INWORLD_DEFAULT_LOCALE_PREFERENCE.indexOf(normalizedB) : -1;

  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;
  return (normalizedA || '').localeCompare(normalizedB || '');
}

export function mapInworldVoiceToTtsVoice(voice: InworldVoice): TTSVoiceInfo {
  return {
    id: voice.voiceId,
    name: voice.displayName?.trim() || voice.voiceId,
    language: normalizeInworldLanguageCode(voice.langCode) || 'en',
    description: voice.description?.trim() || undefined,
    langCodeRaw: voice.langCode,
    source: voice.source || 'SYSTEM',
    tags: voice.tags ?? [],
  };
}

export function sortInworldVoices(voices: TTSVoiceInfo[]): TTSVoiceInfo[] {
  return [...voices].sort((a, b) => {
    const aSystem = a.source === 'SYSTEM';
    const bSystem = b.source === 'SYSTEM';
    if (aSystem !== bSystem) return aSystem ? -1 : 1;

    const localeCompare = compareVoicesByLocalePreference(a.langCodeRaw, b.langCodeRaw);
    if (localeCompare !== 0) return localeCompare;

    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function filterInworldVoices(voices: TTSVoiceInfo[], languages?: string[]): TTSVoiceInfo[] {
  if (!languages?.length) return voices;
  const normalized = new Set(languages.map((language) => normalizeInworldLanguageCode(language)).filter(Boolean));
  if (!normalized.size) return voices;
  return voices.filter((voice) => normalized.has(voice.language));
}

function getCacheKey(apiKey: string, baseUrl: string): string {
  return createHash('sha256').update(`${baseUrl}::${apiKey}`).digest('hex');
}

export async function listInworldVoices(input: {
  apiKey: string;
  baseUrl?: string;
  languages?: string[];
}): Promise<TTSVoiceInfo[]> {
  const baseUrl = input.baseUrl?.trim().replace(/\/+$/, '') || INWORLD_DEFAULT_BASE_URL;
  const cacheKey = getCacheKey(input.apiKey, baseUrl);
  const now = Date.now();
  purgeExpiredVoiceCache(now);
  const cached = voiceCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return filterInworldVoices(cached.voices, input.languages);
  }

  const params = new URLSearchParams();
  for (const language of input.languages ?? []) {
    const normalized = normalizeInworldLanguageCode(language);
    if (normalized) params.append('languages', normalized);
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${baseUrl}/voices/v1/voices${query}`, {
    method: 'GET',
    headers: {
      Authorization: getInworldAuthHeader(input.apiKey),
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    redirect: 'manual',
  });

  if (response.status >= 300 && response.status < 400) {
    throw new Error('Inworld voice catalog redirects are not allowed');
  }

  if (!response.ok) {
    const body = await response.text().catch(() => response.statusText);
    throw new Error(`Inworld voice catalog error ${response.status}: ${body || response.statusText}`);
  }

  const data = (await response.json()) as InworldListVoicesResponse;
  const voices = sortInworldVoices((data.voices ?? []).map(mapInworldVoiceToTtsVoice));
  voiceCache.set(cacheKey, { voices, expiresAt: now + CACHE_TTL_MILLISECONDS });
  return filterInworldVoices(voices, input.languages);
}

export function pickDefaultInworldVoice(
  voices: TTSVoiceInfo[],
  preferredLanguage?: string,
): TTSVoiceInfo | undefined {
  if (!voices.length) return undefined;

  const normalizedLanguage = normalizeInworldLanguageCode(preferredLanguage);
  const defaultLocale = normalizedLanguage
    ? INWORLD_DEFAULT_LOCALE_BY_LANGUAGE[normalizedLanguage]
    : undefined;
  const sameLanguage = normalizedLanguage
    ? voices.filter((voice) => voice.language === normalizedLanguage)
    : voices;

  const rankedBuckets = [sameLanguage, voices].filter((bucket, index, buckets) => {
    if (index === 0) return bucket.length > 0;
    return bucket.length > 0 && bucket !== buckets[0];
  });

  for (const bucket of rankedBuckets) {
    if (defaultLocale) {
      const preferredSystemVoice = bucket.find(
        (voice) => voice.source === 'SYSTEM' && voice.langCodeRaw?.toUpperCase() === defaultLocale,
      );
      if (preferredSystemVoice) return preferredSystemVoice;
    }

    const firstSystemVoice = bucket.find((voice) => voice.source === 'SYSTEM');
    if (firstSystemVoice) return firstSystemVoice;

    if (bucket[0]) return bucket[0];
  }

  return voices[0];
}

export function mapInworldEncodingToFormat(
  encoding: 'MP3' | 'LINEAR16' | 'OPUS' | 'MULAW' | 'ALAW',
): string {
  switch (encoding) {
    case 'LINEAR16':
      return 'wav';
    case 'OPUS':
      return 'ogg';
    case 'MULAW':
    case 'ALAW':
      return 'basic';
    case 'MP3':
    default:
      return 'mp3';
  }
}
