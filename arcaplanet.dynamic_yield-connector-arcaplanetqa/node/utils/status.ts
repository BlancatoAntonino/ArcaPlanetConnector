export const notFound = (fallback = {}) => (error: any) => {
  if (error.response && error.response.status === 404) {
    return fallback
  }
  throw error
}
