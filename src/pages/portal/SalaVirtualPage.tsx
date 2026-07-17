import { useMemo, useState, useEffect } from 'react'
import {
  Video,
  ExternalLink,
  Loader2,
  User,
  Calendar,
  Clock,
  Wifi,
  Camera,
  Mic,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { fetchAppointments, type UpcomingAppointment } from '@/lib/api/appointments'
import { apiCall } from '@/lib/api/client'
import { useAuth } from '@/src/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatFriendlyDate(dateStr: string) {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const date = new Date(year, month, day)
  const formatted = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function SalaVirtualPage() {
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState<string | null>(null)
  const { user } = useAuth()

  const loadAppointments = async () => {
    if (!user?.token) return
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAppointments(user.token)
      setAppointments(data)
    } catch (err: any) {
      console.error('Error loading appointments for virtual room:', err)
      setError('No se pudieron cargar tus turnos programados.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [user])

  // Filtrar turnos virtuales activos (no cancelados ni completados)
  const virtualAppointments = useMemo(() => {
    return appointments
      .filter((appt) => appt.modality === 'virtual' && appt.status !== 'cancelado' && appt.status !== 'completado' && !appt.isHighComplexity)
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}:00`).getTime()
        const dateB = new Date(`${b.date}T${b.time}:00`).getTime()
        return dateA - dateB
      })
  }, [appointments])

  // Encontrar el turno virtual activo en el rango (30 minutos antes y después de la hora actual)
  const activeAppointment = useMemo(() => {
    const now = new Date()
    return virtualAppointments.find((appt) => {
      const apptDate = new Date(`${appt.date}T${appt.time}:00`)
      const diffMs = now.getTime() - apptDate.getTime()
      const diffMins = Math.abs(diffMs) / (60 * 1000)
      return diffMins <= 30
    })
  }, [virtualAppointments])

  // Próximo turno virtual programado en el futuro (si no hay uno activo actualmente)
  const nextAppointment = useMemo(() => {
    if (activeAppointment) return null
    const now = new Date()
    return virtualAppointments.find((appt) => {
      const apptDate = new Date(`${appt.date}T${appt.time}:00`)
      return apptDate.getTime() > now.getTime()
    })
  }, [virtualAppointments, activeAppointment])

  const handleJoinCall = async (apptId: string) => {
    if (!user?.token) return
    try {
      setJoining(apptId)
      const response = await apiCall<{ link: string }>(`/api/sala-virtual/token/${apptId}`, { token: user.token })
      if (response && response.link) {
        window.open(response.link, '_blank')
      } else {
        alert('No se pudo generar el enlace para la videollamada.')
      }
    } catch (err) {
      console.error('Error requesting meeting token:', err)
      alert('Hubo un problema al conectar con la sala de videollamada. Por favor, reintente en unos instantes.')
    } finally {
      setJoining(null)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Portal del Paciente
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-balance">
          Sala Virtual
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Accedé de forma segura a tus consultas médicas a distancia mediante videollamada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <Card className="border-border shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Buscando videoconsultas programadas...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5 shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <div>
                  <h3 className="font-medium text-foreground">Error al cargar turnos</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={loadAppointments} variant="outline" className="border-border">
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : activeAppointment ? (
            <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-md overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                      Consulta Activa
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Teleconsulta
                  </Badge>
                </div>
                <CardTitle className="font-serif text-xl sm:text-2xl font-bold mt-2 text-foreground">
                  Tu videollamada está lista
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">Médico / Profesional</p>
                      <p className="font-semibold text-foreground text-base sm:text-lg">{activeAppointment.doctor}</p>
                      <p className="text-sm text-muted-foreground">{activeAppointment.specialty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Fecha</p>
                        <p className="text-sm font-medium text-foreground truncate">{formatFriendlyDate(activeAppointment.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Horario de inicio</p>
                        <p className="text-sm font-medium text-foreground">{activeAppointment.time} hs</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    id="btn-join-call"
                    onClick={() => handleJoinCall(activeAppointment.id)}
                    disabled={joining === activeAppointment.id}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-6 rounded-xl shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/35 active:scale-[0.98]"
                  >
                    {joining === activeAppointment.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Iniciando sala virtual...
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 mr-2" />
                        Ingresar a la videollamada
                        <ExternalLink className="w-4 h-4 ml-1.5 opacity-80" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : nextAppointment ? (
            <Card className="border-border bg-card shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-muted-foreground/30" />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-medium">
                    Próxima Consulta
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Teleconsulta
                  </Badge>
                </div>
                <CardTitle className="font-serif text-lg sm:text-xl font-bold mt-2 text-foreground">
                  Próxima videollamada agendada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/40 border border-border/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4.5 h-4.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Médico / Profesional</p>
                      <p className="font-medium text-foreground text-sm sm:text-base">{nextAppointment.doctor}</p>
                      <p className="text-xs text-muted-foreground">{nextAppointment.specialty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-xs font-medium text-foreground truncate">{formatFriendlyDate(nextAppointment.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-xs font-medium text-foreground">{nextAppointment.time} hs</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800/90 leading-normal">
                    La llamada para el siguiente turno virtual con el <strong>Dr. {nextAppointment.doctor}</strong>, el día <strong>{formatFriendlyDate(nextAppointment.date)}</strong> a las <strong>{nextAppointment.time} hs</strong>, se habilitará automáticamente 30 minutos antes del horario (desde las {
                      (() => {
                        const apptDate = new Date(`${nextAppointment.date}T${nextAppointment.time}:00`)
                        const activationTime = new Date(apptDate.getTime() - 30 * 60 * 1000)
                        return activationTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                      })()
                    } hs).
                  </p>
                </div>

                <Button
                  disabled
                  className="w-full bg-muted text-muted-foreground border-border font-medium py-5 rounded-xl cursor-not-allowed"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Ingresar a la videollamada
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                  <Video className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground">No tenés videoconsultas programadas</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1.5 leading-relaxed">
                    Las salas de teleconsulta se habilitan automáticamente 30 minutos antes del horario reservado para tu turno virtual.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">


          <Card className="border-border shadow-none">
            <CardHeader className="pb-3 border-b border-border/80">
              <CardTitle className="font-serif text-base font-bold flex items-center gap-2">
                Preparación recomendada
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Cámara web activa</p>
                  <p className="text-2xs sm:text-xs text-muted-foreground">Asegurate de estar en un ambiente iluminado.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Micrófono y audio</p>
                  <p className="text-2xs sm:text-xs text-muted-foreground">Usar auriculares mejora la claridad y privacidad.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                  <Wifi className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Conexión estable</p>
                  <p className="text-2xs sm:text-xs text-muted-foreground">Preferí redes Wi-Fi confiables frente a datos móviles.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}