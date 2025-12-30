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

const envValue = (key: keyof AppConfig): string => {
  const fromRuntime = runtimeConfig()[key];
  const fromBuild = (import.meta.env as AppConfig)[key];
  return (fromRuntime ?? fromBuild ?? '').toString();
};

export const getApiBaseUrl = (): string => envValue('VITE_API_URL').trim();

export const useMockAdapters = (): boolean => {
  const value = envValue('VITE_USE_MOCK_ADAPTERS').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
};

export const getAppVersion = (): string => envValue('VITE_APP_VERSION').trim() || 'dev';

export const getShortAppVersion = (): string => getAppVersion().slice(0, 7);
