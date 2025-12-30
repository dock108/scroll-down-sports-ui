/// <reference types="vite/client" />

declare global {
  interface Window {
    __APP_CONFIG__?: {
      VITE_API_URL?: string;
      VITE_USE_MOCK_ADAPTERS?: string;
      VITE_APP_VERSION?: string;
    };
  }
}

export {};
