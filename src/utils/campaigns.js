export const MAX_CAMPAIGN_GUESTS = 7
export const OWNED_BLOCKING_STATUSES = ['draft', 'open', 'active']
export const EXTRA_SHARED_MAX = 1
export const EXTRA_PERSONAL_MAX = 1
export const EXTRA_SLOT_COST = 50

export function isOwnedBlockingCampaign(campaign, userId) {
  if (!campaign || !userId) return false
  if (!OWNED_BLOCKING_STATUSES.includes(campaign.status)) return false
  return campaignIdOf(campaign.owner) === String(userId)
}

export function findOwnedBlockingCampaign(campaigns, userId) {
  return (campaigns || []).find((item) => isOwnedBlockingCampaign(item, userId)) || null
}

export function campaignIdOf(value) {
  if (!value) return ''
  if (typeof value === 'object') return String(value._id || value.id || '')
  return String(value)
}

export function hasPersonalTemplate(campaign) {
  return Boolean(String(campaign?.personalTemplate?.title || '').trim())
}

export function hasSharedSlot(campaign) {
  return Boolean(campaignIdOf(campaign?.sharedChallengeId))
}

export function hasBothSlots(campaign) {
  return hasSharedSlot(campaign) && hasPersonalTemplate(campaign)
}

export function extraSharedSlots(campaign) {
  return (campaign?.extraSharedChallengeIds || []).filter((item) => campaignIdOf(item))
}

export function extraPersonalTemplates(campaign) {
  return (campaign?.extraPersonalTemplates || []).filter((template) => (
    Boolean(String(template?.title || '').trim())
  ))
}

export function canAddExtraShared(campaign) {
  return hasSharedSlot(campaign) && extraSharedSlots(campaign).length < EXTRA_SHARED_MAX
}

export function canAddExtraPersonal(campaign) {
  return hasPersonalTemplate(campaign) && extraPersonalTemplates(campaign).length < EXTRA_PERSONAL_MAX
}

export function isExtraCampaignSlot(campaign, slot) {
  if (slot === 'shared') return hasSharedSlot(campaign)
  if (slot === 'personal') return hasPersonalTemplate(campaign)
  return false
}

export function extraSlotUnlocked(campaign, slot) {
  if (slot === 'shared') return Boolean(campaign?.extraSharedUnlocked)
  if (slot === 'personal') return Boolean(campaign?.extraPersonalUnlocked)
  return false
}

export function canAffordExtraSlot(campaign, slot, sparks) {
  return extraSlotUnlocked(campaign, slot) || Number(sparks || 0) >= EXTRA_SLOT_COST
}

export function extraPersonalMissionId(campaign, template, userId, { isOwner = false } = {}) {
  const sourceId = campaignIdOf(template?.challengeId)
  const clones = campaign?.personalClones || []
  const mine = clones.find((row) => (
    campaignIdOf(row.userId) === String(userId || '')
    && campaignIdOf(row.sourceChallengeId) === sourceId
  ))
  if (mine) return campaignIdOf(mine.challengeId)
  if (isOwner) return sourceId
  return ''
}

export function isPersonalTemplate(challenge) {
  return challenge?.campaignRole === 'personalTemplate'
}

export function isPersonalClone(challenge) {
  return challenge?.campaignRole === 'personalClone'
}

export function excludePersonalTemplates(list = []) {
  return list.filter((item) => !isPersonalTemplate(item))
}

export function groupMissionsByCampaign(challenges = []) {
  const standalone = []
  const groups = new Map()

  for (const challenge of challenges) {
    if (isPersonalTemplate(challenge)) continue
    const campaignId = campaignIdOf(challenge?.campaignId)
    if (!campaignId) {
      standalone.push(challenge)
      continue
    }
    if (!groups.has(campaignId)) groups.set(campaignId, [])
    groups.get(campaignId).push(challenge)
  }

  return { standalone, groups }
}

export function campaignDayLabel(campaign, today = new Date()) {
  if (!campaign?.startDate || !campaign?.endDate) return ''
  const start = new Date(campaign.startDate)
  const end = new Date(campaign.endDate)
  const now = new Date(today)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  const total = Math.round((end - start) / 86400000) + 1
  const current = Math.min(total, Math.max(1, Math.round((now - start) / 86400000) + 1))
  return { current, total }
}
