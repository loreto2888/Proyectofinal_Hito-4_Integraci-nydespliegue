// Servicio de publicaciones conectado al backend del proyecto.
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

    throw new Error(parsed?.message || raw || 'Error al comunicarse con el servidor')
  }
  if (response.status === 204) return null
  return response.json()
}

export async function fetchPosts() {
  const res = await fetch(`${BASE_URL}/posts`)
  return handleJsonResponse(res)
}

export async function fetchPostById(id, token) {
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  })
  return handleJsonResponse(res)
}

export async function createPost(post, token) {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(post),
  })

  return handleJsonResponse(res)
}

export async function fetchFavorites(token) {
  const res = await fetch(`${BASE_URL}/favorites`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return handleJsonResponse(res)
}

export async function addFavorite(postId, token) {
  const res = await fetch(`${BASE_URL}/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ postId }),
  })
  return handleJsonResponse(res)
}

export async function removeFavorite(postId, token) {
  const res = await fetch(`${BASE_URL}/favorites/${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return handleJsonResponse(res)
}
