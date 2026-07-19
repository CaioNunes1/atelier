const ACCESS_TOKEN_KEY = 'atelier_access_token';
const AUTH_EVENT = 'atelier-auth-change';

export function getAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function subscribeAuth(listener: () => void) {
  const handler = () => listener();
  window.addEventListener('storage', handler);
  window.addEventListener(AUTH_EVENT, handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(AUTH_EVENT, handler);
  };
}
