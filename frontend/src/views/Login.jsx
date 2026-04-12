import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isValidEmail } from '../utils/validation'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message] = useState(location.state?.message || '')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [didValidate, setDidValidate] = useState(false)

  const validateForm = () => {
    const nextErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'El email es obligatorio'
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Ingresa un email válido'
    }

    if (!password) {
      nextErrors.password = 'La contraseña es obligatoria'
    }

    return nextErrors
  }

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    if (didValidate) {
      setFieldErrors(validateForm())
    }
  }, [didValidate, email, password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setDidValidate(true)
    setError('')

    const validationErrors = validateForm()
    setFieldErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate('/', {
        replace: true,
        state: { message: 'Sesion iniciada correctamente' },
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-warning">
            <h5 className="mb-0">Market Place - Iniciar sesión</h5>
          </div>
          <div className="card-body">
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  type="email"
                  className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Ingresando…' : 'Iniciar Sesión'}
                </button>
                <Link to="/" className="btn btn-outline-secondary">
                  Volver al menú principal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
