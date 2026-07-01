import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { apiUrl, API_BASE_URL } from '@/lib/api'
import { currentPatient } from '@/lib/mock-data'
import { io } from 'socket.io-client'
import { toast } from 'sonner'

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
  fechaNacimiento?: string
  coreId?: string | number
  coreToken?: string
}

type StoredAccount = {
  dni: string
  email: string
  nombre: string
  apellido: string
  password: string
  fechaNacimiento?: string
}

const REGISTERED_KEY = 'healthgrid-registered-users'
const SESSION_KEY = 'healthgrid-session'

function normalizeDni(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function fallbackDniFromEmail(email: string): string {
  let hash = 0

  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0
  }

  return String(hash).padStart(8, '0').slice(0, 8)
}

let currentSession: AuthUser | null = null
let sessionInitialized = false

function readSession(): AuthUser | null {
  if (sessionInitialized) return currentSession

  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AuthUser
      if (parsed?.email) {
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
  let parsed: StoredAccount[] = []
  try {
    const raw = sessionStorage.getItem(REGISTERED_KEY)
    if (raw) {
      const rawParsed = JSON.parse(raw) as StoredAccount[]
      if (Array.isArray(rawParsed)) parsed = rawParsed
    }
  } catch {}

  const demoEmail = normalizeEmail(currentPatient.email)
  if (!parsed.some((acc) => normalizeEmail(acc.email) === demoEmail)) {
    const parts = currentPatient.name.trim().split(/\s+/)
    const apellido = parts.length > 1 ? parts[parts.length - 1]! : ''
    const nombre = parts.length > 1 ? parts.slice(0, -1).join(' ') : (parts[0] ?? '')
    parsed.push({
      dni: normalizeDni(currentPatient.dni) || fallbackDniFromEmail(demoEmail),
      email: demoEmail,
      nombre,
      apellido,
      password: 'demo123',
      fechaNacimiento: currentPatient.dateOfBirth
    })
  }
  return parsed
}

function writeRegistered(accounts: StoredAccount[]): void {
  sessionStorage.setItem(REGISTERED_KEY, JSON.stringify(accounts))
}

/**
 * Detecta el modo del back (mock|real) consultando GET /api/config.
 * En este flujo local seguimos usando mock-login para obtener token interno.
 */
let backendModePromise: Promise<'mock' | 'real'> | null = null

function getBackendMode(): Promise<'mock' | 'real'> {
  if (!backendModePromise) {
    backendModePromise = fetch(apiUrl('/api/config'))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.integrationMode === 'real' ? 'real' : 'mock'))
      .catch(() => 'mock')
  }

  return backendModePromise
}

/** Normaliza la respuesta del back. */
function mapBackendUser(data: any): Partial<AuthUser> {
  return {
    id: data?.user?._id ?? data?.user?.id,
    token: data?.token,
    obraSocial: data?.user?.obraSocial,
    telefono: data?.user?.telefono,
    nroAfiliado: data?.user?.nroAfiliado,
    fechaNacimiento: data?.user?.fechaNacimiento,
    coreId: data?.core?.coreId ?? data?.user?.coreId,
    coreToken: data?.core?.coreToken,
  }
}

async function fetchBackendSession(input: {
  dni: string
  email: string
  nombre: string
  apellido: string
  password?: string
  fechaNacimiento?: string
  coreId?: string | number
}): Promise<Partial<AuthUser>> {
  try {
    const mode = await getBackendMode()

    if (mode === 'real' && input.password) {
      const real = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
        }),
      })

      if (real.ok) return mapBackendUser(await real.json())
    }

    const response = await fetch(apiUrl('/api/auth/mock-login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dni: input.dni,
        email: input.email,
        nombre: input.nombre,
        apellido: input.apellido,
        fechaNacimiento: input.fechaNacimiento,
        coreId: input.coreId,
        password: input.password,
      }),
    })

    if (!response.ok) return {}

    return mapBackendUser(await response.json())
  } catch {
    return {}
  }
}

let sessionListeners = new Set<() => void>()

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener)

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) {
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
  sessionListeners.forEach((listener) => listener())
}

type AuthContextValue = {
  user: AuthUser | null
  unreadCount: number
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
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

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user || !user.id) {
      console.warn('[socket-client] No hay sesión de usuario activa o falta user.id para iniciar WebSockets.');
      return;
    }

    console.log(`[socket-client] Conectando a ${API_BASE_URL} para el usuario "${user.id}"...`);
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log(`[socket-client] Conectado a WebSockets. Emitiendo 'subscribe_notifications' para: "${user.id}"`);
      socket.emit('subscribe_notifications', user.id)
    })

    socket.on('nueva_notificacion', (notif: any) => {
      console.log('[socket-client] Notificación recibida en tiempo real:', notif)
      
      // Incrementar el contador de no leídos en tiempo real
      setUnreadCount((prev) => prev + 1)
      
      // Mostrar toast interactivo con Sonner
      toast.info(notif.cuerpo || notif.message || 'Tenés una novedad', {
        description: notif.titulo || 'Portal del Paciente',
        duration: 8000,
        action: {
          label: 'Ver',
          onClick: () => {
            window.location.href = '/notificaciones'
          }
        }
      })
    })

    socket.on('connect_error', (error) => {
      console.error('[socket-client] Error de conexión WebSocket:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[socket-client] Desconectado de WebSockets. Motivo: ${reason}`);
    })

    return () => {
      console.log('[socket-client] Desconectando socket por cambio de usuario o desmontaje.');
      socket.disconnect()
    }
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    const cleanEmail = normalizeEmail(email)

    if (!cleanEmail || !password.trim()) {
      return { ok: false as const, message: 'Ingresá tu email y contraseña para continuar.' }
    }

    const accounts = readRegistered()
    const found = accounts.find((account) => normalizeEmail(account.email) === cleanEmail)

    if (!found || found.password !== password) {
      return { ok: false as const, message: 'Email o contraseña incorrectos. Si no tenés cuenta, registrate.' }
    }

    const dni = normalizeDni(found.dni) || fallbackDniFromEmail(cleanEmail)

    const backendSession = await fetchBackendSession({
      dni,
      email: found.email,
      nombre: found.nombre,
      apellido: found.apellido,
      password,
      fechaNacimiento: found.fechaNacimiento,
    })

    const next: AuthUser = {
      dni,
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
      const cleanEmail = normalizeEmail(input.email)
      const dni = normalizeDni(input.dni) || fallbackDniFromEmail(cleanEmail)

      if (!input.nombre.trim() || !input.apellido.trim()) {
        return { ok: false as const, message: 'Completá tu nombre y apellido.' }
      }

      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { ok: false as const, message: 'Ingresá un email válido.' }
      }

      if (input.password.length < 6) {
        return { ok: false as const, message: 'La contraseña debe tener al menos 6 caracteres.' }
      }

      const accounts = readRegistered()

      if (accounts.some((account) => normalizeEmail(account.email) === cleanEmail)) {
        return { ok: false as const, message: 'Ya existe una cuenta con ese email. Iniciá sesión.' }
      }

      accounts.push({
        dni,
        email: cleanEmail,
        nombre: input.nombre.trim(),
        apellido: input.apellido.trim(),
        password: input.password,
      })

      writeRegistered(accounts)

      const backendSession = await fetchBackendSession({
        dni,
        email: cleanEmail,
        nombre: input.nombre.trim(),
        apellido: input.apellido.trim(),
        password: input.password,
      })

      const next: AuthUser = {
        dni,
        email: cleanEmail,
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

    const demoEmail = normalizeEmail(currentPatient.email)
    const demoDni = normalizeDni(currentPatient.dni) || fallbackDniFromEmail(demoEmail)

    const backendSession = await fetchBackendSession({
      dni: demoDni,
      email: demoEmail,
      nombre,
      apellido,
      coreId: currentPatient.id,
    })

    const next: AuthUser = {
      dni: demoDni,
      email: demoEmail,
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
    () => ({ user, unreadCount, setUnreadCount, login, register, loginDemo, logout, updateUser }),
    [user, unreadCount, login, register, loginDemo, logout, updateUser]
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