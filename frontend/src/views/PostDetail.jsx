import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePosts } from '../contexts/PostsContext'
import { fetchPostById } from '../services/postsService'

export function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getPostById } = usePosts()

  const [post, setPost] = useState(() => getPostById(id))
  const [loading, setLoading] = useState(!getPostById(id))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (post) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const remote = await fetchPostById(id)
        setPost(remote)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, post])

  if (loading) {
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

  return (
    <div className="row g-4">
      <div className="col-md-6">
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="img-fluid rounded-3 shadow-sm" />
        )}
      </div>
      <div className="col-md-6">
        <h2 className="mb-3">{post.title}</h2>
        <p className="lead">{post.description}</p>
        <p className="fw-bold fs-5">Precio: ${post.price?.toLocaleString?.('es-CL') ?? post.price}</p>
        <p className="text-muted">Publicado por: {post.author}</p>
        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-success">Contactar vendedor</button>
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}
