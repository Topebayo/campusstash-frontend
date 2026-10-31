import { Capacitor } from '@capacitor/core';

// Production Cloud Backend on Render
export const CLOUD_API_BASE = 'https://campusstash-backend.onrender.com/api/v1';
export const CLOUD_WS_BASE = 'wss://campusstash-backend.onrender.com/api/v1/chat/ws';
export const CLOUD_HOST = 'https://campusstash-backend.onrender.com';

// Standard Nigerian Launch Universities
export const DEFAULT_CAMPUSES = [
  { id: 'af705f54-8603-46c7-8282-dba21e92d614', name: 'Lead City University', acronym: 'LCU', state: 'Oyo' },
  { id: '8636a3e5-dd7f-41cb-9687-f9178e3d832a', name: 'University of Ibadan', acronym: 'UI', state: 'Oyo' },
  { id: '8c47396b-5188-41b0-93e3-e9104b72ab83', name: 'University of Lagos', acronym: 'UNILAG', state: 'Lagos' },
  { id: '5c701cef-35a9-4f29-9232-ed8cd3afeba1', name: 'Obafemi Awolowo University', acronym: 'OAU', state: 'Osun' },
  { id: 'e8e285fa-a7b1-4b52-a170-0807db95afd7', name: 'Federal University of Technology, Akure', acronym: 'FUTA', state: 'Ondo' },
];

// Clean up any stale private LAN IP stored in localStorage from earlier development
if (typeof window !== 'undefined') {
  try {
    const staleIp = localStorage.getItem('server_ip');
    if (staleIp && (staleIp.startsWith('10.') || staleIp.startsWith('192.168.') || staleIp.includes(':8000') || staleIp === '10.84.19.223')) {
      localStorage.removeItem('server_ip');
    }
    const staleCache = localStorage.getItem('cs_cached_listings');
    if (staleCache) {
      try {
        const parsed = JSON.parse(staleCache);
        if (Array.isArray(parsed) && parsed.length <= 2) {
          localStorage.removeItem('cs_cached_listings');
        }
      } catch (e) {}
    }
  } catch (e) {}
}

export const getServerHost = () => {
  return CLOUD_HOST;
};

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Always use the live cloud backend for Android native, production web, and local development
  return CLOUD_API_BASE;
};

export const getWebSocketUrl = (conversationId, token = '') => {
  const tokenQuery = token ? `?token=${token}` : '';
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/${conversationId}${tokenQuery}`;
  }
  return `${CLOUD_WS_BASE}/${conversationId}${tokenQuery}`;
};

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (Capacitor.isNativePlatform()) {
    return `${CLOUD_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  if (import.meta.env.VITE_API_URL) {
    try {
      const origin = new URL(import.meta.env.VITE_API_URL).origin;
      return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
    } catch (e) {}
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;
    if ((host === 'localhost' || host === '127.0.0.1') && port === '5173') {
      return url;
    }
  }
  return `${CLOUD_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const baseUrl = getApiBaseUrl();
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed with status ${response.status}`;
    // Clear stale token on auth failures
    if (response.status === 401 || response.status === 403) {
      if (
        response.status === 401 ||
        errorData.detail === "Could not validate credentials" ||
        errorData.detail === "Not authenticated"
      ) {
        localStorage.removeItem('token');
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// ─── Render Keep-Alive System ───────────────────────────────────────────────
const KEEPALIVE_URL = 'https://campusstash-backend.onrender.com/health';
const KEEPALIVE_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes

function pingBackend() {
  try {
    fetch(KEEPALIVE_URL, { method: 'GET', mode: 'no-cors' }).catch(() => {});
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  pingBackend();
  let keepAliveTimer = setInterval(pingBackend, KEEPALIVE_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pingBackend();
      clearInterval(keepAliveTimer);
      keepAliveTimer = setInterval(pingBackend, KEEPALIVE_INTERVAL_MS);
    }
  });
}

// Campus & Request Helpers
export const getCampuses = async () => {
  try {
    const data = await apiFetch('/campuses/');
    if (Array.isArray(data) && data.length > 0) {
      try {
        localStorage.setItem('campusstash_cached_campuses', JSON.stringify(data));
      } catch (e) {}
      return data;
    }
  } catch (e) {
    console.warn("Could not fetch remote campuses, using cached/default campuses:", e);
  }
  try {
    const cached = localStorage.getItem('campusstash_cached_campuses');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_CAMPUSES;
};

export const getActiveCampusId = () => {
  return localStorage.getItem('campusstash_campus_id') || '';
};

export const setActiveCampusId = (campusId) => {
  if (campusId) {
    localStorage.setItem('campusstash_campus_id', campusId);
  } else {
    localStorage.removeItem('campusstash_campus_id');
  }
  window.dispatchEvent(new CustomEvent('campusstash:campus_changed', { detail: campusId }));
};

export const getItemRequests = async (campusId = '') => {
  const query = campusId ? `?campus_id=${campusId}` : '';
  return await apiFetch(`/requests/${query}`);
};

export const createItemRequest = async (payload) => {
  return await apiFetch('/requests/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const fulfillItemRequest = async (requestId) => {
  return await apiFetch(`/requests/${requestId}/fulfill`, {
    method: 'PATCH',
  });
};

export const deleteItemRequest = async (requestId) => {
  return await apiFetch(`/requests/${requestId}`, {
    method: 'DELETE',
  });
};
