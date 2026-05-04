const DEFAULT_PROD_API_BASE = 'https://dynamicpricing-api.dynamicpricingbuilder.com';

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/**
 * API origin without trailing slash.
 * - Local dev: '' → same-origin `/api` (Express).
 * - Production with `VITE_SAME_ORIGIN_API=true`: your Vercel URL → `/api/*` serverless + rewrites.
 * - Or set `VITE_API_BASE_URL` explicitly.
 * - Else: reconciliation backend default (login must exist there or use same-origin).
 */
export function getApiBase(): string {
  const sameOrigin =
    import.meta.env.VITE_SAME_ORIGIN_API === 'true' ||
    import.meta.env.VITE_SAME_ORIGIN_API === '1';
  if (sameOrigin && typeof window !== 'undefined') {
    return normalizeBase(window.location.origin);
  }

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
