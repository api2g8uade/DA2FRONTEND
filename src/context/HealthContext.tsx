import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useAuth, type AuthUser } from './AuthContext'
import { fetchRecipes } from '@/lib/api/recipes'
import { fetchAppointments, type UpcomingAppointment } from '@/lib/api/appointments'
import { fetchLabResults, type LabResult } from '@/lib/api/labResults'
import { apiUrl } from '@/lib/api'
import type { Recipe } from '@/lib/types/recipes'

type HealthContextValue = {
  recipes: Recipe[]
  loadingRecipes: boolean
  recipesError: string | null
  refreshRecipes: () => Promise<void>

  appointments: UpcomingAppointment[]
  loadingAppointments: boolean
  appointmentsError: string | null
  refreshAppointments: () => Promise<void>

  labResults: LabResult[]
  loadingLab: boolean
  labError: string | null
  refreshLab: () => Promise<void>

  payments: any[]
  loadingPayments: boolean
  paymentsError: string | null
  refreshPayments: () => Promise<void>

  refreshAll: () => void
}

const HealthContext = createContext<HealthContextValue | null>(null)

export function HealthProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth()

  // Recetas
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  const [recipesError, setRecipesError] = useState<string | null>(null)

  // Turnos
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

  // Laboratorio
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [loadingLab, setLoadingLab] = useState(false)
  const [labError, setLabError] = useState<string | null>(null)

  // Pagos
  const [payments, setPayments] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!user?.token) return
    try {
      const response = await fetch(apiUrl('/api/perfil'), {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (response.ok) {
        const data = await response.json()
        if (data) {
          const { first_name, last_name, nombre, apellido, dni, telefono, obraSocial, nroAfiliado, fechaNacimiento } = data
          const updatedData: Partial<AuthUser> = {}
          if (nombre || first_name) updatedData.nombre = nombre || first_name
          if (apellido || last_name) updatedData.apellido = apellido || last_name
          if (dni) updatedData.dni = dni
          if (telefono) updatedData.telefono = telefono
          if (obraSocial) updatedData.obraSocial = obraSocial
          if (nroAfiliado) updatedData.nroAfiliado = nroAfiliado
          if (fechaNacimiento) updatedData.fechaNacimiento = fechaNacimiento
          
          updateUser(updatedData)
        }
      }
    } catch (err) {
      console.error('[HealthContext] Error pre-cargando perfil:', err)
    }
  }, [user?.token, updateUser])

  const refreshRecipes = useCallback(async (silent = false) => {
    if (!user?.token) return
    if (!silent) setLoadingRecipes(true)
    setRecipesError(null)
    try {
      const data = await fetchRecipes(user.token)
      setRecipes(data)
    } catch (err) {
      setRecipesError(err instanceof Error ? err.message : 'Error cargando recetas')
    } finally {
      if (!silent) setLoadingRecipes(false)
    }
  }, [user?.token])

  const refreshAppointments = useCallback(async (silent = false) => {
    if (!user?.token) return
    if (!silent) setLoadingAppointments(true)
    setAppointmentsError(null)
    try {
      const data = await fetchAppointments(user.token)
      setAppointments(data)
    } catch (err) {
      setAppointmentsError(err instanceof Error ? err.message : 'Error cargando turnos')
    } finally {
      if (!silent) setLoadingAppointments(false)
    }
  }, [user?.token])

  const refreshLab = useCallback(async (silent = false) => {
    if (!user?.token) return
    if (!silent) setLoadingLab(true)
    setLabError(null)
    try {
      const data = await fetchLabResults(user.token)
      setLabResults(data)
    } catch (err) {
      setLabError(err instanceof Error ? err.message : 'Error cargando resultados')
    } finally {
      if (!silent) setLoadingLab(false)
    }
  }, [user?.token])

  const refreshPayments = useCallback(async (silent = false) => {
    if (!user?.token) return
    if (!silent) setLoadingPayments(true)
    setPaymentsError(null)
    try {
      const response = await fetch(apiUrl('/api/pagos/historial'), {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'No se pudo cargar el historial de pagos.')
      setPayments(Array.isArray(data) ? data : [])
    } catch (err) {
      setPaymentsError(err instanceof Error ? err.message : 'No se pudo cargar el historial de pagos.')
    } finally {
      if (!silent) setLoadingPayments(false)
    }
  }, [user?.token])

  const refreshAll = useCallback((silent = false) => {
    if (!user?.token) return
    // Disparar todos en paralelo (no bloqueante entre sí)
    refreshProfile()
    refreshRecipes(silent)
    refreshAppointments(silent)
    refreshLab(silent)
    refreshPayments(silent)
  }, [user?.token, refreshProfile, refreshRecipes, refreshAppointments, refreshLab, refreshPayments])

  // Pre-cargar datos tan pronto como el usuario inicie sesión
  useEffect(() => {
    if (user?.token) {
      console.log('[HealthContext] Pre-cargando todos los datos médicos y pagos en paralelo...')
      refreshAll()
    } else {
      // Limpiar estados al cerrar sesión
      setRecipes([])
      setAppointments([])
      setLabResults([])
      setPayments([])
    }
  }, [user?.token])

  const value = useMemo(
    () => ({
      recipes,
      loadingRecipes,
      recipesError,
      refreshRecipes,
      appointments,
      loadingAppointments,
      appointmentsError,
      refreshAppointments,
      labResults,
      loadingLab,
      labError,
      refreshLab,
      payments,
      loadingPayments,
      paymentsError,
      refreshPayments,
      refreshAll,
    }),
    [
      recipes,
      loadingRecipes,
      recipesError,
      refreshRecipes,
      appointments,
      loadingAppointments,
      appointmentsError,
      refreshAppointments,
      labResults,
      loadingLab,
      labError,
      refreshLab,
      payments,
      loadingPayments,
      paymentsError,
      refreshPayments,
      refreshAll,
    ]
  )

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext)
  if (!ctx) throw new Error('useHealth debe usarse dentro de HealthProvider')
  return ctx
}
