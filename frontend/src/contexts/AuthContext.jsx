import { createContext, useContext, useEffect, useState } from 'react'
import { loginRequest, meRequest, registerRequest } from '../services/authService'

const AuthContext = createContext()

const SESSION_KEY = 'mp_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed.user)
        setToken(parsed.token)
      } catch {
        localStorage.removeItem(SESSION_KEY)
      }
    }
    setLoading(false)
  }, [])

  const persistSession = (nextUser, nextToken) => {
    setUser(nextUser)
    setToken(nextToken)
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: nextUser, token: nextToken }))
  }

  const login = async (email, password) => {
    const { user: loggedUser, token: authToken } = await loginRequest(email, password)
    persistSession(loggedUser, authToken)
  }

  const register = async (name, email, password, avatarUrl) => {
    await registerRequest({ name, email, password, avatarUrl })
    const { user: loggedUser, token: authToken } = await loginRequest(email, password)
    persistSession(loggedUser, authToken)
  }

  const refreshUser = async () => {
    if (!token) return
    const me = await meRequest(token)
    persistSession(me, token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const isAuthenticated = !!user && !!token

  const value = { user, token, isAuthenticated, loading, login, register, logout, refreshUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
