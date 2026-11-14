import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,   // send/receive HttpOnly session cookie
  headers:         { 'Content-Type': 'application/json' }
});

// ---------------------------------------------------------------------------
// Public endpoints — no auth required
// ---------------------------------------------------------------------------

/** Fetch all community reports, newest first. */
export async function fetchPublicIssues() {
  const { data } = await api.get('/issues/public');
  return data;
}

/** Fetch a single public report by MongoDB ObjectId. */
export async function fetchPublicIssue(issueId) {
  const { data } = await api.get(`/issues/public/${issueId}`);
  return data;
}

/**
 * Submit a new community report.
 * The server returns the created document (201 Created) on success.
 * On validation failure it returns 400 with a { message } body.
 * axios throws for any non-2xx status, so callers can catch and display
 * error.response.data.message directly.
 */
export async function createIssue(issue) {
  const { data } = await api.post('/issues', issue);
  return data;
}

// ---------------------------------------------------------------------------
// Admin endpoints — session cookie is sent automatically by withCredentials
// ---------------------------------------------------------------------------

/** Sign in and set the HttpOnly session cookie. */
export async function loginAdmin(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

/**
 * Check whether the current browser session is authenticated.
 * Returns { authenticated: true, username } on success.
 * Throws with status 401 when the session is missing or expired — the caller
 * in App.jsx uses this to decide whether to show the login form.
 */
export async function fetchAdminSession() {
  const { data } = await api.get('/auth/session');
  return data;
}

/** Clear the session cookie on the server. */
export async function logoutAdmin() {
  const { data } = await api.post('/auth/logout');
  return data;
}

/** Fetch all reports (full documents) for the admin table. */
export async function fetchIssues() {
  const { data } = await api.get('/issues');
  return data;
}

/** Fetch aggregate stats for the dashboard KPI cards and charts. */
export async function fetchIssueStats() {
  const { data } = await api.get('/issues/stats');
  return data;
}

/**
 * Update the status of a single report.
 * Uses PATCH (partial update) rather than PUT (full replacement) because we
 * are only changing one field.
 */
export async function updateIssueStatus(issueId, status) {
  const { data } = await api.patch(
    `/issues/${issueId}/status`,
    { status }
  );
  return data;
}


export function getApiErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}
