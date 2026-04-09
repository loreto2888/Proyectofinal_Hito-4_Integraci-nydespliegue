import { Link } from 'react-router-dom'

export function PostCard({ post }) {
  return (
    <div className="card h-100 shadow-sm">
      {post.imageUrl && (
        <img src={post.imageUrl} className="card-img-top" alt={post.title} />
      )}
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{post.title}</h5>
        <p className="card-text small text-muted mb-2">{post.description}</p>
        <p className="fw-semibold mb-1">Precio: ${post.price?.toLocaleString?.('es-CL') ?? post.price}</p>
        <p className="small text-muted mb-2">Publicado por: {post.author}</p>
        <div className="mt-auto d-flex justify-content-between align-items-center">
          <Link to={`/posts/${post.id}`} className="btn btn-sm btn-outline-primary">
            Ver detalle
          </Link>
          <button className="btn btn-sm btn-outline-danger" type="button">
            {post.liked ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  )
}
