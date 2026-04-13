import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../contexts/PostsContext'
import { PostCard } from '../components/common/PostCard'
import { fetchPostById } from '../services/postsService'
import { isValidUrl } from '../utils/validation'

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
  const { posts, addPost, updatePost, deletePost } = usePosts()
  const routeLocation = useLocation()
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
  const [fieldErrors, setFieldErrors] = useState({})
  const [didValidate, setDidValidate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [managementMessage, setManagementMessage] = useState('')
  const [managementError, setManagementError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const myPosts = posts.filter((post) => String(post.user?.id) === String(user?.id))

  const validateForm = () => {
    const nextErrors = {}

    if (!title.trim()) {
      nextErrors.title = 'El artículo es obligatorio'
    } else if (title.trim().length < 3) {
      nextErrors.title = 'El artículo debe tener al menos 3 caracteres'
    }

    if (!price && price !== 0) {
      nextErrors.price = 'El precio es obligatorio'
    } else if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      nextErrors.price = 'El precio debe ser un número válido mayor o igual a 0'
    }

    if (!stock && stock !== 0) {
      nextErrors.stock = 'El stock es obligatorio'
    } else if (!Number.isInteger(Number(stock)) || Number(stock) < 1) {
      nextErrors.stock = 'El stock debe ser un entero mayor o igual a 1'
    }

    if (!status) {
      nextErrors.status = 'El estado es obligatorio'
    }

    if (!category) {
      nextErrors.category = 'La categoría es obligatoria'
    }

    if (!location) {
      nextErrors.location = 'La modalidad es obligatoria'
    }

    if (!description.trim()) {
      nextErrors.description = 'La descripción es obligatoria'
    } else if (description.trim().length < 10) {
      nextErrors.description = 'La descripción debe tener al menos 10 caracteres'
    }

    if (imageUrl.trim() && !isValidUrl(imageUrl.trim())) {
      nextErrors.imageUrl = 'Ingresa una URL válida para la imagen'
    }

    return nextErrors
  }

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

  useEffect(() => {
    if (didValidate) {
      setFieldErrors(validateForm())
    }
  }, [category, description, didValidate, imageUrl, isEditMode, location, price, status, stock, title])

  useEffect(() => {
    if (!routeLocation.state?.message) {
      return
    }

    setManagementMessage(routeLocation.state.message)
    navigate(routeLocation.pathname, { replace: true, state: null })
  }, [navigate, routeLocation.pathname, routeLocation.state])

  const handleDelete = async (post) => {
    const confirmed = window.confirm(`¿Seguro que quieres eliminar la publicación "${post.title}"?`)

    if (!confirmed) {
      return
    }

    setDeletingId(post.id)
    setManagementMessage('')
    setManagementError('')

    try {
      await deletePost(post.id, token)

      if (String(post.id) === String(id)) {
        navigate('/posts/new', {
          replace: true,
          state: { message: 'Publicación eliminada correctamente.' },
        })
        return
      }

      setManagementMessage('Publicación eliminada correctamente.')
    } catch (err) {
      setManagementError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setDidValidate(true)
    setError('')

    const validationErrors = validateForm()
    setFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)

    const normalizedTitle = title.trim()
    const normalizedDescription = description.trim()
    const normalizedImageUrl = imageUrl.trim()
    const numericPrice = Number(price)
    const numericStock = Number(stock)

    try {
      if (isEditMode) {
        await updatePost(
          id,
          {
            title: normalizedTitle,
            description: normalizedDescription,
            price: numericPrice,
            stock: numericStock,
            images: normalizedImageUrl ? [normalizedImageUrl] : [],
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
          title: normalizedTitle,
          description: normalizedDescription,
          price: numericPrice,
          stock: numericStock,
          imageUrl: normalizedImageUrl,
          status,
          category,
          location,
          images: normalizedImageUrl ? [normalizedImageUrl] : [],
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
            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Artículo</label>
                  <input
                    className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  {fieldErrors.title && <div className="invalid-feedback">{fieldErrors.title}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Precio</label>
                  <input
                    type="number"
                    className={`form-control ${fieldErrors.price ? 'is-invalid' : ''}`}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                  />
                  {fieldErrors.price && <div className="invalid-feedback">{fieldErrors.price}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Stock</label>
                  <input
                    type="number"
                    className={`form-control ${fieldErrors.stock ? 'is-invalid' : ''}`}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    min="1"
                    step="1"
                  />
                  {fieldErrors.stock && <div className="invalid-feedback">{fieldErrors.stock}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <select
                    className={`form-select ${fieldErrors.status ? 'is-invalid' : ''}`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.status && <div className="invalid-feedback">{fieldErrors.status}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Categoría</label>
                  <select
                    className={`form-select ${fieldErrors.category ? 'is-invalid' : ''}`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && <div className="invalid-feedback">{fieldErrors.category}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Modalidad</label>
                  <select
                    className={`form-select ${fieldErrors.location ? 'is-invalid' : ''}`}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  >
                    {LOCATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.location && <div className="invalid-feedback">{fieldErrors.location}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  {fieldErrors.description && <div className="invalid-feedback">{fieldErrors.description}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label">Imagen URL</label>
                  <input
                    type="url"
                    className={`form-control ${fieldErrors.imageUrl ? 'is-invalid' : ''}`}
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {fieldErrors.imageUrl && <div className="invalid-feedback">{fieldErrors.imageUrl}</div>}
                  {isEditMode && <div className="form-text">Deja el campo vacío si quieres eliminar la imagen actual.</div>}
                </div>
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
                  {isEditMode ? 'Volver al detalle' : 'Volver a la página principal'}
                </Link>
              </div>
            </form>

            <div className="border-top mt-4 pt-4">
              <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap">
                <div>
                  <h6 className="mb-1">Mis publicaciones</h6>
                  <p className="text-muted mb-0">Desde esta misma sección también puedes editar o eliminar tus avisos.</p>
                </div>
                <Link to="/" className="btn btn-outline-secondary btn-sm">
                  Volver a la página principal
                </Link>
              </div>

              {managementMessage && <div className="alert alert-success">{managementMessage}</div>}
              {managementError && <div className="alert alert-danger">{managementError}</div>}

              {myPosts.length === 0 ? (
                <p className="text-muted mb-0">Aún no has creado publicaciones.</p>
              ) : (
                <div className="row g-3">
                  {myPosts.map((post) => (
                    <div className="col-md-6" key={post.id}>
                      <PostCard post={post} />
                      <div className="mt-2 d-grid gap-2">
                        <Link to={`/posts/${post.id}/edit`} className="btn btn-sm btn-outline-warning">
                          Editar publicación
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post)}
                        >
                          {deletingId === post.id ? 'Eliminando…' : 'Eliminar publicación'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
