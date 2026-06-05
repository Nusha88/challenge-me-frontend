const DEFAULT_PUBLIC_APP_ORIGIN = 'https://ignite-me.app'

export function getPublicAppOrigin() {
  const configured = import.meta.env.VITE_PUBLIC_APP_URL
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  return DEFAULT_PUBLIC_APP_ORIGIN
}

export function getMissionShareUrl(missionId) {
  if (!missionId) return ''
  return `${getPublicAppOrigin()}/missions/${missionId}`
}
