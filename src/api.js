import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// High-Speed Production Backend on Railway (Zero Cold Starts)
export const CLOUD_API_BASE = 'https://web-production-85cbf.up.railway.app/api/v1';
export const CLOUD_WS_BASE = 'wss://web-production-85cbf.up.railway.app/api/v1/chat/ws';
export const CLOUD_HOST = 'https://web-production-85cbf.up.railway.app';

// Standard Nigerian Tertiary Institutions (Ibadan Cluster & Launch Hubs)
export const DEFAULT_CAMPUSES = [
  // ==========================================
  // IBADAN CLUSTER
  // ==========================================
  { id: 'af705f54-8603-46c7-8282-dba21e92d614', name: 'Lead City University', acronym: 'LCU', state: 'Ibadan', lat: 7.3328, lon: 3.8824 },
  { id: '8636a3e5-dd7f-41cb-9687-f9178e3d832a', name: 'University of Ibadan', acronym: 'UI', state: 'Ibadan', lat: 7.4443, lon: 3.9003 },
  { id: '7b38d39f-2f78-4389-980e-3fa5e9b9281a', name: 'The Polytechnic, Ibadan', acronym: 'Poly Ibadan', state: 'Ibadan', lat: 7.4338, lon: 3.8742 },
  { id: 'e4b52cb1-5367-4228-b210-917711468d60', name: 'KolaDaisi University', acronym: 'KDU', state: 'Ibadan', lat: 7.5501, lon: 3.9210 },
  { id: '3f8b059e-e317-4581-996b-0726b219fa51', name: 'First Technical University', acronym: 'Tech-U', state: 'Ibadan', lat: 7.2850, lon: 3.8650 },
  { id: 'c98fa326-809f-4318-ba90-2771fef45823', name: 'Dominican University', acronym: 'DU', state: 'Ibadan', lat: 7.4310, lon: 3.8970 },
  { id: '5d2780ca-ebf0-42f5-b982-f3f009405d15', name: 'Precious Cornerstone University', acronym: 'PCU', state: 'Ibadan', lat: 7.3912, lon: 3.9550 },
  { id: '8e7421cb-4ef9-4971-8bc4-c6899451de70', name: 'Federal College of Animal Health and Production Technology', acronym: 'FCAH&PT', state: 'Ibadan', lat: 7.3780, lon: 3.8430 },
  { id: 'a6d39478-f7b9-4089-9132-723eb8f27802', name: 'Federal College of Forestry', acronym: 'FCF', state: 'Ibadan', lat: 7.3980, lon: 3.8670 },
  { id: 'd5c78912-320e-4ab8-8b54-914068f23471', name: 'Federal School of Statistics', acronym: 'FSS', state: 'Ibadan', lat: 7.4260, lon: 3.8880 },

  // ==========================================
  // OSUN STATE (ALL UNIVERSITIES & HUBS)
  // ==========================================
  { id: '5c701cef-35a9-4f29-9232-ed8cd3afeba1', name: 'Obafemi Awolowo University', acronym: 'OAU', state: 'Osun', lat: 7.5186, lon: 4.5262 },
  { id: 'ac43fb43-da06-4fce-86b0-7f0292ad1725', name: 'Osun State University, Osogbo Campus', acronym: 'UNIOSUN Osogbo', state: 'Osun', lat: 7.7820, lon: 4.5410 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef11', name: 'Osun State University, Ikire Campus', acronym: 'UNIOSUN Ikire', state: 'Osun', lat: 7.3620, lon: 4.1850 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef12', name: 'Osun State University, Okuku Campus', acronym: 'UNIOSUN Okuku', state: 'Osun', lat: 7.9890, lon: 4.6720 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef13', name: 'Osun State University, Ejigbo Campus', acronym: 'UNIOSUN Ejigbo', state: 'Osun', lat: 7.9030, lon: 4.3160 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef14', name: 'Osun State University, Ifetedo Campus', acronym: 'UNIOSUN Ifetedo', state: 'Osun', lat: 7.1850, lon: 4.7080 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef15', name: 'Osun State University, Ipetu-Ijesha Campus', acronym: 'UNIOSUN Ipetu-Ijesha', state: 'Osun', lat: 7.4640, lon: 4.8970 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef02', name: 'Federal University of Health Sciences, Ila-Orangun', acronym: 'FUHSI', state: 'Osun', lat: 8.0160, lon: 4.9040 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef03', name: 'University of Ilesa', acronym: 'UNILESA', state: 'Osun', lat: 7.6250, lon: 4.7410 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef04', name: 'Bowen University', acronym: 'Bowen', state: 'Osun', lat: 7.6290, lon: 4.1870 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef05', name: "Redeemer's University", acronym: 'RUN', state: 'Osun', lat: 7.7420, lon: 4.4390 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef06', name: 'Adeleke University', acronym: 'AU', state: 'Osun', lat: 7.7280, lon: 4.4510 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef07', name: 'Fountain University', acronym: 'Fountain', state: 'Osun', lat: 7.7810, lon: 4.5820 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef08', name: 'Oduduwa University', acronym: 'OUI', state: 'Osun', lat: 7.5020, lon: 4.4500 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef09', name: 'Joseph Ayo Babalola University', acronym: 'JABU', state: 'Osun', lat: 7.4220, lon: 4.9650 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef0a', name: 'Kings University', acronym: 'Kings Uni', state: 'Osun', lat: 7.5310, lon: 4.4020 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef0b', name: 'Westland University', acronym: 'Westland', state: 'Osun', lat: 7.6350, lon: 4.1950 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef0c', name: 'Mercy Medical University', acronym: 'MMU', state: 'Osun', lat: 7.6310, lon: 4.1830 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef0d', name: 'Federal Polytechnic, Ede', acronym: 'Federal Poly Ede', state: 'Osun', lat: 7.7380, lon: 4.4450 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef0e', name: 'Osun State Polytechnic, Iree', acronym: 'OSPOLY', state: 'Osun', lat: 7.9150, lon: 4.7950 },
  { id: '6a812345-bcde-4f01-2345-6789abcdef0f', name: 'Osun State College of Technology, Esa-Oke', acronym: 'OSCOTECH', state: 'Osun', lat: 7.7480, lon: 4.8870 },

  // ==========================================
  // LAGOS STATE (ALL UNIVERSITIES & HUBS)
  // ==========================================
  { id: '8c47396b-5188-41b0-93e3-e9104b72ab83', name: 'University of Lagos', acronym: 'UNILAG', state: 'Lagos', lat: 6.5173, lon: 3.3986 },
  { id: '9a112233-4455-6677-8899-aabbccddeeff', name: 'Lagos State University', acronym: 'LASU', state: 'Lagos', lat: 6.4673, lon: 3.1979 },
  { id: '7b923456-cdef-4012-3456-789abcdef001', name: 'Lagos State University of Science and Technology', acronym: 'LASUSTECH', state: 'Lagos', lat: 6.6190, lon: 3.5110 },
  { id: '7b923456-cdef-4012-3456-789abcdef002', name: 'Lagos State University of Education', acronym: 'LASUED', state: 'Lagos', lat: 6.4890, lon: 3.1420 },
  { id: '7b923456-cdef-4012-3456-789abcdef003', name: 'Pan-Atlantic University', acronym: 'PAU', state: 'Lagos', lat: 6.4910, lon: 3.8240 },
  { id: '7b923456-cdef-4012-3456-789abcdef004', name: 'Caleb University', acronym: 'Caleb', state: 'Lagos', lat: 6.6620, lon: 3.6730 },
  { id: '7b923456-cdef-4012-3456-789abcdef005', name: 'Anchor University', acronym: 'Anchor', state: 'Lagos', lat: 6.6080, lon: 3.2560 },
  { id: '7b923456-cdef-4012-3456-789abcdef006', name: 'Augustine University', acronym: 'AUL', state: 'Lagos', lat: 6.6010, lon: 3.9720 },
  { id: '7b923456-cdef-4012-3456-789abcdef007', name: 'Eko University of Medicine and Health Sciences', acronym: 'EKOUNIMED', state: 'Lagos', lat: 6.4850, lon: 3.1490 },
  { id: '7b923456-cdef-4012-3456-789abcdef008', name: 'James Hope University', acronym: 'JHU', state: 'Lagos', lat: 6.4420, lon: 3.4880 },
  { id: '7b923456-cdef-4012-3456-789abcdef009', name: 'Maranatha University', acronym: 'Maranatha', state: 'Lagos', lat: 6.4520, lon: 3.5510 },
  { id: '7b923456-cdef-4012-3456-789abcdef00a', name: 'Nigerian University of Technology and Management', acronym: 'NUTM', state: 'Lagos', lat: 6.4710, lon: 3.3720 },
  { id: '7b923456-cdef-4012-3456-789abcdef00b', name: 'Yaba College of Technology', acronym: 'YABATECH', state: 'Lagos', lat: 6.5180, lon: 3.3720 },
  { id: '7b923456-cdef-4012-3456-789abcdef00c', name: 'Federal College of Education (Technical), Akoka', acronym: 'FCET Akoka', state: 'Lagos', lat: 6.5260, lon: 3.3850 },

  // ==========================================
  // REGIONAL CAMPUSES & LAUNCH HUBS
  // ==========================================
  { id: '1b223344-5566-7788-99aa-bbccddeeff00', name: 'Covenant University', acronym: 'CU', state: 'Ogun', lat: 6.6725, lon: 3.1593 },
  { id: '2c334455-6677-8899-aabb-ccddeeff0011', name: 'Babcock University', acronym: 'BU', state: 'Ogun', lat: 6.8925, lon: 3.7225 },
  { id: 'e8e285fa-a7b1-4b52-a170-0807db95afd7', name: 'Federal University of Technology, Akure', acronym: 'FUTA', state: 'Ondo', lat: 7.3039, lon: 5.1384 },
  { id: '3d445566-7788-99aa-bbcc-ddeeff001122', name: 'University of Ilorin', acronym: 'UNILORIN', state: 'Kwara', lat: 8.4799, lon: 4.6716 },
  { id: '4e556677-8899-aabb-ccdd-eeff00112233', name: 'University of Benin', acronym: 'UNIBEN', state: 'Edo', lat: 6.3995, lon: 5.6148 },
];

export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestCampus(userLat, userLon, campuses = DEFAULT_CAMPUSES) {
  if (userLat == null || userLon == null || !Array.isArray(campuses) || campuses.length === 0) {
    return null;
  }
  let closest = null;
  let minDistance = Infinity;

  // Build coordinate lookup from DEFAULT_CAMPUSES for fallback
  const coordLookup = {};
  for (const dc of DEFAULT_CAMPUSES) {
    coordLookup[dc.name.toLowerCase()] = { lat: dc.lat, lon: dc.lon };
    coordLookup[dc.acronym.toLowerCase()] = { lat: dc.lat, lon: dc.lon };
  }

  for (const c of campuses) {
    const lat = c.lat || coordLookup[c.name?.toLowerCase()]?.lat || coordLookup[c.acronym?.toLowerCase()]?.lat;
    const lon = c.lon || coordLookup[c.name?.toLowerCase()]?.lon || coordLookup[c.acronym?.toLowerCase()]?.lon;
    if (lat && lon) {
      const d = calculateDistanceKm(userLat, userLon, lat, lon);
      if (d < minDistance) {
        minDistance = d;
        closest = {
          campus: c,
          distanceKm: Math.round(d * 10) / 10
        };
      }
    }
  }
  return closest;
}

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
    const cachedCampuses = localStorage.getItem('campusstash_cached_campuses');
    if (cachedCampuses && (!cachedCampuses.includes('UNIOSUN Osogbo') || !cachedCampuses.includes('UNIOSUN Ikire') || !cachedCampuses.includes('LASUSTECH'))) {
      localStorage.removeItem('campusstash_cached_campuses');
    }
  } catch (e) {}
}

export const getServerHost = () => {
  return CLOUD_HOST;
};

export const getApiBaseUrl = () => {
  // If an old Render backend URL is stored in environment variables, ignore it and use Railway
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('onrender.com')) {
    return import.meta.env.VITE_API_URL;
  }
  // Always use the live high-speed cloud backend on Railway
  return CLOUD_API_BASE;
};

export const getWebSocketUrl = (conversationId, token = '') => {
  const tokenQuery = token ? `?token=${token}` : '';
  if (import.meta.env.VITE_WS_URL && !import.meta.env.VITE_WS_URL.includes('onrender.com')) {
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
  if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('onrender.com')) {
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

  let response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr) {
    const isSafariLoadFailed = netErr?.message === 'Load failed';
    const isFailedToFetch = netErr?.message?.includes('Failed to fetch') || netErr?.message?.includes('NetworkError');
    if (isSafariLoadFailed || isFailedToFetch) {
      throw new Error("Unable to reach CampusStash server. Please check your connection or wait a moment while the server wakes up.");
    }
    throw netErr;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let message = errorData.detail;
    if (Array.isArray(message)) {
      message = message.map(m => m.msg || m.message || JSON.stringify(m)).join(', ');
    } else if (typeof message === 'object' && message !== null) {
      message = JSON.stringify(message);
    }
    message = message || `Request failed with status ${response.status}`;

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

export const clearAppNotifications = async (conversationId = null) => {
  // 1. Clear native delivered push/local notifications from Android notification tray
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.removeAllDeliveredNotifications();
    } catch (e) {
      console.warn('Could not remove delivered notifications', e);
    }
  }

  // 2. Mark conversation as read on backend if conversationId is provided
  if (conversationId) {
    try {
      await apiFetch(`/conversations/${conversationId}/read`, { method: 'POST' });
    } catch (e) {
      // Non-blocking fallback
    }
  }

  // 3. Dispatch global custom event for UI components (Navbar dock badge, Messages list)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('campus:messages_read', { detail: { conversationId } }));
  }
};

// ─── Railway Keep-Alive System ──────────────────────────────────────────────
const KEEPALIVE_URL = 'https://web-production-85cbf.up.railway.app/health';
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

export const adminApi = {
  getMe: () => apiFetch('/admin/me'),
  getStats: () => apiFetch('/admin/stats'),
  getUsers: (query = '', limit = 100, offset = 0) => {
    const q = query ? `&query=${encodeURIComponent(query)}` : '';
    return apiFetch(`/admin/users?limit=${limit}&offset=${offset}${q}`);
  },
  forceVerifyUser: (userId) => apiFetch(`/admin/users/${userId}/force-verify`, { method: 'POST' }),
  verifyDirect: (identifier) => apiFetch('/admin/verify-direct', {
    method: 'POST',
    body: JSON.stringify({ identifier })
  }),
  getRecentOtps: (limit = 30) => apiFetch(`/admin/recent-otps?limit=${limit}`),
  getRecentSignups: (limit = 50) => apiFetch(`/admin/recent-signups?limit=${limit}`),
  getPendingKyc: (status = 'all') => apiFetch(`/admin/kyc?status_filter=${status}`),
  approveKyc: (userId) => apiFetch(`/admin/kyc/${userId}/approve`, { method: 'POST' }),
  rejectKyc: (userId, reason = '') => apiFetch(`/admin/kyc/${userId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  getListings: (query = '', limit = 30, offset = 0) => {
    const q = query ? `&query=${encodeURIComponent(query)}` : '';
    return apiFetch(`/admin/listings?limit=${limit}&offset=${offset}${q}`);
  },
  deleteListing: (listingId) => apiFetch(`/admin/listings/${listingId}`, { method: 'DELETE' }),
};
