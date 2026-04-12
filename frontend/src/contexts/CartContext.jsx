import { createContext, useContext, useEffect, useState } from 'react'
import {
  addCartItem,
  checkoutCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '../services/cartService'
import { useAuth } from './AuthContext'

const CartContext = createContext()

const EMPTY_CART = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
}

export function CartProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadCart = async () => {
      if (!isAuthenticated || !token) {
        setCart(EMPTY_CART)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const data = await fetchCart(token)
        if (!cancelled) {
          setCart(data)
        }
      } catch {
        if (!cancelled) {
          setCart(EMPTY_CART)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCart()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, token])

  const loadCart = async () => {
    if (!token) {
      setCart(EMPTY_CART)
      return EMPTY_CART
    }

    const data = await fetchCart(token)
    setCart(data)
    return data
  }

  const addToCart = async (postId, quantity = 1) => {
    const data = await addCartItem(postId, quantity, token)
    setCart(data)
    return data
  }

  const updateQuantity = async (postId, quantity) => {
    const data = await updateCartItem(postId, quantity, token)
    setCart(data)
    return data
  }

  const removeFromCart = async (postId) => {
    const data = await removeCartItem(postId, token)
    setCart(data)
    return data
  }

  const checkout = async () => {
    const result = await checkoutCart(token)
    setCart(EMPTY_CART)
    return result
  }

  const value = {
    ...cart,
    loading,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    checkout,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)

  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }

  return ctx
}
