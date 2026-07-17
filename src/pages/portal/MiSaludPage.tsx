import { useMemo, useState, useEffect, useCallback } from 'react'
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
import { useHealth } from '@/src/context/HealthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/src/context/AuthContext'
import { jsPDF } from 'jspdf'

const renderIndications = (indicacionesStr: string) => {
  if (!indicacionesStr) return <p className="text-xs text-muted-foreground mt-1">Sin indicaciones particulares</p>;

  try {
    const data = JSON.parse(indicacionesStr);

    const hasFields = data.tipoConsulta || data.diagnostico || data.planTratamiento || data.observacionesAdicionales;
    if (!hasFields) {
      return <p className="text-xs text-muted-foreground mt-1">Indicaciones: {indicacionesStr}</p>;
    }

    const cleanVal = (val: string) => (val && val !== '-' && val !== 'null') ? val : null;

    const fields = [
      { label: 'Tipo de Consulta', value: cleanVal(data.tipoConsulta)?.replace('_', ' ') },
      { label: 'Fecha/Hora', value: cleanVal(data.fechaHora) },
      { label: 'Profesional', value: cleanVal(data.profesional) },
      { label: 'Diagnóstico', value: cleanVal(data.diagnostico) },
      { label: 'Plan de Tratamiento', value: cleanVal(data.planTratamiento) },
      { label: 'Observaciones', value: cleanVal(data.observacionesAdicionales) },
      { label: 'Motivo / Estado', value: cleanVal(data.motivoEstado) },
    ].filter(f => f.value);

    if (fields.length === 0) {
      return <p className="text-xs text-muted-foreground mt-1">Sin indicaciones particulares</p>;
    }

    return (
      <div className="mt-2 pt-2 border-t border-border/30 space-y-1 text-xs">
        <p className="font-semibold text-foreground mb-1">Detalles de Consulta:</p>
        {fields.map(f => (
          <p key={f.label} className="text-muted-foreground">
            <span className="font-medium text-foreground">{f.label}:</span> {f.value}
          </p>
        ))}
      </div>
    );
  } catch (e) {
    return <p className="text-xs text-muted-foreground mt-1">Indicaciones: {indicacionesStr}</p>;
  }
};

const downloadRecipePDF = (rec: any, patientName: string) => {
  const doc = new jsPDF()

  // Header background
  doc.setFillColor(79, 70, 229) // Brand color (Indigo 600)
  doc.rect(0, 0, 210, 40, 'F')

  // Header text
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('HEALTH GRID', 15, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Portal del Paciente - Receta Médica', 15, 28)

  // Document info
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const recId = rec.id_receta?.toString() || rec._id || 'Desconocido'
  doc.text(`Receta N°: ${recId.slice(-8).toUpperCase()}`, 195, 20, { align: 'right' })

  const emissionDate = rec.fechaEmision || rec.createdAt || new Date().toISOString()
  const dateFormatted = emissionDate.split('T')[0].split('-').reverse().join('/')
  doc.setFont('helvetica', 'normal')
  doc.text(`Emitida el: ${dateFormatted}`, 195, 28, { align: 'right' })

  // Patient details block
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('INFORMACIÓN DEL PACIENTE', 15, 55)
  doc.line(15, 57, 195, 57)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Paciente: ${patientName}`, 15, 65)
  doc.text(`Estado de la Receta: ${rec.estado || 'Activa'}`, 15, 71)

  // Prescription content block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('PRESCRIPCIÓN MÉDICA', 15, 85)
  doc.line(15, 87, 195, 87)

  // Medication Name box
  doc.setFillColor(243, 244, 246)
  doc.rect(15, 93, 180, 20, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`Medicamento: ${rec.medicamento}`, 20, 100)
  if (rec.dosis) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Dosis: ${rec.dosis}`, 20, 107)
  }

  // Indications
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Indicaciones / Instrucciones de uso:', 15, 123)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let indicationsText = rec.indicaciones || 'Sin indicaciones particulares';
  try {
    const data = JSON.parse(rec.indicaciones);
    const cleanVal = (val: string) => (val && val !== '-' && val !== 'null') ? val : null;
    const lines = [];
    if (cleanVal(data.tipoConsulta)) lines.push(`Tipo Consulta: ${data.tipoConsulta.replace('_', ' ')}`);
    if (cleanVal(data.fechaHora)) lines.push(`Fecha/Hora: ${data.fechaHora}`);
    if (cleanVal(data.profesional)) lines.push(`Profesional: ${data.profesional.replace(/\s*\(HCE ID:\s*\d+\)/i, '')}`);
    if (cleanVal(data.diagnostico)) lines.push(`Diagnóstico: ${data.diagnostico}`);
    if (cleanVal(data.planTratamiento)) lines.push(`Plan de Tratamiento: ${data.planTratamiento}`);
    if (cleanVal(data.observacionesAdicionales)) lines.push(`Observaciones: ${data.observacionesAdicionales}`);
    if (lines.length > 0) {
      indicationsText = lines.join('\n');
    }
  } catch (e) {
    // No es JSON
  }

  const splitIndications = doc.splitTextToSize(indicationsText, 180)
  doc.text(splitIndications, 15, 129)

  // Pharmacological Alerts block
  let currentY = 135 + (splitIndications.length * 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Alertas Farmacológicas:', 15, currentY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  if (rec.alertas_farmacologicas && rec.alertas_farmacologicas.length > 0) {
    currentY += 5
    rec.alertas_farmacologicas.forEach((alerta: any) => {
      doc.setFillColor(254, 242, 242)
      doc.rect(15, currentY, 180, 12, 'F')
      doc.setTextColor(220, 38, 38)
      doc.setFont('helvetica', 'bold')
      doc.text(`[${alerta.tipo}]`, 20, currentY + 7)
      doc.setFont('helvetica', 'normal')
      doc.text(alerta.descripcion, 60, currentY + 7)
      currentY += 15
    })
  } else {
    doc.text('No hay alertas farmacológicas indicadas para esta receta.', 15, currentY + 5)
    currentY += 15
  }

  // Doctor/Medic signature block
  currentY = Math.max(currentY + 15, 200)
  doc.setTextColor(31, 41, 55)
  doc.line(120, currentY, 185, currentY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const docName = (rec.medicoId || 'Médico Responsable').replace(/\s*\(HCE ID:\s*\d+\)/i, '')
  doc.text(docName, 152.5, currentY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Firma y Sello del Profesional', 152.5, currentY + 11, { align: 'center' })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('Documento de carácter digital generado a través de Health Grid.', 105, 280, { align: 'center' })

  doc.save(`receta_${recId.slice(-6).toUpperCase()}.pdf`)
}

const downloadLabPDF = (lab: any, patientName: string) => {
  const doc = new jsPDF()

  // Header background
  doc.setFillColor(79, 70, 229) // Indigo 600
  doc.rect(0, 0, 210, 40, 'F')

  // Header text
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('HEALTH GRID', 15, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Portal del Paciente - Informe de Laboratorio', 15, 28)

  // Document info
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const labId = lab.id?.toString() || lab._id || 'Desconocido'
  doc.text(`Informe N°: ${labId.slice(-8).toUpperCase()}`, 195, 20, { align: 'right' })

  const reqDate = lab.fechaSolicitud || lab.createdAt || new Date().toISOString()
  const dateFormatted = new Date(reqDate).toLocaleDateString('es-AR')
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${dateFormatted}`, 195, 28, { align: 'right' })

  // Patient Details Block
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('DATOS DEL PACIENTE', 15, 55)
  doc.line(15, 57, 195, 57)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Paciente: ${patientName}`, 15, 65)
  doc.text(`DNI: ${lab.pacienteDni || 'No registrado'}`, 15, 71)
  doc.text(`Edad: ${lab.pacienteEdad || '-'} años   |   Sexo: ${lab.pacienteSexo || '-'}`, 15, 77)
  doc.text(`Prioridad de la orden: ${lab.prioridad || 'RUTINA'}`, 15, 83)

  // Results Table header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('RESULTADOS DE ANÁLISIS CLÍNICOS', 15, 97)
  doc.line(15, 99, 195, 99)

  // Table columns
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Parámetro / Analito', 15, 106)
  doc.text('Valor Hallado', 100, 106)
  doc.text('Rango Referencia', 145, 106)
  doc.text('Estado', 180, 106)
  doc.line(15, 109, 195, 109)

  doc.setFont('helvetica', 'normal')
  let currentY = 116

  if (lab.resultados && lab.resultados.length > 0) {
    lab.resultados.forEach((r: any) => {
      // Background shading for criticals/out of range
      if (r.esCritico) {
        doc.setFillColor(254, 242, 242)
        doc.rect(15, currentY - 5, 180, 8, 'F')
        doc.setTextColor(220, 38, 38)
      } else if (r.fueraDeRango) {
        doc.setFillColor(255, 251, 235)
        doc.rect(15, currentY - 5, 180, 8, 'F')
        doc.setTextColor(217, 119, 6)
      } else {
        doc.setTextColor(31, 41, 55)
      }

      doc.text(r.nombreAnalito || 'Analito', 15, currentY)
      doc.text(`${r.valor} ${r.unidadMedida}`, 100, currentY)

      const minMax = r.rangosReferencia?.length > 0
        ? `${r.rangosReferencia[0].valorMinimo} - ${r.rangosReferencia[0].valorMaximo}`
        : '-'
      doc.text(minMax, 145, currentY)

      const statusText = r.esCritico ? 'CRÍTICO' : (r.fueraDeRango ? 'ALTO/BAJO' : 'NORMAL')
      doc.text(statusText, 180, currentY)

      currentY += 10
    })
  } else {
    doc.setTextColor(107, 114, 128)
    doc.text('No se han registrado resultados médicos aún.', 15, currentY)
    currentY += 10
  }

  doc.setTextColor(31, 41, 55)
  doc.line(15, currentY - 4, 195, currentY - 4)

  // Technical observations
  const obs = lab.resultados?.filter((r: any) => r.observacionTecnica) || []
  if (obs.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('Observaciones Técnicas:', 15, currentY + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    currentY += 8
    obs.forEach((r: any) => {
      const splitObs = doc.splitTextToSize(`* ${r.nombreAnalito}: ${r.observacionTecnica}`, 180)
      doc.text(splitObs, 15, currentY)
      currentY += (splitObs.length * 5)
    })
    currentY += 5
  }

  // Bioq signature block
  currentY = Math.max(currentY + 20, 200)
  const bioq = lab.resultados?.[0]?.bioquimicoResponsable || 'Bioquímico a cargo'
  doc.line(120, currentY, 185, currentY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(bioq, 152.5, currentY + 6, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Firma del Bioquímico Responsable', 152.5, currentY + 11, { align: 'center' })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('Documento de carácter digital generado a través de Health Grid.', 105, 280, { align: 'center' })

  doc.save(`informe_laboratorio_${labId.slice(-6).toUpperCase()}.pdf`)
}

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
  const [subTab, setSubTab] = useState<'activos' | 'historial'>('activos')
  const [expandedId, setExpandedId] = useState<number | string | null>(null)

  const renderApptCard = (appt: UpcomingAppointment, isPast: boolean) => {
    const isOpen = expandedId === appt.id
    const isVirtual = appt.modality === 'virtual'

    return (
      <Card key={appt.id} className={cn("border-border shadow-none overflow-hidden transition-all", isPast && "bg-muted/10 opacity-75")}>
        <button
          className="w-full text-left"
          onClick={() => setExpandedId(isOpen ? null : appt.id)}
          aria-expanded={isOpen}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                <div className={cn(
                  "shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
                  isPast ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                )}>
                  {isVirtual ? (
                    <Video className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base truncate">{appt.doctor}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{appt.specialty}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {formatDate(appt.date)} · {appt.time} hs
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {appt.isHighComplexity && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    Alta Complejidad
                  </Badge>
                )}
                <Badge
                  className={cn(
                    'text-xs capitalize',
                    ['cancelled', 'cancelado'].includes(appt.status?.toLowerCase())
                      ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10'
                      : (['checked_in', 'checked_in_at'].includes(appt.status?.toLowerCase())
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                        : (['completed', 'completado'].includes(appt.status?.toLowerCase())
                          ? 'bg-muted text-muted-foreground border-border'
                          : (['confirmado', 'confirmed', 'aprobado'].includes(appt.status?.toLowerCase())
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800')))
                  )}
                  variant="outline"
                >
                  {appt.status?.replace('_', ' ')}
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
          <div className="px-5 pb-5 border-t border-border bg-muted/5">
            <div className="pt-4 space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Centro Médico</p>
                  <p className="font-medium text-foreground mt-0.5">{appt.location || 'Consultorio Central'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modalidad</p>
                  <p className="font-medium text-foreground mt-0.5 capitalize">{appt.modality || 'Presencial'}</p>
                </div>
                {appt.ends_at && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora de Finalización</p>
                    <p className="font-medium text-foreground mt-0.5">{appt.ends_at.slice(11, 16)} hs</p>
                  </div>
                )}
              </div>

              {appt.isHighComplexity && (
                <div className="pt-2 pb-1">
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Las consultas de alta complejidad requieren modalidad presencial.</span>
                  </p>
                </div>
              )}

              {isVirtual && !isPast && (
                <div className="pt-2">
                  <Button
                    asChild
                    className="w-full sm:w-auto bg-primary hover:bg-secondary text-primary-foreground"
                  >
                    <a href={appt.linkVideollamada || "/sala-virtual"}>
                      <Video className="w-4 h-4 mr-2" />
                      Ingresar a Sala Virtual
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        {/* Sub Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg max-w-xs w-full sm:w-auto">
          <button
            onClick={() => { setSubTab('activos'); setExpandedId(null); }}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
              subTab === 'activos' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Turnos Próximos
          </button>
          <button
            onClick={() => { setSubTab('historial'); setExpandedId(null); }}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
              subTab === 'historial' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Historial
          </button>
        </div>

        {subTab === 'activos' && (
          <Button
            asChild
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-secondary w-full sm:w-auto"
          >
            <a href="https://turnos.solefrancisco.com">
              + Solicitar turno
            </a>
          </Button>
        )}
      </div>

      {subTab === 'activos' ? (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <Card className="border-border shadow-none">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No tenés turnos programados.
              </CardContent>
            </Card>
          ) : (
            upcoming.map(appt => renderApptCard(appt, false))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {past.length === 0 ? (
            <Card className="border-border shadow-none">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No tenés turnos pasados.
              </CardContent>
            </Card>
          ) : (
            past.map(appt => renderApptCard(appt, true))
          )}
        </div>
      )}
    </div>
  )
}

function PrescriptionsTab() {
  const { user } = useAuth()
  const [subTab, setSubTab] = useState<'vigentes' | 'historial'>('vigentes')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { recipes, loadingRecipes: loading, recipesError: error, refreshRecipes } = useHealth()

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
      <Card key={recId} className={cn("border-border shadow-none overflow-hidden transition-all", !isVigente && "opacity-75 bg-muted/10")}>
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
                  {(rec.fechaEmision || rec.createdAt) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Emitida el {(rec.fechaEmision || rec.createdAt).split('T')[0].split('-').reverse().join('/')}
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
          <div className="px-5 pb-5 border-t border-border bg-muted/5">
            <div className="pt-4 space-y-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground">{rec.medicamento}</p>
                {rec.dosis && <p className="text-xs text-muted-foreground mt-0.5">Dosis: {rec.dosis}</p>}
              </div>

              {rec.alertas_farmacologicas && rec.alertas_farmacologicas.length > 0 ? (
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
              ) : (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Alertas Farmacológicas
                  </h4>
                  <p className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-lg">
                    No hay alertas farmacológicas indicadas.
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-border text-foreground hover:bg-muted"
                onClick={() => downloadRecipePDF(rec, user ? `${user.nombre} ${user.apellido}`.trim() : 'Paciente')}
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
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg max-w-xs w-full mb-2">
        <button
          onClick={() => { setSubTab('vigentes'); setExpandedId(null); }}
          className={cn(
            "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
            subTab === 'vigentes' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Recetas Vigentes
        </button>
        <button
          onClick={() => { setSubTab('historial'); setExpandedId(null); }}
          className={cn(
            "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
            subTab === 'historial' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Historial
        </button>
      </div>

      {subTab === 'vigentes' ? (
        <div className="space-y-3">
          {vigentes.length === 0 ? (
            <Card className="border-border shadow-none">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No tenés recetas vigentes.
              </CardContent>
            </Card>
          ) : (
            vigentes.map(renderRecipeCard)
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {pasadas.length === 0 ? (
            <Card className="border-border shadow-none">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No tenés recetas archivadas o pasadas.
              </CardContent>
            </Card>
          ) : (
            pasadas.map(renderRecipeCard)
          )}
        </div>
      )}
    </div>
  )
}

// Map estado string/number from M4 to display config
// Flujo: Pendiente(0) -> EnProceso(1) -> Finalizada(2) -> Entregada(3)
function getEstadoConfig(estado: string | number | undefined) {
  const s = String(estado ?? '').toLowerCase().replace(/\s/g, '')
  if (s === '0' || s === 'pendiente') return { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
  if (s === '1' || s === 'enproceso') return { label: 'En Proceso', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' }
  if (s === '2' || s === 'finalizada') return { label: 'Finalizada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
  if (s === '3' || s === 'entregada' || s === 'finalizado') return { label: 'Entregada', color: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' }
  return { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
}

function LabTab({ labResults, refreshLab }: { labResults: LabResult[], refreshLab: () => void }) {
  const { user } = useAuth()
  const [subTab, setSubTab] = useState<'ultimos' | 'historial'>('ultimos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newResultIds, setNewResultIds] = useState<Set<string>>(new Set())

  // Mark newly arrived results (from socket) with a highlight
  useEffect(() => {
    if (labResults.length === 0) return
    const finalizadas = labResults.filter(l => {
      const s = String(l.estado ?? '').toLowerCase().replace(/\s/g, '')
      return s === '2' || s === 'finalizada' || s === '3' || s === 'entregada' || s === 'finalizado'
    })
    const ids = new Set(finalizadas.map(l => String(l.id ?? l._id)))
    setNewResultIds(prev => {
      // Only mark as new those that weren't finalizadas before
      const added = new Set<string>()
      ids.forEach(id => { if (!prev.has(id)) added.add(id) })
      return ids
    })
  }, [labResults])

  const { ultimos, historial } = useMemo(() => {
    const active: LabResult[] = []
    const history: LabResult[] = []

    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 30)

    for (const res of labResults) {
      const s = String(res.estado ?? '').toLowerCase().replace(/\s/g, '')
      const isFinished = s === '3' || s === 'entregada' || s === 'finalizado'
      const reqDate = res.fechaSolicitud ? new Date(res.fechaSolicitud) : (res.createdAt ? new Date(res.createdAt) : new Date())

      if (!isFinished || reqDate >= threshold) {
        active.push(res)
      } else {
        history.push(res)
      }
    }

    const sortByDate = (a: LabResult, b: LabResult) => {
      const dateA = a.fechaSolicitud ? new Date(a.fechaSolicitud).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      const dateB = b.fechaSolicitud ? new Date(b.fechaSolicitud).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
      return dateB - dateA
    }

    return {
      ultimos: active.sort(sortByDate),
      historial: history.sort(sortByDate)
    }
  }, [labResults])

  const renderLabCard = (lab: LabResult) => {
    const labId = lab.id?.toString() || lab._id
    const isOpen = expandedId === labId
    const estadoConfig = getEstadoConfig(lab.estado)
    const isFinished = ['finalizada', 'entregada', 'finalizado', '2', '3'].includes(String(lab.estado ?? '').toLowerCase().replace(/\s/g, ''))
    const isNew = newResultIds.has(labId) && isFinished
    const hasResults = (lab.resultados?.length ?? 0) > 0
    const hasCritical = lab.resultados?.some(r => r.esCritico)
    const hasOutOfRange = lab.resultados?.some(r => r.fueraDeRango && !r.esCritico)
    const studyNames = lab.estudiosSolicitados?.map((e: any) => e.nombre).filter(Boolean) ?? []

    return (
      <Card
        key={labId}
        className={cn(
          "border border-border shadow-none overflow-hidden transition-all",
          isNew && "ring-2 ring-emerald-400/60",
          !isFinished && "opacity-90"
        )}
      >
        <button
          className="w-full text-left"
          onClick={() => setExpandedId(isOpen ? null : labId)}
          aria-expanded={isOpen}
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-4 min-w-0 flex-1">
                <div className={cn(
                  "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                  hasCritical ? "bg-red-100 text-red-700" : hasOutOfRange ? "bg-amber-100 text-amber-700" : isFinished ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <FlaskConical className="w-6 h-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">
                      {studyNames.length > 0 ? studyNames[0] : 'Orden de Laboratorio'}
                    </p>
                    {isNew && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                        Nuevo
                      </span>
                    )}
                    {hasCritical && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Crítico
                      </span>
                    )}
                  </div>

                  {studyNames.length > 1 && (
                    <p className="text-xs text-muted-foreground truncate">
                      + {studyNames.slice(1).join(', ')}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border', estadoConfig.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', estadoConfig.dot)} />
                      {estadoConfig.label}
                    </span>
                    {lab.prioridad && lab.prioridad !== 'Normal' && lab.prioridad !== '0' && (
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border',
                        lab.prioridad === 'STAT' || lab.prioridad === '2' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-muted text-muted-foreground border-border'
                      )}>
                        {lab.prioridad === '2' ? 'STAT' : lab.prioridad === '1' ? 'URGENTE' : lab.prioridad}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(lab.fechaSolicitud)}
                    </span>
                  </div>
                </div>
              </div>

              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              )}
            </div>
          </CardContent>
        </button>

        {isOpen && (
          <div className="px-5 pb-5 border-t border-border bg-muted/5">
            <div className="pt-4">
              {/* Estado del flujo — timeline */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Flujo de la orden</p>
                <div className="flex items-center gap-0">
                  {(['Pendiente', 'En Proceso', 'Finalizada', 'Entregada'] as const).map((step, idx) => {
                    const stepStates = ['pendiente', 'enproceso', 'finalizada', 'entregada']
                    const currentIdx = ['0', 'pendiente', '1', 'enproceso', '2', 'finalizada', '3', 'entregada', 'finalizado'].indexOf(
                      String(lab.estado ?? '').toLowerCase().replace(/\s/g, '')
                    )
                    const mappedIdx = currentIdx <= 1 ? 0 : currentIdx <= 3 ? 1 : currentIdx <= 5 ? 2 : 3
                    const isActive = idx === mappedIdx
                    const isDone = idx < mappedIdx
                    return (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                            isDone ? 'bg-primary border-primary text-primary-foreground' :
                              isActive ? 'bg-primary/10 border-primary text-primary' :
                                'bg-muted border-border text-muted-foreground'
                          )}>
                            {isDone ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={cn('text-[10px] mt-1 font-medium', isActive ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground')}>
                            {step}
                          </span>
                        </div>
                        {idx < 3 && (
                          <div className={cn('flex-1 h-0.5 mx-1 mb-4', isDone ? 'bg-primary' : 'bg-border')} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resultados */}
              {hasResults ? (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resultados de análisis</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-semibold text-muted-foreground pb-2 pr-4">Parámetro</th>
                          <th className="text-right text-xs font-semibold text-muted-foreground pb-2 pr-4">Valor</th>
                          <th className="text-right text-xs font-semibold text-muted-foreground pb-2 pr-4">Referencia</th>
                          <th className="text-right text-xs font-semibold text-muted-foreground pb-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lab.resultados?.map((r, i) => (
                          <tr
                            key={i}
                            className={cn(
                              "border-b border-border/50 last:border-0",
                              r.esCritico && "bg-red-50/50",
                              !r.esCritico && r.fueraDeRango && "bg-amber-50/50"
                            )}
                          >
                            <td className="py-2.5 pr-4 text-foreground font-medium">{r.nombreAnalito}</td>

                            <td className={cn(
                              "py-2.5 pr-4 text-right font-mono font-bold",
                              r.esCritico ? "text-red-600" : r.fueraDeRango ? "text-amber-600" : "text-foreground"
                            )}>
                              {r.valor}{' '}
                              <span className="text-muted-foreground font-normal text-xs">{r.unidadMedida}</span>
                            </td>

                            <td className="py-2.5 pr-4 text-right text-muted-foreground text-xs">
                              {r.rangosReferencia?.length > 0
                                ? `${r.rangosReferencia[0].valorMinimo} – ${r.rangosReferencia[0].valorMaximo}`
                                : '—'}
                            </td>

                            <td className="py-2.5 text-right">
                              {r.esCritico ? (
                                <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                                  <AlertTriangle className="w-3 h-3" /> CRÍTICO
                                </span>
                              ) : r.fueraDeRango ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" /> Fuera rango
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" /> Normal
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
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Observaciones técnicas</p>
                      <ul className="text-sm text-foreground list-disc list-inside space-y-0.5">
                        {lab.resultados
                          .filter(r => r.observacionTecnica)
                          .map((r, i) => (
                            <li key={i} className="text-xs">{r.nombreAnalito}: {r.observacionTecnica}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  {['0', 'pendiente', '1', 'enproceso'].includes(String(lab.estado ?? '').toLowerCase().replace(/\s/g, ''))
                    ? 'Los resultados estarán disponibles cuando la orden sea procesada.'
                    : 'No se registraron resultados para esta orden.'}
                </div>
              )}

              {/* Footer metadata */}
              <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                {lab.resultados?.[0]?.bioquimicoResponsable && (
                  <p>Bioquímico: <span className="text-foreground font-medium">{lab.resultados[0].bioquimicoResponsable}</span></p>
                )}
                {lab.resultados?.[0]?.fechaCarga && (
                  <p>Fecha análisis: <span className="text-foreground font-medium">{formatDate(lab.resultados[0].fechaCarga)}</span></p>
                )}
                {lab.origen && (
                  <p>Origen: <span className="text-foreground font-medium">{lab.origen}</span></p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-border text-foreground hover:bg-muted"
                onClick={() => downloadLabPDF(lab, user ? `${user.nombre} ${user.apellido}`.trim() : (lab.pacienteNombre || 'Paciente'))}
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Descargar informe PDF
              </Button>
            </div>
          </div>
        )}
      </Card>
    )
  }

  const listToShow = subTab === 'ultimos' ? ultimos : historial

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        {/* Sub Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg max-w-xs w-full sm:w-auto">
          <button
            onClick={() => { setSubTab('ultimos'); setExpandedId(null); }}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
              subTab === 'ultimos' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Últimos resultados
          </button>
          <button
            onClick={() => { setSubTab('historial'); setExpandedId(null); }}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-center",
              subTab === 'historial' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Historial
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="border-border text-foreground hover:bg-muted text-xs w-full sm:w-auto"
          onClick={refreshLab}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="space-y-3">
        {listToShow.length === 0 ? (
          <Card className="border border-border shadow-none">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No hay resultados de laboratorio para mostrar.
            </CardContent>
          </Card>
        ) : (
          listToShow.map(renderLabCard)
        )}
      </div>
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
  const { user } = useAuth()
  const {
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
    refreshAll,
  } = useHealth()

  const loading = loadingRecipes || loadingAppointments || loadingLab

  useEffect(() => {
    if (user?.token) {
      refreshAll(true)
    }
  }, [user?.token])

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
      const isPastStatus = ['cancelado', 'cancelled', 'completed', 'completado', 'checked_in', 'checked_in_at'].includes(appt.status?.toLowerCase())
      if (isUpcoming(appt.date) && !isPastStatus) {
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
            <LabTab labResults={labResults} refreshLab={refreshLab} />
          )}
        </>
      )}
    </div>
  )
}

