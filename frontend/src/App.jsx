import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { Home } from './views/Home'
import { Login } from './views/Login'
import { Register } from './views/Register'
import { Profile } from './views/Profile'
import { NewPost } from './views/NewPost'
import { Gallery } from './views/Gallery'
import { PostDetail } from './views/PostDetail'
import { Cart } from './views/Cart'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <p className="text-muted mb-0">Cargando acceso...</p>
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <p className="text-muted mb-0">Cargando acceso...</p>
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route path="/posts" element={<Gallery />} />
        <Route path="/posts/:id" element={<PostDetail />} />

        {/* Privadas */}
        <Route
          path="/cart"
          element={
            <PrivateRoute>
              <Cart />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/posts/:id/edit"
          element={
            <PrivateRoute>
              <NewPost />
            </PrivateRoute>
          }
        />
        <Route
          path="/posts/new"
          element={
            <PrivateRoute>
              <NewPost />
            </PrivateRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
