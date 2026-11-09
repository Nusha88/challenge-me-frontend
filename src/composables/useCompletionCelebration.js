import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { userService } from '../services/api'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import {
  captureVictoryCard,
  shareVictoryImage
} from '../utils/imageGenerator'
import { GOALS, reachGoal } from '../services/analytics'

const APP_URL = 'https://ignite-me.app'
const SHARE_FORMAT = 'story'

function getDailyBonusKey() {
  const todayStr = new Date().toISOString().slice(0, 10)
  return `xp_daily_bonus_${todayStr}`
}

export function useCompletionCelebration({
  isAllCompleted,
  getCompletionImageData,
  getCardElement
}) {
  const { t } = useI18n()
  const userStore = useUserStore()
  const { applyXpAwardResponse, applyRewardResponse } = useXpAwardFeedback()

  const showCompletionDialog = ref(false)
  const generatingImage = ref(false)
  const shareError = ref('')
  const statusMessage = ref('')
  const sparksClaimed = ref(false)

  function getShareLink() {
    const { referralLink } = getCompletionImageData() || {}
    return String(referralLink || '').trim() || APP_URL
  }

  function buildShareCaption() {
    const data = getCompletionImageData() || {}
    const name = data.userName || t('profile.ranks.explorer')
    const missionTitle = String(data.firstMissionTitle || '').trim()
    const missionSuffix = missionTitle ? ` · ${missionTitle}` : ''
    const streak = Number(data.streakDays) || 0

    const parts = [
      t('home.loggedIn.completionDialog.captionLine', {
        name,
        streak,
        mission: missionSuffix
      }, streak).trim()
    ].filter(Boolean)

    parts.push(t('home.loggedIn.completionDialog.captionHashtags'))
    parts.push(getShareLink())
    return parts.join('\n')
  }

  async function tryAwardDailyBonusXp() {
    try {
      if (!userStore.isLoggedIn) return
      if (!isAllCompleted.value) return

      const key = getDailyBonusKey()
      if (localStorage.getItem(key)) return

      const response = await userService.awardDailyBonusXp()
      if (response?.data?.awarded) {
        localStorage.setItem(key, '1')
        applyXpAwardResponse(response)
      } else {
        localStorage.setItem(key, '0')
      }
    } catch {
      try {
        localStorage.setItem(getDailyBonusKey(), '0')
      } catch {
        // ignore
      }
    }
  }

  async function awardVictorySparks() {
    try {
      const response = await userService.awardManifestSparks({ type: 'victory' })
      applyRewardResponse(response)
      sparksClaimed.value = true
      statusMessage.value = t('home.loggedIn.completionDialog.sparksClaimed')
    } catch (manifestError) {
      console.warn('Victory manifest sparks award failed', manifestError)
    }
  }

  function finishSuccessAndClose(delayMs = 900) {
    setTimeout(() => {
      showCompletionDialog.value = false
      sparksClaimed.value = false
      statusMessage.value = ''
    }, delayMs)
  }

  function closeCompletionDialog() {
    reachGoal(GOALS.COMPLETION_DIALOG_DISMISS, { format: SHARE_FORMAT })
    shareError.value = ''
    statusMessage.value = ''
    sparksClaimed.value = false
    showCompletionDialog.value = false
  }

  function openCompletionShare() {
    shareError.value = ''
    statusMessage.value = ''
    sparksClaimed.value = false
    showCompletionDialog.value = true
    reachGoal(GOALS.COMPLETION_DIALOG_OPEN, { format: SHARE_FORMAT })
  }

  async function capturePoster() {
    const element = getCardElement?.()
    if (!element) {
      throw new Error('Victory card element missing')
    }
    return captureVictoryCard(element)
  }

  async function shareVictory() {
    generatingImage.value = true
    shareError.value = ''
    statusMessage.value = ''

    reachGoal(GOALS.COMPLETION_SHARE_CLICK, {
      format: SHARE_FORMAT,
      method: 'share'
    })

    try {
      const dataUrl = await capturePoster()
      const fileName = `ignite-victory-${SHARE_FORMAT}-${new Date().toISOString().split('T')[0]}.png`
      const caption = buildShareCaption()

      const shareResult = await shareVictoryImage(dataUrl, fileName, {
        title: 'Ignite',
        text: caption
      })

      if (shareResult === 'cancelled') {
        reachGoal(GOALS.COMPLETION_SHARE_CANCEL, { format: SHARE_FORMAT })
        return
      }

      const method = shareResult === 'shared' ? 'native_share' : 'download'
      reachGoal(GOALS.COMPLETION_SHARE_SUCCESS, {
        format: SHARE_FORMAT,
        method
      })

      if (shareResult === 'downloaded') {
        statusMessage.value = t('home.loggedIn.completionDialog.desktopCoach')
      }

      await awardVictorySparks()
      finishSuccessAndClose(shareResult === 'downloaded' ? 1400 : 900)
    } catch (error) {
      console.error('Share failed', error)
      shareError.value = t('home.loggedIn.completionDialog.shareUnavailable')
    } finally {
      generatingImage.value = false
    }
  }

  watch(isAllCompleted, (val) => {
    if (val) {
      tryAwardDailyBonusXp()
      return
    }
    if (showCompletionDialog.value) {
      showCompletionDialog.value = false
    }
  })

  return {
    showCompletionDialog,
    generatingImage,
    shareError,
    statusMessage,
    sparksClaimed,
    closeCompletionDialog,
    openCompletionShare,
    shareVictory
  }
}
