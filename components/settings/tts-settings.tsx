'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useSettingsStore } from '@/lib/store/settings';
import { TTS_PROVIDERS, DEFAULT_TTS_VOICES, getTTSVoices } from '@/lib/audio/constants';
import type { TTSProviderId, TTSVoiceSource } from '@/lib/audio/types';
import { Volume2, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { useTTSPreview } from '@/lib/audio/use-tts-preview';
import { useTtsVoiceCatalog } from '@/lib/audio/use-tts-voice-catalog';

const log = createLogger('TTSSettings');

interface TTSSettingsProps {
  selectedProviderId: TTSProviderId;
}

export function TTSSettings({ selectedProviderId }: TTSSettingsProps) {
  const { t } = useI18n();

  const ttsVoice = useSettingsStore((state) => state.ttsVoice);
  const ttsSpeed = useSettingsStore((state) => state.ttsSpeed);
  const ttsProvidersConfig = useSettingsStore((state) => state.ttsProvidersConfig);
  const setTTSProviderConfig = useSettingsStore((state) => state.setTTSProviderConfig);
  const setTTSVoice = useSettingsStore((state) => state.setTTSVoice);
  const activeProviderId = useSettingsStore((state) => state.ttsProviderId);

  const ttsProvider = TTS_PROVIDERS[selectedProviderId] ?? TTS_PROVIDERS['openai-tts'];
  const isServerConfigured = !!ttsProvidersConfig[selectedProviderId]?.isServerConfigured;

  const [showApiKey, setShowApiKey] = useState(false);
  const [previewVoiceOverride, setPreviewVoiceOverride] = useState<string | null>(null);
  const [selectedInworldLanguage, setSelectedInworldLanguage] = useState<string>('all');
  const [selectedInworldSource, setSelectedInworldSource] = useState<string>('all');
  const [selectedInworldTag, setSelectedInworldTag] = useState<string>('all');
  const [inworldSearch, setInworldSearch] = useState('');
  const [testText, setTestText] = useState(t('settings.ttsTestTextDefault'));
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const { previewing: testingTTS, startPreview, stopPreview } = useTTSPreview();
  const {
    voices: dynamicVoices,
    loading: loadingVoices,
    error: voiceLoadError,
  } = useTtsVoiceCatalog({
    providerId: selectedProviderId,
    apiKey: ttsProvidersConfig[selectedProviderId]?.apiKey,
    baseUrl: ttsProvidersConfig[selectedProviderId]?.baseUrl,
    isServerConfigured,
  });

  const availableVoices = useMemo(
    () => (selectedProviderId === 'inworld-tts' ? dynamicVoices : getTTSVoices(selectedProviderId)),
    [dynamicVoices, selectedProviderId],
  );

  const inworldLanguages = useMemo(
    () =>
      Array.from(new Set(dynamicVoices.map((voice) => voice.language))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [dynamicVoices],
  );

  const inworldSources = useMemo(
    () =>
      Array.from(
        new Set(
          dynamicVoices
            .map((voice) => voice.source)
            .filter((source): source is TTSVoiceSource => !!source),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [dynamicVoices],
  );

  const inworldTags = useMemo(
    () =>
      Array.from(new Set(dynamicVoices.flatMap((voice) => voice.tags ?? []))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [dynamicVoices],
  );

  const filteredVoices = useMemo(() => {
    if (selectedProviderId !== 'inworld-tts') return availableVoices;
    const search = inworldSearch.trim().toLowerCase();
    return availableVoices.filter((voice) => {
      if (selectedInworldLanguage !== 'all' && voice.language !== selectedInworldLanguage) {
        return false;
      }
      if (selectedInworldSource !== 'all' && voice.source !== selectedInworldSource) {
        return false;
      }
      if (selectedInworldTag !== 'all' && !(voice.tags ?? []).includes(selectedInworldTag)) {
        return false;
      }
      if (!search) return true;
      return [voice.name, voice.description, voice.langCodeRaw, voice.language, ...(voice.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [
    availableVoices,
    inworldSearch,
    selectedInworldLanguage,
    selectedInworldSource,
    selectedInworldTag,
    selectedProviderId,
  ]);

  const effectiveVoice =
    selectedProviderId === activeProviderId
      ? ttsVoice
      : previewVoiceOverride || filteredVoices[0]?.id || DEFAULT_TTS_VOICES[selectedProviderId] || 'default';

  const selectedVoice =
    filteredVoices.find((voice) => voice.id === effectiveVoice) ||
    availableVoices.find((voice) => voice.id === effectiveVoice);

  // Update test text when language changes
  useEffect(() => {
    setTestText(t('settings.ttsTestTextDefault'));
  }, [t]);

  // Reset state when provider changes
  useEffect(() => {
    stopPreview();
    setShowApiKey(false);
    setTestStatus('idle');
    setTestMessage('');
    setPreviewVoiceOverride(null);
    setSelectedInworldLanguage('all');
    setSelectedInworldSource('all');
    setSelectedInworldTag('all');
    setInworldSearch('');
  }, [selectedProviderId, stopPreview]);

  useEffect(() => {
    if (filteredVoices.length === 0) return;

    if (selectedProviderId === activeProviderId) {
      if (!filteredVoices.some((voice) => voice.id === ttsVoice)) {
        setTTSVoice(filteredVoices[0].id);
      }
      return;
    }

    if (!previewVoiceOverride || !filteredVoices.some((voice) => voice.id === previewVoiceOverride)) {
      setPreviewVoiceOverride(filteredVoices[0].id);
    }
  }, [
    activeProviderId,
    filteredVoices,
    previewVoiceOverride,
    selectedProviderId,
    setTTSVoice,
    ttsVoice,
  ]);

  const handleVoiceChange = (voiceId: string) => {
    if (selectedProviderId === activeProviderId) {
      setTTSVoice(voiceId);
      return;
    }

    setPreviewVoiceOverride(voiceId);
  };

  const handleTestTTS = async () => {
    if (!testText.trim()) return;

    setTestStatus('testing');
    setTestMessage('');

    try {
      await startPreview({
        text: testText,
        providerId: selectedProviderId,
        voice: effectiveVoice,
        speed: ttsSpeed,
        apiKey: ttsProvidersConfig[selectedProviderId]?.apiKey,
        baseUrl: ttsProvidersConfig[selectedProviderId]?.baseUrl,
      });
      setTestStatus('success');
      setTestMessage(t('settings.ttsTestSuccess'));
    } catch (error) {
      log.error('TTS test failed:', error);
      setTestStatus('error');
      setTestMessage(
        error instanceof Error && error.message
          ? `${t('settings.ttsTestFailed')}: ${error.message}`
          : t('settings.ttsTestFailed'),
      );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Server-configured notice */}
      {isServerConfigured && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300">
          {t('settings.serverConfiguredNotice')}
        </div>
      )}

      {/* API Key & Base URL */}
      {(ttsProvider.requiresApiKey || isServerConfigured) && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('settings.ttsApiKey')}</Label>
              <div className="relative">
                <Input
                  name={`tts-api-key-${selectedProviderId}`}
                  type={showApiKey ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={
                    isServerConfigured ? t('settings.optionalOverride') : t('settings.enterApiKey')
                  }
                  value={ttsProvidersConfig[selectedProviderId]?.apiKey || ''}
                  onChange={(e) =>
                    setTTSProviderConfig(selectedProviderId, {
                      apiKey: e.target.value,
                    })
                  }
                  className="font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('settings.ttsBaseUrl')}</Label>
              <Input
                name={`tts-base-url-${selectedProviderId}`}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={ttsProvider.defaultBaseUrl || t('settings.enterCustomBaseUrl')}
                value={ttsProvidersConfig[selectedProviderId]?.baseUrl || ''}
                onChange={(e) =>
                  setTTSProviderConfig(selectedProviderId, {
                    baseUrl: e.target.value,
                  })
                }
                className="text-sm"
              />
            </div>
          </div>
          {/* Request URL Preview */}
          {(() => {
            const effectiveBaseUrl =
              ttsProvidersConfig[selectedProviderId]?.baseUrl || ttsProvider.defaultBaseUrl || '';
            if (!effectiveBaseUrl) return null;
            let endpointPath = '';
              switch (selectedProviderId) {
                case 'openai-tts':
                case 'glm-tts':
                  endpointPath = '/audio/speech';
                  break;
                case 'azure-tts':
                  endpointPath = '/cognitiveservices/v1';
                  break;
                case 'qwen-tts':
                  endpointPath = '/services/aigc/multimodal-generation/generation';
                  break;
                case 'inworld-tts':
                  endpointPath = '/tts/v1/voice';
                  break;
                case 'elevenlabs-tts':
                  endpointPath = '/text-to-speech';
                  break;
              }
            if (!endpointPath) return null;
            return (
              <p className="text-xs text-muted-foreground break-all">
                {t('settings.requestUrl')}: {effectiveBaseUrl + endpointPath}
              </p>
            );
          })()}
        </>
      )}

      <div className="space-y-4">
        {selectedProviderId === 'inworld-tts' && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('settings.ttsLanguageFilter')}</Label>
              <Select value={selectedInworldLanguage} onValueChange={setSelectedInworldLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('settings.allLanguages')}</SelectItem>
                  {inworldLanguages.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{t('settings.inworldSourceFilter')}</Label>
              <Select value={selectedInworldSource} onValueChange={setSelectedInworldSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('settings.allSources')}</SelectItem>
                  {inworldSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{t('settings.inworldTagsFilter')}</Label>
              <Select value={selectedInworldTag} onValueChange={setSelectedInworldTag}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('settings.allTags')}</SelectItem>
                  {inworldTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{t('settings.inworldVoiceSearch')}</Label>
              <Input
                value={inworldSearch}
                onChange={(event) => setInworldSearch(event.target.value)}
                placeholder={t('settings.inworldVoiceSearch')}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm">{t('settings.ttsVoice')}</Label>
          <Select value={effectiveVoice} onValueChange={handleVoiceChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {loadingVoices ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {t('settings.loadingVoices')}
                </div>
              ) : filteredVoices.length > 0 ? (
                filteredVoices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                    {selectedProviderId === 'inworld-tts' &&
                      ` · ${voice.langCodeRaw || voice.language} · ${voice.source || 'SYSTEM'}`}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {availableVoices.length === 0
                    ? t('settings.noVoicesAvailable')
                    : t('settings.noVoicesMatchFilter')}
                </div>
              )}
            </SelectContent>
          </Select>
          {voiceLoadError && (
            <p className="text-xs text-red-600 dark:text-red-400 break-all">
              {t('settings.fetchVoicesFailed')}: {voiceLoadError}
            </p>
          )}
          {selectedVoice && (
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{selectedVoice.name}</p>
              <p>
                {(selectedVoice.langCodeRaw || selectedVoice.language) ?? ''}
                {selectedVoice.source ? ` · ${selectedVoice.source}` : ''}
              </p>
              {selectedVoice.description && <p>{selectedVoice.description}</p>}
              {!!selectedVoice.tags?.length && <p>{selectedVoice.tags.join(', ')}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Test TTS */}
      <div className="space-y-2">
        <Label className="text-sm">{t('settings.testTTS')}</Label>
        <div className="flex gap-2">
          <Input
            placeholder={t('settings.ttsTestTextPlaceholder')}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleTestTTS}
            disabled={
              testingTTS ||
              !testText.trim() ||
              (ttsProvider.requiresApiKey &&
                !ttsProvidersConfig[selectedProviderId]?.apiKey?.trim() &&
                !isServerConfigured)
            }
            size="default"
            className="gap-2 w-32"
          >
            {testingTTS ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            {t('settings.testTTS')}
          </Button>
        </div>
      </div>

      {testMessage && (
        <div
          className={cn(
            'rounded-lg p-3 text-sm overflow-hidden',
            testStatus === 'success' &&
              'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800',
            testStatus === 'error' &&
              'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
          )}
        >
          <div className="flex items-start gap-2 min-w-0">
            {testStatus === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />}
            {testStatus === 'error' && <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <p className="flex-1 min-w-0 break-all">{testMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
