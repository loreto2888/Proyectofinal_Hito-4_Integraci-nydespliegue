import { Link } from 'react-router-dom'

export function Home() {
  return (
    <section className="row align-items-center g-4">
      <div className="col-md-6">
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
