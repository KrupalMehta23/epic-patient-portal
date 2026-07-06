/**
 * Secure token storage using sessionStorage only.
 * Tokens are never persisted to localStorage or cookies.
 * Session is cleared automatically on tab/window close.
 */

const SESSION_KEY = 'epic_fhir_session';

export function storeSession({ access_token, id_token, patient_id, expires_in }) {
  const session = {
    access_token,
    id_token: id_token || null,
    patient_id: patient_id || null,
    expires_at: Date.now() + Number(expires_in) * 1000,
    stored_at: Date.now(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() >= session.expires_at) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated() {
  return getSession() !== null;
}
