export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')

  // Avoid mixed-content errors when frontend is served over HTTPS.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (!configured) return '/backend'
    if (configured.startsWith('http://')) return '/backend'
  }

  return configured || 'http://localhost:8080'
}
