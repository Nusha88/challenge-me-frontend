const AUTH_ERROR_KEYS = {
  'Invalid email or password': 'auth.invalidCredentials',
  'A user with this email already exists': 'auth.emailAlreadyExists',
  'Too many registration attempts from this IP. Please try again later.': 'auth.tooManyRegistrationAttempts'
}

export function getAuthErrorMessage(message, t, fallbackKey = 'auth.loginFailed') {
  if (!message) {
    return t(fallbackKey)
  }

  const translationKey = AUTH_ERROR_KEYS[message]
  return translationKey ? t(translationKey) : message
}
