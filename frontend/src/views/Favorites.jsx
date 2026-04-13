import { Link } from 'react-router-dom'
import { PostCard } from '../components/common/PostCard'
import { useFavorites } from '../contexts/FavoritesContext'

export function Favorites() {
  const { favoritePosts, loading, loaded } = useFavorites()

  return (
    <div className="row">
      <aside className="col-md-3 mb-3 mb-md-0">
        <div className="bg-warning h-100 p-3 rounded-3">
          <h5 className="mb-2">Favoritos</h5>
          <p className="small text-muted mb-0">
            Revisa las publicaciones que guardaste para compararlas o volver a comprarlas más tarde.
          </p>
        </div>
      </aside>
      <section className="col-md-9">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
          <h4 className="mb-0">Mis favoritos</h4>
          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            <span className="text-muted small">Total: {favoritePosts.length}</span>
            <Link to="/" className="btn btn-outline-secondary btn-sm">
              Volver al menú principal
            </Link>
          </div>
        </div>
        {loading && !loaded ? (
          <p>Cargando favoritos…</p>
        ) : favoritePosts.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No has guardado publicaciones en favoritos todavía.
          </div>
        ) : (
          <div className="row g-3">
            {favoritePosts.map((post) => (
              <div className="col-md-6 col-xl-4" key={post.id}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
