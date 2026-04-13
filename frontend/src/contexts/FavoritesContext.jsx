import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { addFavorite, fetchFavorites, removeFavorite } from '../services/postsService'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext()

function normalizeFavoritePost(post) {
  if (!post) {
    return null
  }

  const id = post.postId ?? post.id

  if (id == null) {
    return null
  }

  return {
    id,
    title: post.title,
    description: post.description,
    price: post.price,
    status: post.status,
    stock: post.stock,
    category: post.category,
    location: post.location,
    mainImage: post.mainImage || post.imageUrl || null,
    user: post.user,
    isFavorite: true,
  }
}

export function FavoritesProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState([])
  const [favoritePosts, setFavoritePosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [pendingIds, setPendingIds] = useState([])

  useEffect(() => {
    let cancelled = false

    if (!isAuthenticated || !token) {
      setFavoriteIds([])
      setFavoritePosts([])
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
        const normalizedFavorites = favorites.map(normalizeFavoritePost).filter(Boolean)

        if (!cancelled) {
          setFavoriteIds(normalizedFavorites.map((favorite) => String(favorite.id)))
          setFavoritePosts(normalizedFavorites)
          setLoaded(true)
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          setFavoriteIds([])
          setFavoritePosts([])
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

  const toggleFavorite = async (post) => {
    const normalizedPost = typeof post === 'object' && post !== null ? normalizeFavoritePost(post) : null
    const postId = normalizedPost?.id ?? post
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
        setFavoritePosts((prev) => prev.filter((favoritePost) => String(favoritePost.id) !== normalizedId))
        return false
      }

      await addFavorite(postId, token)
      setFavoriteIds((prev) => (prev.includes(normalizedId) ? prev : [...prev, normalizedId]))
      setFavoritePosts((prev) => {
        if (!normalizedPost || prev.some((favoritePost) => String(favoritePost.id) === normalizedId)) {
          return prev
        }

        return [normalizedPost, ...prev]
      })
      return true
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== normalizedId))
    }
  }

  const value = useMemo(
    () => ({
      favoriteIds,
      favoritePosts,
      loading,
      loaded,
      isFavorite,
      isPending,
      toggleFavorite,
    }),
    [favoriteIds, favoritePosts, loading, loaded, pendingIds],
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
