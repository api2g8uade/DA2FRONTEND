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
import { upcomingAppointments} from '@/lib/mock-data'
import { getInitialVirtualMeetings, toUpcomingAppointment } from '@/lib/virtual-meetings'
import { useRecipes } from '@/src/context/RecipesContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/src/context/AuthContext'

type Tab = 'turnos' | 'recetas' | 'laboratorio'

function formatDate(dateStr: string) {
  const date = new Date(dateStr)

  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

type UpcomingAppointment = (typeof upcomingAppointments)[number]

function AppointmentsTab({ appointments }: { appointments: UpcomingAppointment[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">Turnos Próximos</h2>
      </div>
      {appointments.map((appt) => (
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
                    appt.status === 'confirmado'
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
      ))}
    </div>
  )
}

function PrescriptionsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { recipes, loading, error, refreshRecipes } = useRecipes()

  useEffect(() => {
    refreshRecipes()
  }, [refreshRecipes])

  if (loading) {
    return <div className="text-center text-muted-foreground">Cargando recetas...</div>
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>
  }

  if (recipes.length === 0) {
    return <div className="text-center text-muted-foreground">No hay recetas disponibles</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl font-bold text-foreground">Historial de Recetas</h2>
      {recipes.map((rec) => {
        const isOpen = expandedId === rec._id
        return (
          <Card key={rec._id} className="border-border shadow-none overflow-hidden">
            <button
              className="w-full text-left"
              onClick={() => setExpandedId(isOpen ? null : rec._id)}
              aria-expanded={isOpen}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Receta {rec._id.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">{rec.medicoId}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Emitida el {rec.fechaEmision.split('T')[0].split('-').reverse().join('/')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        rec.estado === 'VIGENTE'
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
                    <p className="text-xs text-muted-foreground mt-0.5">Dosis: {rec.dosis}</p>
                    <p className="text-xs text-muted-foreground mt-1">Indicaciones: {rec.indicaciones}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function LabTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [labResults, setLabResults] = useState<LabResult[]>([])

  const { user } = useAuth()

  useEffect(() => {
    if (!user?.token) return

    async function loadLabResults() {
      try {
        const data = await fetchLabResults(user!.token!)

        setLabResults(data)

        console.log('Lab results:', data)
      } catch (error) {
        console.error('Error cargando laboratorio:', error)
      }
    }

    loadLabResults()
  }, [user])

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
          onClick={() => window.location.reload()}
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
        const isOpen = expandedId === lab._id

        return (
          <Card
            key={lab._id}
            className="border border-border shadow-none overflow-hidden"
          >
            <button
              className="w-full text-left"
              onClick={() => setExpandedId(isOpen ? null : lab._id)}
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
                        {lab.estudio}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Estado: {lab.estado}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(lab.fechaRealizacion)}
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
                        {lab.resultados.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-2.5 pr-4 text-foreground">
                              {r.parametro}
                            </td>

                            <td className="py-2.5 pr-4 text-right font-mono font-semibold text-foreground">
                              {r.valor}{' '}
                              <span className="text-muted-foreground font-normal">
                                {r.unidad}
                              </span>
                            </td>

                            <td className="py-2.5 pr-4 text-right text-muted-foreground">
                              {r.rangoReferencia}
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

                  {lab.observaciones && (
                    <div className="mt-4 rounded-lg bg-muted p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Observaciones
                      </p>

                      <p className="text-sm text-foreground">
                        {lab.observaciones}
                      </p>
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

  useEffect(() => {
    refreshRecipes()
  }, [refreshRecipes])

  const upcomingAppointmentsWithVirtualMeetings = useMemo(() => {
    const nonVirtualAppointments = upcomingAppointments.filter((appointment) => appointment.modality !== 'virtual')
    const virtualMeetingsAsAppointments = getInitialVirtualMeetings().map(toUpcomingAppointment)

    return [...nonVirtualAppointments, ...virtualMeetingsAsAppointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}:00`).getTime()
      const dateB = new Date(`${b.date}T${b.time}:00`).getTime()
      return dateA - dateB
    })
  }, [])

  const activeRecipesCount = useMemo(() => {
    return recipes.filter((r) => r.estado === 'VIGENTE').length
  }, [recipes])

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
            value: upcomingAppointmentsWithVirtualMeetings.length,
            icon: Calendar,
            color: 'text-primary',
          },
          {
            label: 'Recetas vigentes',
            value: activeRecipesCount,
            icon: FileText,
            color: 'text-accent',
          },
          { label: 'Resultados', value: 0, icon: FlaskConical, color: 'text-primary' },
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
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 min-w-max sm:flex-auto flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors',
              activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'turnos' && <AppointmentsTab appointments={upcomingAppointmentsWithVirtualMeetings} />}
      {activeTab === 'recetas' && <PrescriptionsTab />}
      {activeTab === 'laboratorio' && <LabTab />}
    </div>
  )
}

