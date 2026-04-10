const LOCAL_BACKEND_ORIGIN = 'http://localhost:5000';

const sanitizeOrigin = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\/+$/, '');
};

const configuredOrigin = sanitizeOrigin(import.meta.env.VITE_API_ORIGIN);
const isBrowser = typeof window !== 'undefined';
const isLocalHost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const BACKEND_ORIGIN = configuredOrigin || (isLocalHost ? LOCAL_BACKEND_ORIGIN : '');

export const toBackendUrl = (path = '') => {
  if (!path) return BACKEND_ORIGIN;
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}${normalizedPath}` : normalizedPath;
};
