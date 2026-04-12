import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const message = location.state?.message || ''

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

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
