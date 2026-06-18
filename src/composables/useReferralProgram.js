import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import { APP_EVENTS, addAppEventListener, removeAppEventListener } from '../utils/appEvents'

const defaultStats = {
  referralCode: '',
  referralLink: '',
  invitedCount: 0,
  maxInvites: 5,
  canInviteMore: true,
  showReferralUi: false
}

export function useReferralProgram() {
  const { t } = useI18n()

  const stats = ref({ ...defaultStats })
  const loading = ref(false)
  const dialogOpen = ref(false)
  const copyFeedback = ref(false)

  const showReferralUi = computed(() => stats.value.showReferralUi)

  let copyTimeoutId = null

  async function loadReferralStats() {
    loading.value = true
    try {
      const response = await userService.getReferralStats()
      if (response?.data) {
        stats.value = {
          ...defaultStats,
          ...response.data
        }
      }
    } catch (error) {
      console.error('Error loading referral stats:', error)
      stats.value = { ...defaultStats }
    } finally {
      loading.value = false
    }
  }

  function openDialog() {
    dialogOpen.value = true
  }

  function closeDialog() {
    dialogOpen.value = false
  }

  async function copyReferralLink() {
    const link = stats.value.referralLink
    if (!link) return false

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = link
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      copyFeedback.value = true
      if (copyTimeoutId) {
        window.clearTimeout(copyTimeoutId)
      }
      copyTimeoutId = window.setTimeout(() => {
        copyFeedback.value = false
        copyTimeoutId = null
      }, 2000)
      return true
    } catch (error) {
      console.error('Error copying referral link:', error)
      return false
    }
  }

  function getShareMessage() {
    return `${t('referral.shareMessage')} ${stats.value.referralLink}`.trim()
  }

  function getTelegramShareUrl() {
    const url = encodeURIComponent(stats.value.referralLink || '')
    const text = encodeURIComponent(t('referral.shareMessage'))
    return `https://t.me/share/url?url=${url}&text=${text}`
  }

  function getWhatsAppShareUrl() {
    return `https://wa.me/?text=${encodeURIComponent(getShareMessage())}`
  }

  function openTelegramShare() {
    const shareUrl = getTelegramShareUrl()
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function openWhatsAppShare() {
    const shareUrl = getWhatsAppShareUrl()
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function onAuthChanged() {
    loadReferralStats()
  }

  function onChallengeUpdated() {
    loadReferralStats()
  }

  function setupListeners() {
    addAppEventListener(APP_EVENTS.AUTH_CHANGED, onAuthChanged)
    addAppEventListener('challenge-updated', onChallengeUpdated)
  }

  function teardownListeners() {
    removeAppEventListener(APP_EVENTS.AUTH_CHANGED, onAuthChanged)
    removeAppEventListener('challenge-updated', onChallengeUpdated)
    if (copyTimeoutId) {
      window.clearTimeout(copyTimeoutId)
      copyTimeoutId = null
    }
  }

  return {
    stats,
    loading,
    dialogOpen,
    copyFeedback,
    showReferralUi,
    loadReferralStats,
    openDialog,
    closeDialog,
    copyReferralLink,
    getTelegramShareUrl,
    getWhatsAppShareUrl,
    openTelegramShare,
    openWhatsAppShare,
    setupListeners,
    teardownListeners
  }
}
