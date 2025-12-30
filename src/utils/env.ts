type AppConfig = {
  VITE_API_URL?: string;
  VITE_USE_MOCK_ADAPTERS?: string;
  VITE_APP_VERSION?: string;
};

const runtimeConfig = (): AppConfig => {
  if (typeof window === 'undefined') {
    return {};
  }
  return (window as Window & { __APP_CONFIG__?: AppConfig }).__APP_CONFIG__ ?? {};
};

const normalizeEnvValue = (value?: string) => {
  if (value === undefined || value === null) {
    return '';
  }
  const trimmed = value.toString().trim();
  return trimmed.length > 0 ? trimmed : '';
};

const envValue = (key: keyof AppConfig): string => {
  const runtimeValue = normalizeEnvValue(runtimeConfig()[key]);
  if (runtimeValue) {
    return runtimeValue;
  }
  return normalizeEnvValue((import.meta.env as AppConfig)[key]);
};

export const getApiBaseUrl = (): string => envValue('VITE_API_URL');

export const useMockAdapters = (): boolean => {
  const value = envValue('VITE_USE_MOCK_ADAPTERS').toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
};

export const getAppVersion = (): string => envValue('VITE_APP_VERSION') || 'dev';

export const getShortAppVersion = (): string => getAppVersion().slice(0, 7);
