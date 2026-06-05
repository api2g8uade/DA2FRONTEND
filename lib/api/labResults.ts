import { apiCall } from './client'

export type RangoReferencia = {
  valorMinimo: number
  valorMaximo: number
  sexo: string
}

export type LabResultItem = {
  id: number
  analitoId: number
  nombreAnalito: string
  codigoAnalito: string
  valor: number
  unidadMedida: string
  observacionTecnica?: string
  bioquimicoResponsable?: string
  fechaCarga: string
  fueraDeRango: boolean
  esCritico: boolean
  rangosReferencia: RangoReferencia[]
}

export type EstudioSolicitado = {
  id: number
  nombre: string
  descripcion: string
}

export type LabResult = {
  _id: string
  id: number
  pacienteId: number
  pacienteNombre: string
  pacienteDni: string
  pacienteEdad: number
  pacienteSexo: string
  medicoId: number
  fechaSolicitud: string
  estado: string
  prioridad: string
  origen: string
  estudiosSolicitados: EstudioSolicitado[]
  resultados: LabResultItem[]
}

export async function fetchLabResults(token: string): Promise<LabResult[]> {
  const data = await apiCall<any>('/api/mi-salud/laboratorio', {
    method: 'GET',
    token,
  })
  
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.laboratorio)) return data.laboratorio
  return []
}