import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { apiUrl } from '@/lib/api'
import { currentPatient } from '@/lib/mock-data'

/** Datos públicos del usuario en sesión (sin contraseña). */
export type AuthUser = {
  dni: string
  email: string
  nombre: string
  apellido: string
  id?: string
  token?: string
  /** Copia de demostración al estilo mock-data */
  isDemo: boolean
  obraSocial?: string
  telefono?: string
  nroAfiliado?: string
}

type StoredAccount = {
  dni: string
  email: string
  nombre: string
  apellido: string
  password: string
}

const REGISTERED_KEY = 'healthgrid-registered-users'
const SESSION_KEY = 'healthgrid-session'

function normalizeDni(value: string): string {
  return value.replace(/\D/g, '')
}

let currentSession: AuthUser | null = null
let sessionInitialized = false

function readSession(): AuthUser | null {
  if (sessionInitialized) return currentSession

  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AuthUser
      if (parsed?.dni && parsed.email) {
        currentSession = parsed
      }
    }
  } catch {
    currentSession = null
  }
  
  sessionInitialized = true
  return currentSession
}

function writeSession(user: AuthUser | null): void {
  currentSession = user
  if (!user) sessionStorage.removeItem(SESSION_KEY)
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

function readRegistered(): StoredAccount[] {
  try {
    const raw = sessionStorage.getItem(REGISTERED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredAccount[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRegistered(accounts: StoredAccount[]): void {
  sessionStorage.setItem(REGISTERED_KEY, JSON.stringify(accounts))
}

async function fetchBackendSession(input: {
  dni: string
  email: string
  nombre: string
  apellido: string
}): Promise<Partial<AuthUser>> {
  try {
    const response = await fetch(apiUrl('/api/auth/mock-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) return {}

    const data = await response.json()
    return {
      id: data.user?._id ?? data.user?.id,
      token: data.token,
      obraSocial: data.user?.obraSocial,
      telefono: data.user?.telefono,
      nroAfiliado: data.user?.nroAfiliado,
    }
  } catch {
    return {}
  }
}

let sessionListeners = new Set<() => void>()

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener)

  // También escuchar cambios de otras pestañas (opcional pero recomendado)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) {
      // Forzar re-lectura
      sessionInitialized = false
      readSession()
      listener()
    }
  }
  window.addEventListener('storage', handleStorage)

  return () => {
    sessionListeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

function emitSession() {
  // Asegurarnos de que la próxima lectura no use el caché viejo
  // Aunque writeSession ya actualiza currentSession, esto es por seguridad
  sessionListeners.forEach((l) => l())
}

type AuthContextValue = {
  user: AuthUser | null
  login: (dni: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  register: (input: {
    nombre: string
    apellido: string
    dni: string
    email: string
    password: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  loginDemo: () => Promise<void>
  logout: () => void
  updateUser: (data: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(
    subscribeSession,
    readSession,
    () => null
  )

  const login = useCallback(async (dni: string, password: string) => {
    const key = normalizeDni(dni)
    if (!key || !password.trim()) {
      return { ok: false as const, message: 'Ingresá tu DNI y contraseña para continuar.' }
    }
    const accounts = readRegistered()
    const found = accounts.find((a) => normalizeDni(a.dni) === key)
    if (!found || found.password !== password) {
      return { ok: false as const, message: 'DNI o contraseña incorrectos. Si no tenés cuenta, registrate.' }
    }
    const backendSession = await fetchBackendSession({
      dni: key,
      email: found.email,
      nombre: found.nombre,
      apellido: found.apellido,
    })
    const next: AuthUser = {
      dni: key,
      email: found.email,
      nombre: found.nombre,
      apellido: found.apellido,
      isDemo: false,
      ...backendSession,
    }
    writeSession(next)
    emitSession()
    return { ok: true as const }
  }, [])

  const register = useCallback(
    async (input: {
      nombre: string
      apellido: string
      dni: string
      email: string
      password: string
    }) => {
      const key = normalizeDni(input.dni)
      if (!key) return { ok: false as const, message: 'Ingresá un DNI válido.' }

      const accounts = readRegistered()
      if (accounts.some((a) => normalizeDni(a.dni) === key)) {
        return { ok: false as const, message: 'Ya existe una cuenta con ese DNI. Iniciá sesión.' }
      }

      accounts.push({
        dni: key,
        email: input.email.trim(),
        nombre: input.nombre.trim(),
        apellido: input.apellido.trim(),
        password: input.password,
      })
      writeRegistered(accounts)

      const backendSession = await fetchBackendSession({
        dni: key,
        email: input.email.trim(),
        nombre: input.nombre.trim(),
        apellido: input.apellido.trim(),
      })
      const next: AuthUser = {
        dni: key,
        email: input.email.trim(),
        nombre: input.nombre.trim(),
        apellido: input.apellido.trim(),
        isDemo: false,
        ...backendSession,
      }
      writeSession(next)
      emitSession()
      return { ok: true as const }
    },
    []
  )

  const loginDemo = useCallback(async () => {
    const parts = currentPatient.name.trim().split(/\s+/)
    const apellido = parts.length > 1 ? parts[parts.length - 1]! : ''
    const nombre = parts.length > 1 ? parts.slice(0, -1).join(' ') : (parts[0] ?? '')
    const backendSession = await fetchBackendSession({
      dni: normalizeDni(currentPatient.dni),
      email: currentPatient.email,
      nombre,
      apellido,
    })
    const next: AuthUser = {
      dni: normalizeDni(currentPatient.dni),
      email: currentPatient.email,
      nombre,
      apellido,
      isDemo: true,
      obraSocial: currentPatient.obraSocial,
      ...backendSession,
    }
    writeSession(next)
    emitSession()
  }, [])

  const logout = useCallback(() => {
    writeSession(null)
    emitSession()
  }, [])

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    if (!currentSession) return
    const next = { ...currentSession, ...data }
    writeSession(next)
    emitSession()
  }, [])

  const value = useMemo(
    () => ({ user, login, register, loginDemo, logout, updateUser }),
    [user, login, register, loginDemo, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

/** Rutas del portal: requieren sesión. */
export function RequireAuth() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}
