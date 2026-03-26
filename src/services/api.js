const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const request = async (path, { method = 'GET', token, body } = {}) => {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: getHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot connect to backend server. Start backend with "npm run server".');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');
  const data = isJson ? await response.json().catch(() => ({})) : {};

  if (!response.ok) {
    const message =
      data?.message ||
      (response.status >= 500
        ? 'Backend server error. Check whether the API server is running.'
        : `Request failed (${response.status})`);
    throw new Error(message);
  }

  return data;
};

export const authApi = {
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
};

export const usersApi = {
  list: (token) => request('/users', { token }),
  network: (token) => request('/users/friends/network', { token }),
  search: (token, query) => request(`/users/search?q=${encodeURIComponent(query)}`, { token }),
  sendFriendRequest: (token, toUserId) =>
    request('/users/friend-requests', { method: 'POST', token, body: { toUserId } }),
  acceptFriendRequest: (token, requestId) =>
    request(`/users/friend-requests/${requestId}/accept`, { method: 'POST', token }),
  rejectFriendRequest: (token, requestId) =>
    request(`/users/friend-requests/${requestId}/reject`, { method: 'POST', token }),
};

export const groupsApi = {
  list: (token) => request('/groups', { token }),
  create: (token, payload) => request('/groups', { method: 'POST', token, body: payload }),
  addMember: (token, groupId, payload) =>
    request(`/groups/${groupId}/members`, { method: 'POST', token, body: payload }),
};

export const expensesApi = {
  list: (token) => request('/expenses', { token }),
  create: (token, payload) => request('/expenses', { method: 'POST', token, body: payload }),
  remove: (token, expenseId) => request(`/expenses/${expenseId}`, { method: 'DELETE', token }),
};

export const analyticsApi = {
  summary: (token) => request('/analytics/summary', { token }),
  balances: (token) => request('/analytics/balances', { token }),
};
