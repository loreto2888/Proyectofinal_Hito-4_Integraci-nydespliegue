import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

export function PostCard({ post }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const imageUrl = post.mainImage || post.imageUrl
  const sellerName = post.user?.name || post.author || 'Sin vendedor'
  const stock = Number(post.stock ?? 0)
  const price = Number(post.price || 0)

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      await addToCart(post.id, 1)
      setMessage('Agregado al carrito')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card h-100 shadow-sm">
      {imageUrl && (
        <img src={imageUrl} className="card-img-top" alt={post.title} />
      )}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{post.title}</h5>
        <p className="card-text small text-muted mb-2">{post.description}</p>
        <p className="fw-semibold mb-1">Precio: ${price.toLocaleString('es-CL')}</p>
        <p className="small text-muted mb-1">Publicado por: {sellerName}</p>
        <p className="small text-muted mb-3">Stock disponible: {stock}</p>
        {message && <p className="small text-success mb-2">{message}</p>}
        {error && <p className="small text-danger mb-2">{error}</p>}
        <div className="mt-auto d-flex flex-wrap gap-2 align-items-center">
          <Link to={`/posts/${post.id}`} className="btn btn-sm btn-outline-primary">
            Ver detalle
          </Link>
          <button
            className="btn btn-sm btn-success"
            type="button"
            disabled={submitting || stock < 1}
            onClick={handleAddToCart}
          >
            {submitting ? 'Agregando…' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}
