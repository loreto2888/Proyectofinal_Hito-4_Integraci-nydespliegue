import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../contexts/PostsContext'
import { PostCard } from '../components/common/PostCard'

export function Gallery() {
  const { posts, loading } = usePosts()
  const [sortBy, setSortBy] = useState('recent')
  const publishedPosts = posts.filter((post) => post.status === 'published')

  const sortedPosts = [...publishedPosts].sort((a, b) => {
    if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0)
    if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0)
    return 0
  })

  return (
    <div className="row">
      <aside className="col-md-3 mb-3 mb-md-0">
        <div className="bg-warning h-100 p-3 rounded-3">
          <h6 className="mb-3">Ordenar por</h6>
          <select className="form-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="price-desc">Precio mayor a menor</option>
            <option value="price-asc">Precio menor a mayor</option>
            <option value="recent">Más recientes</option>
          </select>
        </div>
      </aside>
      <section className="col-md-9">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
          <h4>Publicaciones</h4>
          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            <span className="text-muted small">Total: {publishedPosts.length}</span>
            <Link to="/" className="btn btn-outline-secondary btn-sm">
              Volver al menú principal
            </Link>
          </div>
        </div>
        {loading ? (
          <p>Cargando publicaciones…</p>
        ) : sortedPosts.length === 0 ? (
          <p className="text-muted">No hay publicaciones todavía.</p>
        ) : (
          <div className="row g-3">
            {sortedPosts.map((post) => (
              <div className="col-md-4" key={post.id}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
