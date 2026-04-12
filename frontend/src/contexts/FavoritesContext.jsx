import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addFavorite, fetchFavorites, removeFavorite } from '../services/postsService'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext()

export function FavoritesProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [pendingIds, setPendingIds] = useState([])

  useEffect(() => {
    let cancelled = false

    if (!isAuthenticated || !token) {
      setFavoriteIds([])
      setPendingIds([])
      setLoading(false)
      setLoaded(false)
      return () => {
        cancelled = true
      }
    }

    const loadFavorites = async () => {
      setLoading(true)

      try {
        const favorites = await fetchFavorites(token)

        if (!cancelled) {
          setFavoriteIds(favorites.map((favorite) => String(favorite.postId)))
          setLoaded(true)
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          setFavoriteIds([])
          setLoaded(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFavorites()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, token])

  const isFavorite = (postId) => favoriteIds.includes(String(postId))
  const isPending = (postId) => pendingIds.includes(String(postId))

  const toggleFavorite = async (postId) => {
    const normalizedId = String(postId)

    if (!token) {
      throw new Error('Debes iniciar sesión para guardar favoritos')
    }

    if (pendingIds.includes(normalizedId)) {
      return isFavorite(normalizedId)
    }

    setPendingIds((prev) => [...prev, normalizedId])

    try {
      if (favoriteIds.includes(normalizedId)) {
        await removeFavorite(postId, token)
        setFavoriteIds((prev) => prev.filter((id) => id !== normalizedId))
        return false
      }

      await addFavorite(postId, token)
      setFavoriteIds((prev) => (prev.includes(normalizedId) ? prev : [...prev, normalizedId]))
      return true
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== normalizedId))
    }
  }

  const value = useMemo(
    () => ({
      favoriteIds,
      loading,
      loaded,
      isFavorite,
      isPending,
      toggleFavorite,
    }),
    [favoriteIds, loading, loaded, pendingIds],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)

  if (!ctx) {
    throw new Error('useFavorites debe usarse dentro de FavoritesProvider')
  }

  return ctx
}
