import { Avatar, Style } from '@dicebear/core'
import shadowsDefinition from '@dicebear/styles/shadows.json'

const FACE_BACKGROUND = '1a1a2e'
const DEFAULT_INK = '2196f3'
const shadowsStyle = new Style(shadowsDefinition)
const cache = new Map()

function hexWithoutHash(hex) {
  const raw = String(hex || '').replace(/^#/, '').toLowerCase()
  return /^[0-9a-f]{6}$/.test(raw) ? raw : DEFAULT_INK
}

export function getShadowAvatarDataUri(seed, inkColor) {
  const seedKey = String(seed || '').trim()
  if (!seedKey) return ''

  const ink = hexWithoutHash(inkColor)
  const cacheKey = `${seedKey}|${ink}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const avatar = new Avatar(shadowsStyle, {
    seed: seedKey,
    backgroundColor: [FACE_BACKGROUND],
    backgroundColorFill: 'solid',
    inkColor: [ink],
    inkColorFill: 'solid'
  })
  const uri = avatar.toDataUri()
  cache.set(cacheKey, uri)
  return uri
}
