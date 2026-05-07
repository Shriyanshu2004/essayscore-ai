/* Shared API helper */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || 'API error')
    }
    return await res.json()
  } catch (e) {
    console.warn('API error:', e.message)
    return null
  }
}

export const api = {
  get:  (path)         => apiFetch(path),
  post: (path, body)   => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put:  (path, body)   => apiFetch(path, { method: 'PUT',  body: JSON.stringify(body) }),
}
