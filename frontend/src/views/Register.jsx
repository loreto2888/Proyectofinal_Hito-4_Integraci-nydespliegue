import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isValidEmail, isValidUrl } from '../utils/validation'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [didValidate, setDidValidate] = useState(false)

  const validateForm = () => {
    const nextErrors = {}

    if (!name.trim()) {
      nextErrors.name = 'El nombre es obligatorio'
    } else if (name.trim().length < 3) {
      nextErrors.name = 'El nombre debe tener al menos 3 caracteres'
    }

    if (!email.trim()) {
      nextErrors.email = 'El email es obligatorio'
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Ingresa un email válido'
    }

    if (!password) {
      nextErrors.password = 'La contraseña es obligatoria'
    } else if (password.length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (avatarUrl.trim() && !isValidUrl(avatarUrl.trim())) {
      nextErrors.avatarUrl = 'Ingresa una URL válida para el avatar'
    }

    return nextErrors
  }

  useEffect(() => {
    if (didValidate) {
      setFieldErrors(validateForm())
    }
  }, [avatarUrl, didValidate, email, name, password])

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
      await register(name.trim(), email.trim(), password, avatarUrl.trim())
      navigate('/', {
        replace: true,
        state: { message: 'Registro completado correctamente' },
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
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Market Place - Registrarse</h5>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
              </div>
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
              <div className="mb-3">
                <label className="form-label">Avatar URL</label>
                <input
                  type="url"
                  className={`form-control ${fieldErrors.avatarUrl ? 'is-invalid' : ''}`}
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                {fieldErrors.avatarUrl && <div className="invalid-feedback">{fieldErrors.avatarUrl}</div>}
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-warning" disabled={loading}>
                  {loading ? 'Registrando…' : 'Registrarme'}
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
