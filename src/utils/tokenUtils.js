// Lightweight JWT payload inspection — decode only, no signature verification
// (the backend verifies; the client only needs `exp` to avoid sending requests
// with a token it already knows is dead).

export function decodeTokenPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

// A token with no readable `exp` is treated as expired: it is either malformed
// or something we cannot reason about, and the server will reject it anyway.
export function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeTokenPayload(token)
  if (!payload || typeof payload.exp !== 'number') return true
  return payload.exp <= Date.now() / 1000 + skewSeconds
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  } catch {
    // localStorage unavailable (private mode) — nothing to clear
  }
  window.dispatchEvent(new Event('auth-changed'))
}
