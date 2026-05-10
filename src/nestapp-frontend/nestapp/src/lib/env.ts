export function getRequiredGoogleClientId() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('Missing required VITE_GOOGLE_CLIENT_ID frontend environment variable')
  }
  return clientId
}
