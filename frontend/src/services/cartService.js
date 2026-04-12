const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

async function handleJsonResponse(response) {
  if (!response.ok) {
    const raw = await response.text()
    let parsed = null

    try {
      parsed = JSON.parse(raw)
    } catch {}

    throw new Error(parsed?.message || raw || 'Error al comunicarse con el servidor')
  }

  if (response.status === 204) return null
  return response.json()
}

function authHeaders(token, includeJson = false) {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchCart(token) {
  const res = await fetch(`${BASE_URL}/cart`, {
    headers: authHeaders(token),
  })

  return handleJsonResponse(res)
}

export async function addCartItem(postId, quantity, token) {
  const res = await fetch(`${BASE_URL}/cart`, {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ postId, quantity }),
  })

  return handleJsonResponse(res)
}

export async function updateCartItem(postId, quantity, token) {
  const res = await fetch(`${BASE_URL}/cart/${postId}`, {
    method: 'PUT',
    headers: authHeaders(token, true),
    body: JSON.stringify({ quantity }),
  })

  return handleJsonResponse(res)
}

export async function removeCartItem(postId, token) {
  const res = await fetch(`${BASE_URL}/cart/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  return handleJsonResponse(res)
}

export async function checkoutCart(token) {
  const res = await fetch(`${BASE_URL}/cart/checkout`, {
    method: 'POST',
    headers: authHeaders(token),
  })

  return handleJsonResponse(res)
}
