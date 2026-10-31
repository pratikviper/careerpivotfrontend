const TOKEN_KEY = "cpc_access_token"
const EXPIRY_KEY = "cpc_token_expiry"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem(TOKEN_KEY)
  const expiry = localStorage.getItem(EXPIRY_KEY)
  if (!token) return null
  if (expiry && Date.now() > Number(expiry)) {
    clearSession()
    return null
  }
  return token
}

export function setSession(token: string, expiresInSeconds: number) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000))
}

export function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}
