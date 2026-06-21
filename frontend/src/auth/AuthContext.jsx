import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, getToken, setToken, onSessionExpired } from '../api/client'

const AuthContext = createContext(null)
const USER_CACHE_KEY = 'carbon_app_user'

function loadCachedUser() {
  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  // We don't have a "/me" endpoint, so on refresh we restore the user
  // profile from sessionStorage (written alongside the token at login
  // time) rather than losing display info. If the token has since
  // expired, the first authenticated API call will 401 and the caller
  // is responsible for redirecting to login.
  const [user, setUser] = useState(loadCachedUser)
  const [initializing] = useState(false)

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(USER_CACHE_KEY)
    }
  }, [user])

  useEffect(() => {
    return onSessionExpired(() => setUser(null))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password })
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (email, displayName, password) => {
    const data = await api.register({ email, display_name: displayName, password })
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  // Derived from `user` (a state value, so it triggers re-renders) rather
  // than calling getToken() directly in render, which wouldn't react to
  // the session-expired event clearing the token out from under us.
  const isAuthed = Boolean(user) && Boolean(getToken())

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthed, initializing }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
