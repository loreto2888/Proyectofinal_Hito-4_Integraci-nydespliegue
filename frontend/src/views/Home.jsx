import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, loading } = useAuth()
  const message = location.state?.message || ''

  const authenticatedActions = [
    {
      to: '/posts/new',
      title: 'Crear publicación',
      description: 'Publica un nuevo producto y súmalo a tu vitrina.',
      buttonClassName: 'btn btn-warning',
      buttonLabel: 'Publicar ahora',
    },
    {
      to: '/posts',
      title: 'Ver publicaciones',
      description: 'Explora el catálogo disponible y revisa nuevas ofertas.',
      buttonClassName: 'btn btn-dark',
      buttonLabel: 'Ir a publicaciones',
    },
    {
      to: '/cart',
      title: 'Carrito',
      description: 'Consulta tus productos agregados antes de confirmar la compra.',
      buttonClassName: 'btn btn-success',
      buttonLabel: 'Abrir carrito',
    },
    {
      to: '/profile',
      title: 'Mi perfil',
      description: 'Revisa tu cuenta, tu avatar y el resumen de tu actividad.',
      buttonClassName: 'btn btn-outline-dark',
      buttonLabel: 'Ver perfil',
    },
    {
      to: '/profile#mis-publicaciones',
      title: 'Gestionar mis publicaciones',
      description: 'Accede directo a la sección donde puedes editar o eliminar tus avisos.',
      buttonClassName: 'btn btn-outline-warning',
      buttonLabel: 'Gestionar ahora',
    },
  ]

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  if (loading) {
    return <p className="text-muted mb-0">Cargando inicio...</p>
  }

  if (isAuthenticated) {
    return (
      <section className="row g-4 align-items-start">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body bg-warning-subtle rounded">
              {message && <div className="alert alert-success">{message}</div>}
              <p className="text-uppercase small fw-semibold text-secondary mb-2">Menú principal</p>
              <h1 className="h3 mb-3">Hola, {user?.name || 'usuario'}</h1>
              <p className="mb-4 text-secondary">
                Ya tienes la sesión iniciada. Desde aquí puedes entrar al flujo principal del marketplace
                sin volver a la landing pública.
              </p>
              <div className="d-flex align-items-center gap-3">
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="rounded-circle border border-2 border-light"
                    width="72"
                    height="72"
                  />
                )}
                <div>
                  <p className="mb-1 fw-semibold">{user?.name}</p>
                  <p className="mb-0 small text-secondary">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="row g-3">
            {authenticatedActions.map((action) => (
              <div className="col-md-6" key={action.title}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex flex-column">
                    <h2 className="h5 mb-2">{action.title}</h2>
                    <p className="text-secondary flex-grow-1 mb-3">{action.description}</p>
                    <Link to={action.to} className={action.buttonClassName}>
                      {action.buttonLabel}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="row align-items-center g-4">
      <div className="col-md-6">
        {message && <div className="alert alert-success">{message}</div>}
        <h1 className="display-5 fw-bold mb-3">Bienvenidos al MarketPlace</h1>
        <p className="lead mb-4">
          Compra y vende productos de manera sencilla. Explora las publicaciones, guarda tus favoritas y
          administra tus propias ofertas desde tu perfil.
        </p>
        <div className="d-flex gap-2">
          <Link to="/login" className="btn btn-dark">
            Iniciar sesión
          </Link>
          <Link to="/register" className="btn btn-success">
            Registrarme
          </Link>
        </div>
      </div>
      <div className="col-md-6 text-center">
        <div className="bg-light rounded-4 p-4 shadow-sm">
          <p className="mb-0">Aquí podrías mostrar un banner con ofertas destacadas o categorías.</p>
        </div>
      </div>
    </section>
  )
}
