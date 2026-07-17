import { useHealth } from '../src/context/HealthContext'
import { useEffect } from 'react'

export function useRecipes() {
  const { recipes, loadingRecipes, recipesError, refreshRecipes } = useHealth()

  useEffect(() => {
    refreshRecipes()
  }, [refreshRecipes])

  return { recipes, loading: loadingRecipes, error: recipesError, refresh: refreshRecipes }
}