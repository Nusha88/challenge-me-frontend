import { computed, ref, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { getMissionShareUrl } from '../utils/appUrl'

const MAX_INVITE_AVATARS = 5

function mapInviteParticipants(challenge) {
  const list = Array.isArray(challenge?.participants) ? challenge.participants : []
  const unique = []
  const seen = new Set()

  for (const participant of list) {
    const user = participant?.userId && typeof participant.userId === 'object'
      ? participant.userId
      : participant
    const id = String(user?._id || user?.id || participant?._id || participant?.id || '')
    if (!id || seen.has(id)) continue
    seen.add(id)
    const name = String(user?.name || participant?.name || '').trim()
    unique.push({
      id,
      name,
      avatarUrl: user?.avatarUrl || participant?.avatarUrl || '',
      initial: name.charAt(0).toUpperCase() || '?'
    })
  }

  return {
    participantsPreview: unique.slice(0, MAX_INVITE_AVATARS),
    participantsRemaining: Math.max(0, unique.length - MAX_INVITE_AVATARS)
  }
}

/**
 * Builds the invite poster field bag from challenge + progress context.
 */
export function buildMissionInviteCardData({
  challenge,
  t,
  inviterName = '',
  inviterAvatarUrl = '',
  isOwner = false,
  isParticipant = false,
  completedDays = 0,
  totalDays = 0,
  progressDone = 0,
  progressTotal = 0
} = {}) {
  if (!challenge) return null

  const isQuest = challenge.challengeType === CHALLENGE_TYPES.RESULT
  const isRitualMember = isOwner || isParticipant
  const participantsCount = Array.isArray(challenge.participants)
    ? challenge.participants.length
    : 0
  const participantsLine = participantsCount > 1
    ? t('challenges.inviteCard.participantsShort', { count: participantsCount })
    : ''

  let statusLine = ''
  if (isQuest && progressTotal > 0) {
    statusLine = t('challenges.inviteCard.questDayLine', {
      done: progressDone,
      total: progressTotal
    })
  } else if (!isQuest && isRitualMember && totalDays > 0 && completedDays > 0) {
    statusLine = t('challenges.inviteCard.dayLine', {
      done: completedDays,
      total: totalDays
    })
  } else if (!isQuest && totalDays > 0) {
    statusLine = t('challenges.inviteCard.durationShort', {
      count: totalDays
    }, totalDays)
  }

  const name = inviterName || ''
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?'
  const { participantsPreview, participantsRemaining } = mapInviteParticipants(challenge)

  return {
    challengeId: challenge._id,
    isQuest,
    badgeLabel: isQuest
      ? t('challenges.inviteCard.badgeQuest')
      : t('challenges.inviteCard.badgeRitual'),
    title: challenge.title || '',
    joinHook: t('challenges.inviteCard.joinMe'),
    statusLine,
    participantsLine,
    participantsPreview,
    participantsRemaining,
    ctaLabel: t('challenges.inviteCard.cta'),
    dialogTitle: isQuest
      ? t('challenges.inviteCard.questDialogTitle')
      : t('challenges.inviteCard.ritualDialogTitle'),
    inviterName: name,
    inviterAvatarUrl: inviterAvatarUrl || '',
    inviterInitial: initial,
    hasInviter: Boolean(name),
    showProgressOption: !isQuest && isRitualMember && totalDays > 0 && completedDays > 0,
    imageUrl: challenge.imageUrl || '',
    shareText: name
      ? t('challenges.inviteCard.shareTextNamed', { name, title: challenge.title || '' })
      : t('challenges.inviteCard.shareText', { title: challenge.title || '' })
  }
}

/**
 * Mission-invite dialog state + card data for challenge details.
 */
export function useMissionInvite({
  challenge,
  isOwner,
  isParticipant,
  progressStats
} = {}) {
  const { t } = useI18n()
  const userStore = useUserStore()
  const inviteDialogOpen = ref(false)

  const inviteUrl = computed(() => {
    const c = toValue(challenge)
    return getMissionShareUrl(c?._id || c?.id)
  })

  const inviteCardData = computed(() => {
    const c = toValue(challenge)
    const stats = toValue(progressStats) || {}
    const inviterName = userStore.userName || c?.owner?.name || ''
    const inviterAvatarUrl = userStore.userAvatarUrl || c?.owner?.avatarUrl || ''

    return buildMissionInviteCardData({
      challenge: c,
      t,
      inviterName,
      inviterAvatarUrl,
      isOwner: Boolean(toValue(isOwner)),
      isParticipant: Boolean(toValue(isParticipant)),
      completedDays: stats.completedDays || stats.daysOnPath || 0,
      totalDays: stats.totalDays || 0,
      progressDone: stats.progressDone || 0,
      progressTotal: stats.progressTotal || 0
    })
  })

  function openInviteCardDialog() {
    inviteDialogOpen.value = true
  }

  function closeInviteCardDialog() {
    inviteDialogOpen.value = false
  }

  return {
    inviteDialogOpen,
    inviteUrl,
    inviteCardData,
    openInviteCardDialog,
    closeInviteCardDialog
  }
}
