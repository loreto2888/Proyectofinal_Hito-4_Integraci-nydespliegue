import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { PostsProvider } from './contexts/PostsContext'
import { CartProvider } from './contexts/CartContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PostsProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </PostsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
