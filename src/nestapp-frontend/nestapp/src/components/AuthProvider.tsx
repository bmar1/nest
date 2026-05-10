import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { type AuthState, type AuthUser, parseGoogleCredential } from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  idToken: string | null
  isAuthenticated: boolean
  loginWithGoogleCredential: (credential: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState | null>(null)

  const loginWithGoogleCredential = useCallback((credential: string) => {
    const user = parseGoogleCredential(credential)
    setAuthState({ user, idToken: credential })
  }, [])

  const logout = useCallback(() => {
    setAuthState(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user: authState?.user ?? null,
    idToken: authState?.idToken ?? null,
    isAuthenticated: Boolean(authState?.user),
    loginWithGoogleCredential,
    logout,
  }), [authState, loginWithGoogleCredential, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
