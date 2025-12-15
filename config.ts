
/**
 * Global Configuration Loader
 * 
 * Priority:
 * 1. Runtime Injection (window.__RUNTIME_CONFIG__)
 * 2. Build-time Environment (import.meta.env)
 * 3. Relative Path Fallback (Same Origin)
 */

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      VITE_API_URL?: string;
    };
  }
}

export const getApiBaseUrl = (): string => {
  // 1. Runtime Config (from /runtime-config.js)
  if (window.__RUNTIME_CONFIG__ && window.__RUNTIME_CONFIG__.VITE_API_URL !== undefined) {
    // Note: It might be an empty string "", which is valid for relative paths
    return window.__RUNTIME_CONFIG__.VITE_API_URL;
  }

  // Type assertion to bypass TS error
  const env = (import.meta as any).env;

  // 2. Build-time Config
  if (env && env.VITE_API_URL) {
    return env.VITE_API_URL;
  }

  // 3. Development Fallback
  if (env && env.DEV) {
    return 'http://localhost:5000';
  }

  // 4. Production Fallback (Relative Path)
  // If we are here in production, it means no explicit URL was set.
  // Since we are serving frontend via Express (same origin), return empty string.
  // fetch('/api/...') will work automatically.
  return '';
};
