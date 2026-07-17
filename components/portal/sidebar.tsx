import { useState, useEffect } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  Heart,
  Video,
  CreditCard,
  User,
  Bell,
  ChevronRight,
  Menu,
  X,
  Activity,
  LogOut,
  Database,
  FileText,
  Calendar,
  Pill,
  FlaskConical,
  Image,
  Bed,
  Receipt,
  ExternalLink,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { currentPatient } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/src/context/AuthContext"
import { apiUrl } from "@/lib/api"
import { toast } from "sonner"

const externalModules = [
  {
    label: "Core M10",
    description: "Gestión central de la red",
    icon: Database,
    baseUrl: "https://healthgrid.cantero.ar/auth/sso?ticket=",
  },
  {
    label: "Historia Clínica (HCE)",
    description: "Fichas, antecedentes y evolución",
    icon: FileText,
    baseUrl: "https://healthgrid-hce-frontend-olive.vercel.app/auth/sso?ticket=",
  },
  {
    label: "Turnos M2",
    description: "Reserva y gestión de citas",
    icon: Calendar,
    baseUrl: "https://turnos.solefrancisco.com/auth/sso",
  },
  {
    label: "Farmacia M3",
    description: "Medicamentos y recetas",
    icon: Pill,
    baseUrl: "https://front-modulo3-farmacia.vercel.app",
  },
  {
    label: "Laboratorio M5",
    description: "Análisis y órdenes de estudio",
    icon: FlaskConical,
    baseUrl: "https://modulo-laboratorio.up.railway.app/auth/sso?ticket=",
  },
  {
    label: "Imágenes M6",
    description: "Estudios de diagnóstico",
    icon: Image,
    baseUrl: "https://uade-da-2-frontend.vercel.app/auth/sso?ticket=TICKET_REAL&redirect=/MENU",
  },
  {
    label: "Internaciones M9",
    description: "Gestión de camas y estadías",
    icon: Bed,
    baseUrl: "https://internaciones-y-camas.vercel.app/auth/sso?ticket=",
  },
  {
    label: "Facturación M7",
    description: "Historial de pagos y cuentas",
    icon: Receipt,
    baseUrl: "https://modulo7-frontend.onrender.com/auth/sso?ticket=",
  },
  {
    label: "Monitoreo M11",
    description: "IoT y seguimiento continuo",
    icon: Activity,
    baseUrl: "https://dzp5goz8czibt.cloudfront.net/auth/sso?ticket=<ticket>&redirect=/login",
  },
]

const navItems = [
  {
    href: "/notificaciones",
    label: "Notificaciones",
    icon: Bell,
    description: "Avisos, turnos y novedades",
  },
  {
    href: "/mi-salud",
    label: "Mi Salud",
    icon: Heart,
    description: "Turnos, recetas y resultados",
  },
  {
    href: "/sala-virtual",
    label: "Sala Virtual",
    icon: Video,
    description: "Teleconsultas médicas",
  },
  {
    href: "/pagos",
    label: "Pagos Online",
    icon: CreditCard,
    description: "Coseguros y facturación",
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: User,
    description: "Datos personales y seguridad",
  },
]

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [redirectingLabel, setRedirectingLabel] = useState<string | null>(null)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout, unreadCount, setUnreadCount } = useAuth()

  const handleExternalRedirect = async (label: string, baseUrl: string) => {
    if (!user?.token) return
    const toastId = toast.loading(`Iniciando sesión segura en ${label}...`)
    try {
      setRedirectingLabel(label)
      const res = await fetch(apiUrl('/api/auth/sso-ticket'), {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json'
        }
      })
      if (!res.ok) throw new Error('Error al obtener ticket SSO')
      const data = await res.json()
      const ticket = data.ticket

      if (!ticket) {
        throw new Error('Ticket SSO inválido')
      }

      let finalUrl = baseUrl
      if (finalUrl.includes('ticket=')) {
        finalUrl = finalUrl.replace('TICKET_REAL', ticket).replace('<ticket>', ticket)
        if (!finalUrl.includes(ticket)) {
          finalUrl = finalUrl + ticket
        }
      } else {
        if (!finalUrl.includes('/auth/sso')) {
          if (!finalUrl.endsWith('/')) finalUrl += '/'
          finalUrl += 'auth/sso'
        }
        const separator = finalUrl.includes('?') ? '&' : '?'
        finalUrl = `${finalUrl}${separator}ticket=${encodeURIComponent(ticket)}`
      }

      toast.success(`Sesión sincronizada con ${label}`, { id: toastId })
      window.open(finalUrl, '_blank')
    } catch (err) {
      console.error('Error al redirigir con SSO:', err)
      toast.error(`Error de conexión con ${label}. Accediendo de modo general.`, { id: toastId })
      window.open(baseUrl, '_blank')
    } finally {
      setRedirectingLabel(null)
    }
  }

  useEffect(() => {
    if (!user?.token) return

    fetch(apiUrl('/api/perfil/notificaciones'), {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setUnreadCount(data.filter((n: any) => !n.read).length)
        }
      })
      .catch(() => {})
  }, [user?.token, pathname, setUnreadCount])

  const displayName =
    user && (user.nombre || user.apellido)
      ? [user.nombre, user.apellido].filter(Boolean).join(" ")
      : currentPatient.name
  const displaySubtitle = user?.obraSocial ?? "Cuenta paciente"
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")

  const handleLogout = () => {
    logout()
    navigate("/", { replace: true })
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Activity className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold text-sidebar-foreground leading-none">
              Health Grid
            </span>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Portal del Paciente</p>
          </div>
        </div>
      </div>

      {/* Patient info */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg bg-sidebar-accent">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{displaySubtitle}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Nav Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Unified Nav */}
        <nav className="space-y-1" aria-label="Navegación principal">
          {navItems.map(({ href, label, icon: Icon, description }) => {
            const isActive = pathname.startsWith(href)
            return (
              <NavLink
                key={href}
                onClick={() => setMobileOpen(false)}
                to={href}
                className={() =>
                  cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group relative",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    {label === "Notificaciones" && unreadCount > 0 && (
                      <Badge
                        className={cn(
                          "text-xs h-5 min-w-5 flex items-center justify-center",
                          isActive
                            ? "bg-primary-foreground text-primary"
                            : "bg-accent text-accent-foreground"
                        )}
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs truncate",
                      isActive ? "text-primary-foreground/70" : "text-sidebar-foreground/50"
                    )}
                  >
                    {description}
                  </p>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </NavLink>
            )
          })}

          {externalModules.map(({ label, description, icon: Icon, baseUrl }) => {
            const isRedirecting = redirectingLabel === label
            return (
              <button
                key={label}
                onClick={() => handleExternalRedirect(label, baseUrl)}
                disabled={redirectingLabel !== null}
                className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group relative text-sidebar-foreground hover:bg-sidebar-accent w-full text-left disabled:opacity-50"
              >
                {isRedirecting ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                ) : (
                  <Icon className="w-5 h-5 text-sidebar-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <p className="text-xs truncate text-sidebar-foreground/50">
                    {description}
                  </p>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border flex-shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
        <p className="text-xs text-sidebar-foreground/30 text-center mt-3">
          Health Grid v2.4.1 · HIPAA
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex-shrink-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-serif font-bold text-sidebar-foreground">Health Grid</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-sidebar-foreground p-1"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          <aside
            className="absolute top-0 left-0 w-64 sm:w-72 h-full bg-sidebar overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-16 h-full flex flex-col">
              <SidebarContent />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
