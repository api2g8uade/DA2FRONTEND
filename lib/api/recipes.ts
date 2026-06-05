// Como el backend obtiene pacienteId del token, solo necesito 1 función

import { apiCall } from './client'
import type { Recipe } from '../types/recipes'

export async function fetchRecipes(token: string): Promise<Recipe[]> {
  const data = await apiCall<any>('/api/mi-salud/recetas', {
    method: 'GET',
    token,
  })

  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.recetas)) return data.recetas
  return []
}