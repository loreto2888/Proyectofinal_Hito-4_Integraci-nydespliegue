// Servicio de autenticación y usuarios basado en la API del backend.
// En desarrollo usa http://localhost:4000/api
// En producción se configura con la variable de entorno VITE_API_BASE_URL

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

async function handleJsonResponse(response) {
  if (!response.ok) {
    const raw = await response.text()
    let parsed = null

    try {
      parsed = JSON.parse(raw)
    } catch {}

    throw new Error(parsed?.message || raw || 'Error de autenticación')
  }
  if (response.status === 204) return null
  return response.json()
}

export async function loginRequest(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await handleJsonResponse(res)
  return { token: data.token, user: data.user }
}

export async function registerRequest({ name, email, password, avatarUrl }) {
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, avatarUrl }),
  })

  return handleJsonResponse(res)
}

export async function meRequest(token) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return handleJsonResponse(res)
}
