import axios from 'axios'

/** User-facing message from failed POST /api/v1/search */
export function getSearchSubmitErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return 'Something went wrong. Please try again.'
  }
  const status = err.response?.status
  if (status === 429) {
    return 'Too many search requests. Please wait a minute and try again.'
  }
  if (status === 400 && err.response?.data && typeof err.response.data === 'object') {
    const data = err.response.data as { fields?: Record<string, string>; error?: string }
    if (data.fields && typeof data.fields === 'object') {
      const first = Object.values(data.fields)[0]
      if (first) return first
    }
    if (typeof data.error === 'string') return data.error
  }
  if (status !== undefined && status >= 500) {
    return 'The server is having trouble. Please try again in a few minutes.'
  }
  if (!err.response) {
    return "Couldn't reach the server. Check your connection and try again."
  }
  return 'Something went wrong. Please try again.'
}
