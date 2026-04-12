import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../contexts/PostsContext'
import { fetchPostById } from '../services/postsService'

const STATUS_OPTIONS = [
  { value: 'published', label: 'Publicado' },
  { value: 'draft', label: 'Borrador' },
  { value: 'sold', label: 'Vendido' },
]

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'ropa', label: 'Ropa' },
  { value: 'deportes', label: 'Deportes' },
  { value: 'otros', label: 'Otros' },
]

const LOCATION_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'envio', label: 'Envío' },
]

export function NewPost() {
  const { user, token } = useAuth()
  const { addPost, updatePost } = usePosts()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('1')
  const [status, setStatus] = useState('published')
  const [category, setCategory] = useState('general')
  const [location, setLocation] = useState('online')
  const [imageUrl, setImageUrl] = useState('')
  const [loadingPost, setLoadingPost] = useState(isEditMode)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEditMode) {
      setLoadingPost(false)
      return
    }

    let cancelled = false

    const loadPost = async () => {
      setLoadingPost(true)
      setError('')

      try {
        const post = await fetchPostById(id, token)

        if (cancelled) return

        if (String(post.user?.id) !== String(user?.id)) {
          setError('No tienes permisos para editar esta publicación.')
          return
        }

        setTitle(post.title || '')
        setDescription(post.description || '')
        setPrice(String(post.price ?? ''))
        setStock(String(post.stock ?? '1'))
        setStatus(post.status || 'published')
        setCategory(post.category || 'general')
        setLocation(post.location || 'online')
        setImageUrl(post.images?.[0]?.url || post.mainImage || '')
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoadingPost(false)
        }
      }
    }

    loadPost()

    return () => {
      cancelled = true
    }
  }, [id, isEditMode, token, user?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isEditMode) {
        await updatePost(
          id,
          {
            title,
            description,
            price: Number(price),
            stock: Number(stock),
            status,
            category,
            location,
          },
          token,
        )

        navigate(`/posts/${id}`, {
          replace: true,
          state: { message: 'Publicación actualizada correctamente' },
        })
        return
      }

      await addPost(
        {
          title,
          description,
          price: Number(price),
          stock: Number(stock),
          imageUrl,
          status,
          category,
          location,
          images: imageUrl ? [imageUrl] : [],
          author: user?.name || 'Yo',
        },
        token,
        user,
      )
      navigate('/posts')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingPost) {
    return <p>Cargando publicación…</p>
  }

  if (error && isEditMode && !title && !description && !price) {
    return (
      <div>
        <p>{error}</p>
        <Link to="/profile" className="btn btn-outline-secondary">
          Volver al perfil
        </Link>
      </div>
    )
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-light">
            <h5 className="mb-0">{isEditMode ? 'Editar publicación' : 'Crear nueva publicación'}</h5>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Artículo</label>
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
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} required>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Categoría</label>
                  <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Modalidad</label>
                  <select className="form-select" value={location} onChange={(e) => setLocation(e.target.value)} required>
                    {LOCATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                {!isEditMode && (
                  <div className="col-12">
                    <label className="form-label">Imagen URL</label>
                    <input
                      type="url"
                      className="form-control"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting
                    ? isEditMode
                      ? 'Guardando…'
                      : 'Publicando…'
                    : isEditMode
                      ? 'Guardar cambios'
                      : 'Publicar'}
                </button>
                <Link to={isEditMode ? `/posts/${id}` : '/'} className="btn btn-outline-secondary">
                  {isEditMode ? 'Volver al detalle' : 'Volver al menú principal'}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
