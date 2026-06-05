export interface AlertaFarmacologica {
  tipo: string
  descripcion: string
}

export type Recipe = {
  _id?: string
  id_receta?: number
  id_paciente?: number
  id_evolucion?: number
  medicamento: string
  indicaciones: string
  estado: string
  alertas_farmacologicas?: AlertaFarmacologica[]
  createdAt?: string
  updatedAt?: string
  
  // Legacy properties for local compatibility
  medicoId?: string
  dosis?: string
  fechaEmision?: string
}

export type Medication = {
  name: string
  dose: string
  instructions: string
  quantity: string
}