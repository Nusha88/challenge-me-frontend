export const MAX_CAMPAIGN_GUESTS = 7

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

export function isPersonalTemplate(challenge) {
  return challenge?.campaignRole === 'personalTemplate'
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
