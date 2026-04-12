import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../contexts/PostsContext'

export function NewPost() {
  const { user, token } = useAuth()
  const { addPost } = usePosts()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addPost(
        {
          title,
          description,
          price: Number(price),
          stock: Number(stock),
          imageUrl,
          status: 'published',
          category: 'general',
          location: 'online',
          images: imageUrl ? [imageUrl] : [],
          author: user?.name || 'Yo',
        },
        token,
        user,
      )
      navigate('/posts')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-light">
            <h5 className="mb-0">Crear nueva publicación</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Título</label>
                  <input
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Precio</label>
                  <input
                    type="number"
                    className="form-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    min="1"
                    step="1"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Imagen URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Publicando…' : 'Publicar'}
                </button>
                <Link to="/" className="btn btn-outline-secondary">
                  Volver al menú principal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
