const DEFAULT_PROD_API_BASE = 'https://dynamicpricing-api.dynamicpricingbuilder.com';

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/** API origin without trailing slash. Empty string = same-origin (local dev). */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv !== undefined && String(fromEnv).trim() !== '') {
    return normalizeBase(String(fromEnv));
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return DEFAULT_PROD_API_BASE;
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
