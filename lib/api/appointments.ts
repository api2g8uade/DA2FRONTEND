import { apiCall } from './client'

export interface UpcomingAppointment {
  id: string
  doctor: string
  specialty: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  location: string
  modality: 'presencial' | 'virtual'
  status: string
  ends_at?: string
  isHighComplexity?: boolean
  linkVideollamada?: string
}

export async function fetchAppointments(token: string): Promise<UpcomingAppointment[]> {
  const data = await apiCall<any>('/api/mi-salud/turnos', { token })

  let rawTurnos: any[] = []
  if (Array.isArray(data)) {
    rawTurnos = data
  } else if (data && Array.isArray(data.turnos)) {
    rawTurnos = data.turnos
  }

  return rawTurnos.map((t: any) => {
    let status = 'pendiente'
    if (t.status === 'CONFIRMED' || t.status === 'confirmado') status = 'confirmado'
    else if (t.status === 'PENDING_CONFIRMATION' || t.status === 'pendiente') status = 'pendiente'
    else if (t.status === 'CANCELLED' || t.status === 'cancelado') status = 'cancelado'
    else if (t.status === 'COMPLETED' || t.status === 'completado') status = 'completado'
    else if (t.status) status = t.status.toLowerCase()

    const isHighComplexity = t.speciality?.is_high_complexity === 1 || t.speciality?.is_high_complexity === true;
    
    let modality: 'presencial' | 'virtual' = 'presencial';
    if (!isHighComplexity && (t.modality === 'virtual' || t.medical_center?.name === 'Sala Virtual' || !!t.linkVideollamada)) {
      modality = 'virtual';
    }

    return {
      id: String(t.id || t._id),
      doctor: t.medic?.fullname || 'Médico Asignado',
      specialty: t.speciality?.name || 'Medicina General',
      date: t.starts_at ? t.starts_at.split(' ')[0] : '',
      time: t.starts_at && t.starts_at.split(' ').length > 1 ? t.starts_at.split(' ')[1].substring(0, 5) : '00:00', // HH:mm
      location: t.medical_center?.name || 'Centro Médico',
      modality: modality,
      status: status,
      ends_at: t.ends_at,
      isHighComplexity,
      linkVideollamada: t.linkVideollamada,
    }
  })
}
