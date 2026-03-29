const AUTH_TOKEN_KEY = 'expense_tracker_auth_token';
const AUTH_USER_KEY = 'expense_tracker_auth_user';

const clearLegacyLocalAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const authStorage = {
  getToken() {
    clearLegacyLocalAuth();
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
  },

  getUser() {
    clearLegacyLocalAuth();
    const rawUser = sessionStorage.getItem(AUTH_USER_KEY);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch {
      sessionStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
  },

  setSession(token, user) {
    clearLegacyLocalAuth();
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  setUser(user) {
    clearLegacyLocalAuth();
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    clearLegacyLocalAuth();
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  },
};
