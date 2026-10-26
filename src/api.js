import { Capacitor } from '@capacitor/core';

// Production Cloud Backend on Render
export const CLOUD_API_BASE = 'https://campusstash-backend.onrender.com/api/v1';
export const CLOUD_WS_BASE = 'wss://campusstash-backend.onrender.com/api/v1/chat/ws';
export const CLOUD_HOST = 'https://campusstash-backend.onrender.com';

// Local PC Fallback for LAN testing
export const DEFAULT_HOST_IP = '10.84.19.223';

export const getServerHost = () => {
  const customIp = localStorage.getItem('server_ip');
  if (customIp && customIp.trim()) {
    return customIp.trim();
  }
  if (import.meta.env.VITE_SERVER_IP) {
    return import.meta.env.VITE_SERVER_IP;
  }
  return DEFAULT_HOST_IP;
};

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (Capacitor.isNativePlatform()) {
    const customIp = localStorage.getItem('server_ip');
    if (customIp && customIp.trim()) {
      return `http://${customIp.trim()}:8000/api/v1`;
    }
    return CLOUD_API_BASE;
  }
  return '/api/v1';
};

export const getWebSocketUrl = (conversationId, token = '') => {
  const tokenQuery = token ? `?token=${token}` : '';
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/${conversationId}${tokenQuery}`;
  }
  if (Capacitor.isNativePlatform()) {
    const customIp = localStorage.getItem('server_ip');
    if (customIp && customIp.trim()) {
      return `ws://${customIp.trim()}:8000/api/v1/chat/ws/${conversationId}${tokenQuery}`;
    }
    return `${CLOUD_WS_BASE}/${conversationId}${tokenQuery}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/v1/chat/ws/${conversationId}${tokenQuery}`;
};

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (import.meta.env.VITE_API_URL) {
    try {
      const origin = new URL(import.meta.env.VITE_API_URL).origin;
      return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
    } catch (e) {
      // fallback
    }
  }
  if (Capacitor.isNativePlatform()) {
    const customIp = localStorage.getItem('server_ip');
    if (customIp && customIp.trim()) {
      return `http://${customIp.trim()}:8000${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return `${CLOUD_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
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

  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    if (
      response.status === 401 || 
      errorData.detail === "Could not validate credentials" ||
      errorData.detail === "Not authenticated"
    ) {
      localStorage.removeItem('token');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};


// ─── Render Keep-Alive System ───────────────────────────────────────────────
// Render free instances spin down after 15 minutes of inactivity.
// We ping every 13 minutes to keep the backend warm, and also fire an
// immediate ping whenever the user returns to the tab or app.
const KEEPALIVE_URL = 'https://campusstash-backend.onrender.com/health';
const KEEPALIVE_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes

function pingBackend() {
  try {
    fetch(KEEPALIVE_URL, { method: 'GET', mode: 'no-cors' }).catch(() => {});
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  // 1. Immediate ping on load
  pingBackend();

  // 2. Recurring ping every 13 minutes
  let keepAliveTimer = setInterval(pingBackend, KEEPALIVE_INTERVAL_MS);

  // 3. Ping immediately when user returns to the tab (browser visibility API)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pingBackend();
      // Reset the interval so next ping is 13 minutes from NOW
      clearInterval(keepAliveTimer);
      keepAliveTimer = setInterval(pingBackend, KEEPALIVE_INTERVAL_MS);
    }
  });
}

// Campus & Request Helpers
export const getCampuses = async () => {
  return await apiFetch('/campuses/');
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
    body: JSON.stringify(payload)
  });
};

export const fulfillItemRequest = async (requestId) => {
  return await apiFetch(`/requests/${requestId}/fulfill`, {
    method: 'PATCH'
  });
};

export const deleteItemRequest = async (requestId) => {
  return await apiFetch(`/requests/${requestId}`, {
    method: 'DELETE'
  });
};
