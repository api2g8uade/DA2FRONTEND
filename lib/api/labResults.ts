import { apiCall } from './client'

export type LabResultItem = {
  parametro: string
  valor: string
  unidad: string
  rangoReferencia: string
  fueraDeRango: boolean
}

export type LabResult = {
  _id: string
  pacienteId: string
  estudio: string
  fechaRealizacion: string
  resultados: LabResultItem[]
  observaciones?: string
  estado: string
}

export async function fetchLabResults(token: string): Promise<LabResult[]> {
  return apiCall<LabResult[]>('/api/mi-salud/laboratorio', {
    method: 'GET',
    token,
  })
}