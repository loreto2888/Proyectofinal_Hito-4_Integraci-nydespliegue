import { usePosts } from '../contexts/PostsContext'
import { PostCard } from '../components/common/PostCard'

export function Gallery() {
  const { posts, loading } = usePosts()

  return (
    <div className="row">
      <aside className="col-md-3 mb-3 mb-md-0">
        <div className="bg-warning h-100 p-3 rounded-3">
          <h6 className="mb-3">Ordenar por</h6>
          <select className="form-select">
            <option>Precio mayor a menor</option>
            <option>Precio menor a mayor</option>
            <option>Más recientes</option>
          </select>
        </div>
      </aside>
      <section className="col-md-9">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Publicaciones</h4>
          <span className="text-muted small">Total: {posts.length}</span>
        </div>
        {loading ? (
          <p>Cargando publicaciones…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted">No hay publicaciones todavía.</p>
        ) : (
          <div className="row g-3">
            {posts.map((post) => (
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
