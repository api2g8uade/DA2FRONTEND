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
    // Si viene de Módulo 2
    if (t.starts_at && t.medic) {
      const startsAt = new Date(t.starts_at)
      let status = 'pendiente'
      if (t.status === 'CONFIRMED') status = 'confirmado'
      else if (t.status === 'PENDING_CONFIRMATION') status = 'pendiente'
      else if (t.status === 'CANCELLED') status = 'cancelado'
      else if (t.status === 'COMPLETED') status = 'completado'
      else if (t.status) status = t.status.toLowerCase()

      return {
        id: String(t.id),
        doctor: t.medic.fullname || 'Médico Asignado',
        specialty: t.speciality?.name || 'Medicina General',
        date: t.starts_at.split(' ')[0],
        time: t.starts_at.split(' ')[1].substring(0, 5), // HH:mm
        location: t.medical_center?.name || 'Centro Médico',
        modality: t.modality === 'virtual' ? 'virtual' : 'presencial', // M2 currently doesn't specify virtual, default to presencial
        status: status,
      }
    }

    // Si viene de DB local (Appointment model)
    const dateObj = new Date(t.fecha)
    const yyyy = dateObj.getFullYear()
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
    const dd = String(dateObj.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    return {
      id: t._id || t.id,
      doctor: t.medico || 'Médico Asignado',
      specialty: t.especialidad || 'Especialidad',
      date: dateStr,
      time: t.hora || '00:00',
      location: t.lugar || 'Consultorio',
      modality: t.modalidad === 'virtual' ? 'virtual' : 'presencial',
      status: t.estado || 'confirmado',
    }
  })
}
