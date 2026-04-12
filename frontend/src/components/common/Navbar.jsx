import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', {
      replace: true,
      state: { message: 'Sesión cerrada correctamente' },
    })
  }

  const activeClass = ({ isActive }) =>
    `nav-link ${isActive ? 'fw-semibold text-dark' : 'text-secondary'}`

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-warning shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <span className="me-2">🛒</span> MarketPlace
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink to="/posts" className={activeClass}>
                Publicaciones
              </NavLink>
            </li>
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink to="/cart" className={activeClass}>
                    Carrito {totalItems > 0 ? `(${totalItems})` : ''}
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/posts/new" className={activeClass}>
                    Crear publicación
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/profile" className={activeClass}>
                    Mi perfil
                  </NavLink>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-2">
            {isAuthenticated ? (
              <>
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="rounded-circle"
                    width="32"
                    height="32"
                  />
                )}
                <span className="me-2 small">{user?.name}</span>
                <button className="btn btn-outline-dark btn-sm" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-dark btn-sm">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="btn btn-success btn-sm">
                  Registrarme
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
