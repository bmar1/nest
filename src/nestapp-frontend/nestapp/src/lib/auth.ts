export interface AuthUser {
  email: string
  name: string
  picture?: string
  role: 'user'
}

export interface AuthState {
  user: AuthUser
  idToken: string
}

export function parseGoogleCredential(credential: string): AuthUser {
  const [, payload] = credential.split('.')
  if (!payload) {
    throw new Error('Google credential is missing a JWT payload')
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const decoded = decodeURIComponent(
    atob(normalized)
      .split('')
      .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  )
  const claims = JSON.parse(decoded) as {
    email?: string
    name?: string
    picture?: string
  }

  if (!claims.email) {
    throw new Error('Google credential did not include an email')
  }

  return {
    email: claims.email,
    name: claims.name || claims.email,
    picture: claims.picture,
    role: 'user',
  }
}
