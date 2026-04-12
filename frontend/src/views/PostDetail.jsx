import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { usePosts } from '../contexts/PostsContext'
import { fetchPostById } from '../services/postsService'

export function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, isAuthenticated } = useAuth()
  const { getPostById } = usePosts()
  const { addToCart } = useCart()
  const summaryPost = getPostById(id)

  const [post, setPost] = useState(summaryPost)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const remote = await fetchPostById(id, token)
        if (!cancelled) {
          setPost(remote)
          setQuantity(1)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id, token])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    setCartMessage('')
    setCartError('')

    try {
      await addToCart(post.id, safeQuantity)
      setCartMessage('Producto agregado al carrito')
    } catch (err) {
      setCartError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !post) {
    return <p>Cargando publicación…</p>
  }

  if (error || !post) {
    return (
      <div>
        <p>{error || 'No se encontró la publicación.'}</p>
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    )
  }

  const imageUrl = post.images?.[0]?.url || post.mainImage
  const sellerName = post.user?.name || post.author || 'Sin vendedor'
  const stock = Number(post.stock ?? 0)
  const safeQuantity = Math.min(Math.max(quantity, 1), Math.max(stock, 1))

  return (
    <div className="row g-4">
      <div className="col-md-6">
        {imageUrl && (
          <img src={imageUrl} alt={post.title} className="img-fluid rounded-3 shadow-sm" />
        )}
      </div>
      <div className="col-md-6">
        <h2 className="mb-3">{post.title}</h2>
        <p className="lead">{post.description}</p>
        <p className="fw-bold fs-5">Precio: ${Number(post.price || 0).toLocaleString('es-CL')}</p>
        <p className="text-muted mb-1">Publicado por: {sellerName}</p>
        <p className="text-muted mb-3">Stock disponible: {stock}</p>
        {cartMessage && <div className="alert alert-success py-2">{cartMessage}</div>}
        {cartError && <div className="alert alert-danger py-2">{cartError}</div>}
        <div className="mt-3 d-flex gap-2">
          <input
            type="number"
            className="form-control"
            style={{ maxWidth: '120px' }}
            value={safeQuantity}
            min="1"
            max={Math.max(stock, 1)}
            disabled={stock < 1 || submitting}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
          <button className="btn btn-success" disabled={stock < 1 || submitting} onClick={handleAddToCart}>
            {submitting ? 'Agregando…' : 'Agregar al carrito'}
          </button>
          <button className="btn btn-outline-primary" onClick={() => navigate('/cart')}>
            Ver carrito
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}
