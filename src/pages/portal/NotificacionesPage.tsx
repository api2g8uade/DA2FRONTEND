import { useEffect, useState } from 'react'
import {
  Bell,
  FlaskConical,
  Calendar,
  FileText,
  CreditCard,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/src/context/AuthContext'
import { apiUrl } from '@/lib/api'

type BackendNotification = {
  _id: string
  type: string
  title: string
  message: string
  read: boolean
  urgent: boolean
  createdAt: string
}

const notificationIconMap: Record<string, React.ElementType> = {
  resultado: FlaskConical,
  turno: Calendar,
  receta: FileText,
  pago: CreditCard,
}

const notificationColorMap: Record<string, string> = {
  resultado: 'text-amber-600 bg-amber-50',
  turno: 'text-primary bg-primary/10',
  receta: 'text-accent bg-accent/10',
  pago: 'text-primary bg-primary/10',
}

function formatTime(dateStr: string) {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

export function NotificacionesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<BackendNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.token) return

    setLoading(true)
    setError('')
    fetch(apiUrl('/api/perfil/notificaciones'), {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar las notificaciones.')
        return r.json() as Promise<BackendNotification[]>
      })
      .then((data) => {
        setItems(data)
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user?.token])

  const markRead = async (id: string) => {
    if (!user?.token) return
    // Optimistic UI update
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    try {
      const response = await fetch(apiUrl(`/api/perfil/notificaciones/${id}/read`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (!response.ok) throw new Error()
      const data = await response.json() as BackendNotification[]
      setItems(data)
    } catch {
      // Dejamos el estado optimista
    }
  }

  const remove = async (id: string) => {
    if (!user?.token) return
    // Optimistic UI update
    setItems((prev) => prev.filter((n) => n._id !== id))
    try {
      const response = await fetch(apiUrl(`/api/perfil/notificaciones/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (!response.ok) throw new Error()
      const data = await response.json() as BackendNotification[]
      setItems(data)
    } catch {
      // Dejamos el estado optimista
    }
  }

  const markAllRead = async () => {
    if (!user?.token) return
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      const response = await fetch(apiUrl('/api/perfil/notificaciones/read-all'), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${user.token}` },
      })
      if (!response.ok) throw new Error()
      const data = await response.json() as BackendNotification[]
      setItems(data)
    } catch {}
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Portal del Paciente
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-balance">Notificaciones</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Revisá tus avisos, turnos, recetas y novedades del sistema.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">Avisos Recientes</h2>
            {unread > 0 && <Badge className="bg-accent text-accent-foreground text-xs">{unread} nuevas</Badge>}
          </div>
          {unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-muted text-xs w-full sm:w-auto"
              onClick={markAllRead}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {loading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Cargando notificaciones...</p>
          ) : (
            items.map((notif) => {
              const Icon = notificationIconMap[notif.type] ?? Bell
              const colorClass = notificationColorMap[notif.type] ?? 'text-primary bg-primary/10'
              return (
                <Card
                  key={notif._id}
                  className={cn(
                    'border shadow-none transition-colors',
                    notif.read ? 'border-border' : 'border-accent/30 bg-accent/5'
                  )}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <div
                        className={cn(
                          'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          colorClass.split(' ').slice(1).join(' ')
                        )}
                      >
                        <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', colorClass.split(' ')[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                            {notif.urgent && (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs" variant="outline">
                                Urgente
                              </Badge>
                            )}
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />}
                          </div>
                          <button
                            onClick={() => remove(notif._id)}
                            className="text-muted-foreground hover:text-foreground flex-shrink-0"
                            aria-label="Eliminar notificación"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{formatTime(notif.createdAt)}</span>
                          {!notif.read && (
                            <button
                              onClick={() => markRead(notif._id)}
                              className="text-xs text-accent hover:text-accent/80 font-medium"
                            >
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          {!loading && items.length === 0 && (
            <Card className="border-border shadow-none">
              <CardContent className="p-6 sm:p-12 flex flex-col items-center gap-3 text-center">
                <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No tenés notificaciones.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base font-bold">Preferencias de notificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Recordatorios de turnos', description: '24 hs y 1 hora antes', enabled: true },
              { label: 'Resultados de laboratorio', description: 'Cuando estén disponibles', enabled: true },
              { label: 'Recetas y medicamentos', description: 'Vencimientos y renovaciones', enabled: true },
              { label: 'Pagos y coseguros', description: 'Confirmaciones y vencimientos', enabled: false },
              { label: 'Novedades del sistema', description: 'Actualizaciones y mantenimientos', enabled: false },
            ].map(({ label, description, enabled: init }) => {
              const [on, setOn] = useState(init)
              return (
                <div key={label} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    onClick={() => setOn(!on)}
                    className={cn('relative w-10 h-6 rounded-full transition-colors flex-shrink-0', on ? 'bg-primary' : 'bg-muted')}
                  >
                    <span
                      className={cn(
                        'absolute top-1 left-1 w-4 h-4 rounded-full bg-card shadow transition-transform',
                        on ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                    <span className="sr-only">{on ? 'Activado' : 'Desactivado'}</span>
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
