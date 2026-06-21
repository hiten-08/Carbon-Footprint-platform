/**
 * Thin fetch wrapper for the FastAPI backend.
 *
 * Token is kept in memory + sessionStorage rather than localStorage:
 * sessionStorage clears when the tab closes, which is a reasonable
 * default for a footprint tracker that may be used on shared devices.
 * (Swap to localStorage if "remember me across sessions" is desired.)
 */
const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'carbon_app_token'

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

// Components subscribe to this to react to session expiry (e.g. redirect
// to /login) without every call site needing its own 401 handling.
const sessionListeners = new Set()
export function onSessionExpired(listener) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}
function notifySessionExpired() {
  sessionListeners.forEach((fn) => fn())
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null

  let payload = null
  try {
    payload = await res.json()
  } catch {
    // no JSON body (e.g. network error before response)
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null)
      notifySessionExpired()
    }
    const message = payload?.detail
      ? (Array.isArray(payload.detail) ? payload.detail.map(d => d.msg).join('; ') : payload.detail)
      : `Request failed (${res.status})`
    throw new ApiError(message, res.status, payload?.detail)
  }

  return payload
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: data, auth: false }),
  login: (data) => request('/auth/login', { method: 'POST', body: data, auth: false }),

  // Activities catalog
  listActivities: () => request('/activities', { auth: false }),

  // Entries
  listEntries: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/entries${qs ? `?${qs}` : ''}`)
  },
  createEntry: (data) => request('/entries', { method: 'POST', body: data }),
  deleteEntry: (id) => request(`/entries/${id}`, { method: 'DELETE' }),

  // Dashboard
  getSummary: (days = 30) => request(`/dashboard/summary?days=${days}`),
}

export { ApiError }
