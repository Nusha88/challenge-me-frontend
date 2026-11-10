import missionTemplates from '../data/missionTemplates.json'
import en from '../locales/en.json'
import i18n from '../i18n'
import draft1 from '../assets/drafts/1.jpg'
import draft2 from '../assets/drafts/2.jpg'
import draft3 from '../assets/drafts/3.jpg'
import draft4 from '../assets/drafts/4.jpg'
import draft5 from '../assets/drafts/5.jpg'

const DRAFT_IMAGES = [draft1, draft2, draft3, draft4, draft5]
const EN_TEMPLATE_COPY = en.allChallenges?.templates?.items || {}

export const BASE_MISSION_COMPLETION_SPARKS = 75
export const WEEKLY_RITUAL_REWARD_SPARKS = 150

function activeLocale(locale) {
  const value = locale
    || i18n.global.locale?.value
    || i18n.global.locale
  return value === 'en' ? 'en' : 'ru'
}

function withLocalizedCopy(template, locale) {
  const copy = activeLocale(locale) === 'en'
    ? EN_TEMPLATE_COPY[template.id] || {}
    : {}
  return {
    ...template,
    title: copy.title || template.title,
    description: copy.description || template.description
  }
}

export function getMissionTemplates(locale) {
  return missionTemplates.map((template, index) => withLocalizedCopy({
    ...template,
    imageUrl: DRAFT_IMAGES[index] || ''
  }, locale))
}

export function getMissionTemplateIds() {
  return missionTemplates.map((template) => template.id)
}

export function getMissionTemplateById(id, locale) {
  if (!id) return null
  return getMissionTemplates(locale).find((template) => template.id === id) || null
}
