import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../contexts/PostsContext'
import { PostCard } from '../components/common/PostCard'
import { fetchMyPosts } from '../services/postsService'

export function Profile() {
  const { user, token } = useAuth()
  const { deletePost } = usePosts()
  const [myPosts, setMyPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadMyPosts = async () => {
      setLoadingPosts(true)

      try {
        const data = await fetchMyPosts(token)
        if (!cancelled) {
          setMyPosts(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoadingPosts(false)
        }
      }
    }

    loadMyPosts()

    return () => {
      cancelled = true
    }
  }, [token])

  const handleDelete = async (post) => {
    const confirmed = window.confirm(`¿Seguro que quieres eliminar la publicación "${post.title}"?`)

    if (!confirmed) {
      return
    }

    setDeletingId(post.id)
    setMessage('')
    setError('')

    try {
      await deletePost(post.id, token)
      setMyPosts((prev) => prev.filter((currentPost) => String(currentPost.id) !== String(post.id)))
      setMessage('Publicación eliminada correctamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="row">
      <div className="col-md-3">
        <div className="bg-warning h-100 p-3 rounded-3 d-flex flex-column justify-content-between">
          <div>
            <h5 className="mb-3">Mi Perfil</h5>
            {user?.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="rounded-circle mb-3"
                width="72"
                height="72"
              />
            )}
            <p className="mb-1 fw-semibold">{user?.name}</p>
            <p className="small mb-1">{user?.email}</p>
          </div>
          <div>
            <p className="small mb-1">Publicaciones creadas: {myPosts.length}</p>
          </div>
        </div>
      </div>
      <div className="col-md-9" id="mis-publicaciones">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Mis publicaciones</h4>
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            Volver al menú principal
          </Link>
        </div>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        {loadingPosts ? (
          <p className="text-muted">Cargando tus publicaciones…</p>
        ) : myPosts.length === 0 ? (
          <p className="text-muted">Aún no has creado publicaciones.</p>
        ) : (
          <div className="row g-3">
            {myPosts.map((post) => (
              <div className="col-md-4" key={post.id}>
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
  )
}
