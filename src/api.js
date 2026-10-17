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
