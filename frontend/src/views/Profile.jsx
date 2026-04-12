import { useAuth } from '../contexts/AuthContext'
import { usePosts } from '../contexts/PostsContext'
import { PostCard } from '../components/common/PostCard'

export function Profile() {
  const { user } = useAuth()
  const { posts } = usePosts()

  const myPosts = posts.filter((p) => String(p.user?.id) === String(user?.id))

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
      <div className="col-md-9">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4>Mis publicaciones</h4>
        </div>
        {myPosts.length === 0 ? (
          <p className="text-muted">Aún no has creado publicaciones.</p>
        ) : (
          <div className="row g-3">
            {myPosts.map((post) => (
              <div className="col-md-4" key={post.id}>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
