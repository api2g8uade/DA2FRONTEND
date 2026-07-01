import { useMemo, useState, useEffect } from 'react'
import {
  Calendar,
  FileText,
  FlaskConical,
  Clock,
  MapPin,
  Video,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchLabResults, type LabResult } from '@/lib/api/labResults'
import { fetchAppointments, type UpcomingAppointment } from '@/lib/api/appointments'
import { useRecipes } from '@/src/context/RecipesContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/src/context/AuthContext'
import { API_BASE_URL } from '@/lib/api'
import { io } from 'socket.io-client'

type Tab = 'turnos' | 'recetas' | 'laboratorio'

function formatDate(dateStr: string) {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const date = new Date(year, month, day)

  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
function isUpcoming(dateStr: string) {
  if (!dateStr) return false
  const todayStr = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
  return dateStr.slice(0, 10) >= todayStr
}

function AppointmentsTab({
  upcoming,
  past,
}: {
  upcoming: UpcomingAppointment[]
  past: UpcomingAppointment[]
}) {
  return (
    <div className="space-y-6">
      {/* Turnos Próximos */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">Turnos Próximos</h2>
          <Button
            asChild
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-secondary w-full sm:w-auto"
          >
            <a href="https://turnos.solefrancisco.com">
              + Solicitar turno
            </a>
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <Card className="border-border shadow-none">
            <CardContent className="p-6 text-center text-muted-foreground">
              No tenés turnos programados.
            </CardContent>
          </Card>
        ) : (
          upcoming.map((appt) => (
            <Card key={appt.id} className="border-border shadow-none">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {appt.modality === 'virtual' ? (
                        <Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      ) : (
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm sm:text-base truncate">{appt.doctor}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{appt.specialty}</p>
                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {formatDate(appt.date)} · {appt.time} hs
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{appt.location}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Badge
                      className={cn(
                        'text-xs capitalize',
                        appt.status === 'confirmado' || appt.status === 'APROBADO'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                      variant="outline"
                    >
                      {appt.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Historial de Turnos Pasados */}
      {past.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="font-serif text-lg font-bold text-foreground">Historial de Turnos Pasados</h2>
          <div className="space-y-3 opacity-75">
            {past.map((appt) => (
              <Card key={appt.id} className="border-border bg-muted/30 shadow-none">
                <CardContent className="p-4 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-foreground text-sm truncate">{appt.doctor}</p>
                        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border capitalize">
                          {appt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{appt.specialty}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Realizado el {formatDate(appt.date)} a las {appt.time} hs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PrescriptionsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { recipes, loading, error, refreshRecipes } = useRecipes()

  useEffect(() => {
    refreshRecipes()
  }, [refreshRecipes])

  const vigentes = useMemo(() => {
    return recipes.filter(r => r.estado === 'VIGENTE' || r.estado === 'Activa')
  }, [recipes])

  const pasadas = useMemo(() => {
    return recipes.filter(r => r.estado !== 'VIGENTE' && r.estado !== 'Activa')
  }, [recipes])

  if (loading) {
    return <div className="text-center text-muted-foreground">Cargando recetas...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>
  }

  if (recipes.length === 0) {
    return <div className="text-center text-muted-foreground">No hay recetas disponibles</div>
  }

  const renderRecipeCard = (rec: any) => {
    const recId = rec.id_receta?.toString() || rec._id || 'Desconocido'
    const isOpen = expandedId === recId
    const isVigente = rec.estado === 'VIGENTE' || rec.estado === 'Activa'

    return (
      <Card key={recId} className={cn("border-border shadow-none overflow-hidden", !isVigente && "opacity-75 bg-muted/10")}>
        <button
          className="w-full text-left"
          onClick={() => setExpandedId(isOpen ? null : recId)}
          aria-expanded={isOpen}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className={cn("shrink-0 w-12 h-12 rounded-xl flex items-center justify-center", isVigente ? "bg-accent/10" : "bg-muted")}>
                  <FileText className={cn("w-6 h-6", isVigente ? "text-accent" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Receta {recId.slice(-6)}</p>
                  {rec.medicoId && <p className="text-sm text-muted-foreground">{rec.medicoId}</p>}
                  {rec.fechaEmision && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Emitida el {rec.fechaEmision.split('T')[0].split('-').reverse().join('/')}
                    </p>
                  )}
                  {rec.id_evolucion && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Evolución asociada: {rec.id_evolucion}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    isVigente
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {rec.estado}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </button>
        {isOpen && (
          <div className="px-5 pb-5 border-t border-border">
            <div className="pt-4 space-y-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground">{rec.medicamento}</p>
                {rec.dosis && <p className="text-xs text-muted-foreground mt-0.5">Dosis: {rec.dosis}</p>}
                <p className="text-xs text-muted-foreground mt-1">Indicaciones: {rec.indicaciones}</p>
              </div>

              {rec.alertas_farmacologicas && rec.alertas_farmacologicas.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2">
                    Alertas Farmacológicas
                  </h4>
                  {rec.alertas_farmacologicas.map((alerta: any, idx: number) => (
                    <div key={idx} className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-2">
                      <p className="font-semibold">{alerta.tipo}</p>
                      <p>{alerta.descripcion}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-border text-foreground hover:bg-muted"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recetas Vigentes */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">Recetas Vigentes</h2>
        {vigentes.length === 0 ? (
          <Card className="border-border shadow-none">
            <CardContent className="p-6 text-center text-muted-foreground">
              No tenés recetas vigentes.
            </CardContent>
          </Card>
        ) : (
          vigentes.map(renderRecipeCard)
        )}
      </div>

      {/* Historial de Recetas */}
      {pasadas.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="font-serif text-lg font-bold text-foreground">Historial de Recetas</h2>
          <div className="space-y-3">
            {pasadas.map(renderRecipeCard)}
          </div>
        </div>
      )}
    </div>
  )
}

function LabTab({ labResults, refreshLab }: { labResults: LabResult[], refreshLab: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold text-foreground">
          Resultados de Laboratorio
        </h2>

        <Button
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-muted text-xs"
          onClick={refreshLab}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Actualizar
        </Button>
      </div>

      {labResults.length === 0 && (
        <Card className="border border-border shadow-none">
          <CardContent className="p-6 text-center text-muted-foreground">
            No hay resultados de laboratorio disponibles.
          </CardContent>
        </Card>
      )}

      {labResults.map((lab) => {
        const labId = lab.id?.toString() || lab._id
        const isOpen = expandedId === labId

        return (
          <Card
            key={labId}
            className="border border-border shadow-none overflow-hidden"
          >
            <button
              className="w-full text-left"
              onClick={() => setExpandedId(isOpen ? null : labId)}
              aria-expanded={isOpen}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FlaskConical className="w-6 h-6 text-primary" />
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        {lab.estudiosSolicitados?.[0]?.nombre || 'Orden de Laboratorio'}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Estado: {lab.estado === '3' ? 'Finalizado' : 'Pendiente'}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(lab.fechaSolicitud)}
                      </p>
                    </div>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-border">
                <div className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">
                            Parámetro
                          </th>

                          <th className="text-right text-xs font-semibold text-muted-foreground pb-2 pr-4">
                            Valor
                          </th>

                          <th className="text-right text-xs font-semibold text-muted-foreground pb-2 pr-4">
                            Referencia
                          </th>

                          <th className="text-right text-xs font-semibold text-muted-foreground pb-2">
                            Estado
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {lab.resultados?.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-2.5 pr-4 text-foreground">
                              {r.nombreAnalito}
                            </td>

                            <td className="py-2.5 pr-4 text-right font-mono font-semibold text-foreground">
                              {r.valor}{' '}
                              <span className="text-muted-foreground font-normal">
                                {r.unidadMedida}
                              </span>
                            </td>

                            <td className="py-2.5 pr-4 text-right text-muted-foreground">
                              {r.rangosReferencia?.length > 0 
                                ? `${r.rangosReferencia[0].valorMinimo} - ${r.rangosReferencia[0].valorMaximo}`
                                : '-'}
                            </td>

                            <td className="py-2.5 text-right">
                              {!r.fueraDeRango ? (
                                <span className="flex items-center justify-end gap-1 text-primary text-xs">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Normal
                                </span>
                              ) : (
                                <span className="flex items-center justify-end gap-1 text-amber-600 text-xs">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Fuera de rango
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {lab.resultados?.some(r => r.observacionTecnica) && (
                    <div className="mt-4 rounded-lg bg-muted p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Observaciones
                      </p>

                      <ul className="text-sm text-foreground list-disc list-inside">
                        {lab.resultados
                          .filter(r => r.observacionTecnica)
                          .map((r, i) => (
                            <li key={i}>{r.nombreAnalito}: {r.observacionTecnica}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-border text-foreground hover:bg-muted"
                  >
                    <Download className="w-3.5 h-3.5 mr-2" />
                    Descargar informe
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'turnos', label: 'Turnos', icon: Calendar },
  { id: 'recetas', label: 'Recetas', icon: FileText },
  { id: 'laboratorio', label: 'Laboratorio', icon: FlaskConical },
]

export function MiSaludPage() {
  const [activeTab, setActiveTab] = useState<Tab>('turnos')
  const { recipes, refreshRecipes } = useRecipes()
  const { user } = useAuth()

  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [loadingLab, setLoadingLab] = useState(true)
  const [labError, setLabError] = useState<string | null>(null)

  const refreshAllData = useCallback(async () => {
    if (!user?.token) return
    
    // Cargar turnos
    try {
      setLoadingAppointments(true)
      setAppointmentsError(null)
      const data = await fetchAppointments(user.token)
      setAppointments(data)
    } catch (err: any) {
      console.error('Error fetching appointments:', err)
      setAppointmentsError('No se pudieron cargar los turnos.')
    } finally {
      setLoadingAppointments(false)
    }

    // Cargar laboratorios
    try {
      setLoadingLab(true)
      setLabError(null)
      const data = await fetchLabResults(user.token)
      setLabResults(data)
    } catch (err: any) {
      console.error('Error fetching lab results:', err)
      setLabError('No se pudieron cargar los laboratorios.')
    } finally {
      setLoadingLab(false)
    }

    // Recetas
    refreshRecipes()
  }, [user, refreshRecipes])

  useEffect(() => {
    refreshAllData()
  }, [refreshAllData])

  // Escuchar notificaciones vía WebSockets para sincronizar en tiempo real
  useEffect(() => {
    if (!user?.id) return

    console.log('[mi-salud] Conectando WebSocket silencioso para recargas en tiempo real...')
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling']
    })

    socket.emit('subscribe_notifications', user.id)

    socket.on('nueva_notificacion', (notif: any) => {
      console.log('[mi-salud] Notificación recibida en tiempo real:', notif)
      // Recargar datos silenciosamente
      fetchAppointments(user.token).then(setAppointments).catch(() => {})
      fetchLabResults(user.token).then(setLabResults).catch(() => {})
      refreshRecipes()
    })

    return () => {
      socket.off('nueva_notificacion')
      socket.disconnect()
      console.log('[mi-salud] WebSocket de recarga en tiempo real desconectado.')
    }
  }, [user, refreshRecipes])

  // Clasificar turnos
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const upcoming: UpcomingAppointment[] = []
    const past: UpcomingAppointment[] = []
    
    // Ordenar cronológicamente
    const sorted = [...appointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00`).getTime()
      const dateB = new Date(`${b.date}T${b.time}:00`).getTime()
      return dateA - dateB
    })

    for (const appt of sorted) {
      if (isUpcoming(appt.date) && appt.status !== 'CANCELLED' && appt.status !== 'cancelado') {
        upcoming.push(appt)
      } else {
        past.push(appt)
      }
    }
    
    // El historial queremos mostrarlo del más nuevo al más viejo
    past.reverse()

    return { upcomingAppointments: upcoming, pastAppointments: past }
  }, [appointments])

  const activeRecipesCount = useMemo(() => {
    return recipes.filter((r) => r.estado === 'VIGENTE' || r.estado === 'Activa').length
  }, [recipes])

  const loading = loadingAppointments || loadingLab

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
          Portal del Paciente
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground text-balance">Mi Salud</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Accedé a tus turnos, recetas y resultados de laboratorio.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {[
          {
            label: 'Turnos próximos',
            value: upcomingAppointments.length,
            icon: Calendar,
            color: 'text-primary',
          },
          {
            label: 'Recetas vigentes',
            value: activeRecipesCount,
            icon: FileText,
            color: 'text-accent',
          },
          { 
            label: 'Resultados de estudios', 
            value: labResults.length, 
            icon: FlaskConical, 
            color: 'text-primary' 
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border shadow-none">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <Icon className={cn('w-5 h-5 sm:w-7 sm:h-7 shrink-0', color)} />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-none">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-full overflow-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const count = id === 'turnos'
            ? upcomingAppointments.length
            : (id === 'recetas'
              ? activeRecipesCount
              : labResults.length)
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 min-w-max sm:flex-auto flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors',
                activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {count > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full shrink-0">
                  {count}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {loading && <div className="text-center text-muted-foreground py-8">Cargando datos médicos...</div>}
      
      {!loading && (
        <>
          {activeTab === 'turnos' && (
            <AppointmentsTab upcoming={upcomingAppointments} past={pastAppointments} />
          )}
          {activeTab === 'recetas' && <PrescriptionsTab />}
          {activeTab === 'laboratorio' && (
            <LabTab labResults={labResults} refreshLab={refreshAllData} />
          )}
        </>
      )}
    </div>
  )
}

