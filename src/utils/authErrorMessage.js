const AUTH_ERROR_KEYS = {
  'Invalid email or password': 'auth.invalidCredentials',
  'This account has no password. Use Forgot password to set one.': 'auth.noPasswordSet',
  'A user with this email already exists': 'auth.emailAlreadyExists',
  'Too many registration attempts from this IP. Please try again later.': 'auth.tooManyRegistrationAttempts',
  'Google sign-in is not configured': 'auth.googleUnavailable',
  'Telegram sign-in is not configured': 'auth.telegramUnavailable',
  'Invalid Telegram login': 'auth.telegramInvalid',
  'Telegram login expired': 'auth.telegramExpired',
  'This account is already linked to another hero': 'auth.socialAlreadyLinked',
  'This Telegram account is already linked to another hero': 'auth.socialAlreadyLinked',
  'Account is disabled': 'auth.accountDisabled'
}

export function getAuthErrorMessage(message, t, fallbackKey = 'auth.loginFailed') {
  if (!message) {
    return t(fallbackKey)
  }

  const translationKey = AUTH_ERROR_KEYS[message]
  return translationKey ? t(translationKey) : message
}
