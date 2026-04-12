const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value) {
  return EMAIL_REGEX.test(value)
}

export function isValidUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
