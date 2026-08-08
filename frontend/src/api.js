const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('ojx_token') || '';
}

export function setStoredToken(token) {
  if (token) localStorage.setItem('ojx_token', token);
  else localStorage.removeItem('ojx_token');
}

export function getStoredUser() {
  const str = localStorage.getItem('ojx_user');
  return str ? JSON.parse(str) : null;
}

export function setStoredUser(user) {
  if (user) localStorage.setItem('ojx_user', JSON.stringify(user));
  else localStorage.removeItem('ojx_user');
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error?.message || data.error || 'Request failed';
    const err = new Error(typeof errorMsg === 'string' ? errorMsg : 'Request failed');
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}

// ── Auth APIs ────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};

// ── Problem APIs ─────────────────────────────────────────────────────────────
export const problemApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/problems?${query}`);
  },
  get: (slug) => request(`/problems/${slug}`),
  create: (payload) => request('/problems', { method: 'POST', body: JSON.stringify(payload) }),
};

// ── Submission APIs ──────────────────────────────────────────────────────────
export const submissionApi = {
  create: (payload) => request('/submissions', { method: 'POST', body: JSON.stringify(payload) }),
  list: () => request('/submissions'),
  get: (id) => request(`/submissions/${id}`),
};
