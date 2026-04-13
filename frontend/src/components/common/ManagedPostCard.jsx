function formatPrice(value) {
  const price = Number(value || 0)
  return `$${price.toLocaleString('es-CL')}`
}

const STATUS_LABELS = {
  published: 'Publicado',
  draft: 'Borrador',
  sold: 'Vendido',
}

const CATEGORY_LABELS = {
  general: 'General',
  tecnologia: 'Tecnología',
  hogar: 'Hogar',
  ropa: 'Ropa',
  deportes: 'Deportes',
  otros: 'Otros',
}

const LOCATION_LABELS = {
  online: 'Online',
  presencial: 'Presencial',
  envio: 'Envío',
}

function getLabel(value, labels) {
  return labels[value] || value || 'Sin definir'
}

export function ManagedPostCard({ post }) {
  const imageUrl = post.mainImage || post.imageUrl
  const sellerName = post.user?.name || post.author || 'Sin vendedor'

  return (
    <div className="card h-100 shadow-sm">
      {imageUrl && <img src={imageUrl} className="card-img-top" alt={post.title} />}
      <div className="card-body d-flex flex-column gap-3">
        <div>
          <div className="d-flex justify-content-between align-items-start gap-2 mb-2 flex-wrap">
            <h5 className="card-title mb-0">{post.title}</h5>
            <span className="badge text-bg-secondary">{getLabel(post.status, STATUS_LABELS)}</span>
          </div>
          <p className="card-text text-muted mb-0">{post.description}</p>
        </div>

        <dl className="row small mb-0">
          <dt className="col-5 mb-2">Precio</dt>
          <dd className="col-7 mb-2 fw-semibold">{formatPrice(post.price)}</dd>

          <dt className="col-5 mb-2">Stock</dt>
          <dd className="col-7 mb-2">{post.stock}</dd>

          <dt className="col-5 mb-2">Categoría</dt>
          <dd className="col-7 mb-2">{getLabel(post.category, CATEGORY_LABELS)}</dd>

          <dt className="col-5 mb-2">Modalidad</dt>
          <dd className="col-7 mb-2">{getLabel(post.location, LOCATION_LABELS)}</dd>

          <dt className="col-5 mb-0">Publicado por</dt>
          <dd className="col-7 mb-0">{sellerName}</dd>
        </dl>
      </div>
    </div>
  )
}
