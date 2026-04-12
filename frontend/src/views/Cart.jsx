import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { usePosts } from '../contexts/PostsContext'

function formatPrice(value) {
  return Number(value || 0).toLocaleString('es-CL')
}

export function Cart() {
  const { items, totalItems, totalAmount, loading, updateQuantity, removeFromCart, checkout } = useCart()
  const { refreshPosts } = usePosts()
  const [busyPostId, setBusyPostId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleQuantityChange = async (postId, quantity) => {
    setBusyPostId(postId)
    setError('')
    setMessage('')

    try {
      await updateQuantity(postId, quantity)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyPostId(null)
    }
  }

  const handleRemove = async (postId) => {
    setBusyPostId(postId)
    setError('')
    setMessage('')

    try {
      await removeFromCart(postId)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyPostId(null)
    }
  }

  const handleCheckout = async () => {
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const result = await checkout()
      await refreshPosts()
      setMessage(result.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Mi carrito</h2>
          <span className="text-muted small">Productos: {totalItems}</span>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <p>Cargando carrito…</p>
        ) : items.length === 0 ? (
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <p className="mb-3">Tu carrito está vacío.</p>
              <Link to="/posts" className="btn btn-primary">
                Ir a publicaciones
              </Link>
            </div>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {items.map((item) => {
              const isBusy = busyPostId === item.postId

              return (
                <div className="card shadow-sm border-0" key={item.postId}>
                  <div className="card-body d-flex gap-3 flex-column flex-md-row align-items-md-center">
                    {item.mainImage ? (
                      <img
                        src={item.mainImage}
                        alt={item.title}
                        className="rounded"
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="bg-light rounded d-flex align-items-center justify-content-center text-muted"
                        style={{ width: '120px', height: '120px' }}
                      >
                        Sin imagen
                      </div>
                    )}

                    <div className="flex-grow-1">
                      <h5 className="mb-1">{item.title}</h5>
                      <p className="small text-muted mb-2">Stock disponible: {item.stock}</p>
                      <p className="mb-0 fw-semibold">${formatPrice(item.price)}</p>
                    </div>

                    <div className="d-flex flex-column align-items-start align-items-md-end gap-2">
                      <div className="btn-group" role="group" aria-label={`Cantidad ${item.title}`}>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={isBusy || item.quantity <= 1}
                          onClick={() => handleQuantityChange(item.postId, item.quantity - 1)}
                        >
                          -
                        </button>
                        <button type="button" className="btn btn-light" disabled>
                          {item.quantity}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={isBusy || item.quantity >= item.stock}
                          onClick={() => handleQuantityChange(item.postId, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <p className="mb-0 small">Subtotal: ${formatPrice(item.lineTotal)}</p>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        disabled={isBusy}
                        onClick={() => handleRemove(item.postId)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="col-lg-4">
        <div className="card shadow-sm border-0 sticky-top" style={{ top: '1rem' }}>
          <div className="card-body">
            <h4>Resumen</h4>
            <div className="d-flex justify-content-between mb-2">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span>Total</span>
              <strong>${formatPrice(totalAmount)}</strong>
            </div>
            <button
              type="button"
              className="btn btn-success w-100 mb-2"
              disabled={items.length === 0 || submitting}
              onClick={handleCheckout}
            >
              {submitting ? 'Procesando…' : 'Simular compra'}
            </button>
            <Link to="/" className="btn btn-outline-secondary w-100">
              Volver al menú principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
