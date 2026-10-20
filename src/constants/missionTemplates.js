import missionTemplates from '../data/missionTemplates.json'
import draft1 from '../assets/drafts/1.jpg'
import draft2 from '../assets/drafts/2.jpg'
import draft3 from '../assets/drafts/3.jpg'
import draft4 from '../assets/drafts/4.jpg'
import draft5 from '../assets/drafts/5.jpg'

const DRAFT_IMAGES = [draft1, draft2, draft3, draft4, draft5]

export const BASE_MISSION_COMPLETION_SPARKS = 75
export const WEEKLY_RITUAL_REWARD_SPARKS = 150

export function getMissionTemplates() {
  return missionTemplates.map((template, index) => ({
    ...template,
    imageUrl: DRAFT_IMAGES[index] || ''
  }))
}

export function getMissionTemplateIds() {
  return missionTemplates.map((template) => template.id)
}

export function getMissionTemplateById(id) {
  if (!id) return null
  return getMissionTemplates().find((template) => template.id === id) || null
}
