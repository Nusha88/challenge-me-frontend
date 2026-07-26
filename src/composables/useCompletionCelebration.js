import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { userService } from '../services/api'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import {
  buildVictoryImageDataUrl,
  shareVictoryImage,
  downloadVictoryImage
} from '../utils/imageGenerator'
import { GOALS, reachGoal } from '../services/analytics'

const APP_URL = 'https://ignite-me.app'
const PREFETCH_DEBOUNCE_MS = 280

function getDismissalKey() {
  const todayStr = new Date().toISOString().slice(0, 10)
  return `completion_dialog_dismissed_${todayStr}`
}

function getDailyBonusKey() {
  const todayStr = new Date().toISOString().slice(0, 10)
  return `xp_daily_bonus_${todayStr}`
}

function hasDismissedToday() {
  try {
    return localStorage.getItem(getDismissalKey()) === 'true'
  } catch {
    return false
  }
}

function dismissDialogToday() {
  try {
    localStorage.setItem(getDismissalKey(), 'true')
  } catch {
    // ignore storage errors
  }
}

function clearDismissalForToday() {
  try {
    localStorage.removeItem(getDismissalKey())
  } catch {
    // ignore storage errors
  }
}

function buildTaskKey(tasks = [], format = 'story') {
  const taskPart = tasks
    .map((task) => `${task.type}:${task.id}:${task.selected !== false ? '1' : '0'}`)
    .join('|')
  return `${format}::${taskPart}`
}

function canUseNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export function useCompletionCelebration({
  isAllCompleted,
  completedItems,
  totalItems,
  isInitialDataLoading,
  isChecklistLoading,
  getCompletionImageData,
  getChallengeCompletedDays,
  getChallengeTotalDays,
  getDefaultShareTasks,
  watchChecklistCompletedSteps
}) {
  const { t, locale } = useI18n()
  const userStore = useUserStore()
  const { applyXpAwardResponse, applyRewardResponse } = useXpAwardFeedback()

  const showCompletionDialog = ref(false)
  const hasShownCompletionDialog = ref(false)
  const generatingImage = ref(false)
  const preparingShare = ref(false)
  const savingImage = ref(false)
  const copyingCaption = ref(false)
  const shareError = ref('')
  const statusMessage = ref('')
  const shareDialogPinned = ref(false)
  const previewDataUrl = ref(null)
  const prefetchedTaskKey = ref(null)
  const shareFormat = ref('story')
  const selectedShareTasks = ref([])
  const sparksClaimed = ref(false)
  let prefetchTimer = null
  let prefetchGeneration = 0

  const shareCaption = computed(() => buildShareCaption(selectedShareTasks.value))

  const canNativeShare = computed(() => canUseNativeShare())

  function buildShareCaption(tasksToUse = []) {
    const { userName, streakDays } = getCompletionImageData()
    const name = userName || t('profile.ranks.explorer')
    const selected = (tasksToUse || []).filter((task) => task.selected !== false)
    const firstMission = selected.find((task) => task.type === 'challenge')
    const missionTitle = firstMission?.title || firstMission?.payload?.title || ''
    const missionSuffix = missionTitle ? ` · ${missionTitle}` : ''

    const streak = Number(streakDays) || 0
    const parts = [
      t('home.loggedIn.completionDialog.captionLine', {
        name,
        streak,
        mission: missionSuffix
      }, streak).trim()
    ].filter(Boolean)

    parts.push(t('home.loggedIn.completionDialog.captionHashtags'))
    parts.push(APP_URL)
    return parts.join('\n')
  }

  function buildImageOptions(tasksToUse, format = shareFormat.value) {
    const selectedChallenges = tasksToUse.filter((task) => task.type === 'challenge')
    const selectedChecklistTasks = tasksToUse.filter((task) => task.type === 'checklist')
    const { userName, streakDays } = getCompletionImageData()

    const challenges = selectedChallenges.map((task) => {
      const challenge = task.payload
      return {
        title: challenge.title,
        completedDays: getChallengeCompletedDays(challenge),
        totalDays: getChallengeTotalDays(challenge)
      }
    })

    const doneSteps = selectedChecklistTasks.map((task) => task.payload)
    const checklistTasks = doneSteps.length > 3
      ? [{
        title: t('home.loggedIn.completionImage.completedTasksSummary', { count: doneSteps.length }),
        isSummary: true
      }]
      : doneSteps.map((step) => ({ title: step.title, done: true }))

    const streak = Number(streakDays) || 0

    return {
      userName: userName || 'Hero',
      date: new Date(),
      challenges,
      checklistTasks,
      streakDays,
      format,
      locale: locale.value,
      translations: {
        conqueredTitle: t('home.loggedIn.completionImage.conqueredTitle'),
        missionsLabel: t('home.loggedIn.completionImage.missionsLabel'),
        stepsLabel: t('home.loggedIn.completionImage.stepsLabel'),
        stepsCompleted: t('home.loggedIn.completionImage.stepsCompleted'),
        dayStreak: t('home.loggedIn.completionImage.dayStreak', streak),
        tagline: t('home.loggedIn.completionImage.tagline')
      }
    }
  }

  function syncSelectedTasksFromDefaults() {
    const defaults = getDefaultShareTasks?.() || []
    selectedShareTasks.value = defaults.map((task, index) => ({
      id: task.id || `${task.type || 'task'}-${index}`,
      title: task.title || '',
      selected: task.selected !== false,
      type: task.type,
      payload: task.payload
    }))
  }

  function setSelectedTasks(tasks) {
    selectedShareTasks.value = Array.isArray(tasks) ? tasks : []
    schedulePreviewPrefetch()
  }

  function setShareFormat(format) {
    shareFormat.value = format === 'square' ? 'square' : 'story'
    schedulePreviewPrefetch()
  }

  function schedulePreviewPrefetch() {
    if (!showCompletionDialog.value) return
    if (prefetchTimer) clearTimeout(prefetchTimer)
    prefetchTimer = setTimeout(() => {
      prefetchVictoryImage(selectedShareTasks.value.filter((task) => task.selected !== false))
    }, PREFETCH_DEBOUNCE_MS)
  }

  async function prefetchVictoryImage(tasksToUse) {
    if (!Array.isArray(tasksToUse) || tasksToUse.length === 0) {
      previewDataUrl.value = null
      prefetchedTaskKey.value = null
      preparingShare.value = false
      return
    }

    const taskKey = buildTaskKey(tasksToUse, shareFormat.value)
    if (prefetchedTaskKey.value === taskKey && previewDataUrl.value) {
      preparingShare.value = false
      return
    }

    const generation = ++prefetchGeneration
    preparingShare.value = true
    try {
      const dataUrl = await buildVictoryImageDataUrl(buildImageOptions(tasksToUse, shareFormat.value))
      if (generation !== prefetchGeneration) return
      previewDataUrl.value = dataUrl
      prefetchedTaskKey.value = taskKey
    } catch (error) {
      console.warn('Victory image prefetch failed:', error)
      if (generation !== prefetchGeneration) return
      previewDataUrl.value = null
      prefetchedTaskKey.value = null
    } finally {
      if (generation === prefetchGeneration) {
        preparingShare.value = false
      }
    }
  }

  async function ensurePreviewDataUrl(tasksToUse) {
    const selected = tasksToUse.filter((task) => task.selected !== false)
    const taskKey = buildTaskKey(selected, shareFormat.value)
    if (previewDataUrl.value && prefetchedTaskKey.value === taskKey) {
      return previewDataUrl.value
    }
    const dataUrl = await buildVictoryImageDataUrl(buildImageOptions(selected, shareFormat.value))
    previewDataUrl.value = dataUrl
    prefetchedTaskKey.value = taskKey
    return dataUrl
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
    dismissDialogToday()
    shareDialogPinned.value = false
    hasShownCompletionDialog.value = true
    setTimeout(() => {
      showCompletionDialog.value = false
      sparksClaimed.value = false
      statusMessage.value = ''
    }, delayMs)
  }

  function closeCompletionDialog() {
    reachGoal(GOALS.COMPLETION_DIALOG_DISMISS, { format: shareFormat.value })
    shareDialogPinned.value = false
    shareError.value = ''
    statusMessage.value = ''
    sparksClaimed.value = false
    dismissDialogToday()
    showCompletionDialog.value = false
    hasShownCompletionDialog.value = true
  }

  function openCompletionShare() {
    clearDismissalForToday()
    shareError.value = ''
    statusMessage.value = ''
    sparksClaimed.value = false
    shareDialogPinned.value = true
    showCompletionDialog.value = true
  }

  function checkAndShowCompletionDialog() {
    if (hasDismissedToday()) {
      return
    }

    const completed = completedItems.value
    const total = totalItems.value
    const allCompleted = total > 0 && completed === total

    if (
      !isInitialDataLoading()
      && !isChecklistLoading()
      && allCompleted
      && isAllCompleted.value
      && total > 0
      && !hasShownCompletionDialog.value
      && !hasDismissedToday()
    ) {
      setTimeout(() => {
        const finalCompleted = completedItems.value
        const finalTotal = totalItems.value
        if (finalTotal > 0 && finalCompleted === finalTotal && isAllCompleted.value && !hasDismissedToday()) {
          shareDialogPinned.value = true
          showCompletionDialog.value = true
          hasShownCompletionDialog.value = true
        }
      }, 300)
    }
  }

  function scheduleCompletionDialogCheck(delayMs = 500) {
    setTimeout(() => {
      if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
        checkAndShowCompletionDialog()
      }
    }, delayMs)
  }

  async function shareVictory(selectedTasks = null) {
    generatingImage.value = true
    shareError.value = ''
    statusMessage.value = ''

    const tasksToUse = Array.isArray(selectedTasks)
      ? selectedTasks
      : selectedShareTasks.value.filter((task) => task.selected !== false)

    reachGoal(GOALS.COMPLETION_SHARE_CLICK, {
      format: shareFormat.value,
      method: 'share'
    })

    try {
      if (tasksToUse.length === 0) {
        shareError.value = t('home.loggedIn.completionDialog.shareUnavailable')
        return
      }

      const dataUrl = await ensurePreviewDataUrl(tasksToUse)
      const fileName = `ignite-victory-${shareFormat.value}-${new Date().toISOString().split('T')[0]}.png`
      const caption = buildShareCaption(tasksToUse)

      const shareResult = await shareVictoryImage(dataUrl, fileName, {
        title: 'Ignite',
        text: caption
      })

      if (shareResult === 'cancelled') {
        reachGoal(GOALS.COMPLETION_SHARE_CANCEL, { format: shareFormat.value })
        return
      }

      const method = shareResult === 'shared' ? 'native_share' : 'download'
      reachGoal(GOALS.COMPLETION_SHARE_SUCCESS, {
        format: shareFormat.value,
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

  async function saveImage(selectedTasks = null) {
    savingImage.value = true
    shareError.value = ''
    statusMessage.value = ''

    const tasksToUse = Array.isArray(selectedTasks)
      ? selectedTasks
      : selectedShareTasks.value.filter((task) => task.selected !== false)

    reachGoal(GOALS.COMPLETION_SHARE_CLICK, {
      format: shareFormat.value,
      method: 'save'
    })

    try {
      if (tasksToUse.length === 0) {
        shareError.value = t('home.loggedIn.completionDialog.shareUnavailable')
        return
      }

      const dataUrl = await ensurePreviewDataUrl(tasksToUse)
      const fileName = `ignite-victory-${shareFormat.value}-${new Date().toISOString().split('T')[0]}.png`
      await downloadVictoryImage(dataUrl, fileName)

      reachGoal(GOALS.COMPLETION_SHARE_SUCCESS, {
        format: shareFormat.value,
        method: 'save'
      })

      statusMessage.value = t('home.loggedIn.completionDialog.desktopCoach')
      await awardVictorySparks()
      finishSuccessAndClose(1400)
    } catch (error) {
      console.error('Save failed', error)
      shareError.value = t('home.loggedIn.completionDialog.shareUnavailable')
    } finally {
      savingImage.value = false
    }
  }

  async function copyCaption(selectedTasks = null) {
    copyingCaption.value = true
    shareError.value = ''

    const tasksToUse = Array.isArray(selectedTasks)
      ? selectedTasks
      : selectedShareTasks.value.filter((task) => task.selected !== false)

    try {
      const caption = buildShareCaption(tasksToUse)
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard unavailable')
      }
      await navigator.clipboard.writeText(caption)
      statusMessage.value = t('home.loggedIn.completionDialog.captionCopied')
    } catch (error) {
      console.warn('Copy caption failed', error)
      shareError.value = t('home.loggedIn.completionDialog.copyFailed')
    } finally {
      copyingCaption.value = false
    }
  }

  /** @deprecated Use shareVictory — kept for HomeLoggedIn event wiring during transition */
  async function generateCompletionImage(selectedTasks = null) {
    return shareVictory(selectedTasks)
  }

  watch(showCompletionDialog, (open) => {
    if (open) {
      shareDialogPinned.value = true
      shareError.value = ''
      statusMessage.value = ''
      sparksClaimed.value = false
      syncSelectedTasksFromDefaults()
      reachGoal(GOALS.COMPLETION_DIALOG_OPEN, { format: shareFormat.value })
      schedulePreviewPrefetch()
      return
    }

    if (prefetchTimer) {
      clearTimeout(prefetchTimer)
      prefetchTimer = null
    }
    prefetchGeneration += 1
    previewDataUrl.value = null
    prefetchedTaskKey.value = null
    preparingShare.value = false
  })

  watch(
    () => getDefaultShareTasks?.() || [],
    () => {
      if (!showCompletionDialog.value) return
      syncSelectedTasksFromDefaults()
      schedulePreviewPrefetch()
    },
    { deep: true }
  )

  watch(isAllCompleted, (val, oldVal) => {
    if (val) {
      tryAwardDailyBonusXp()

      if (oldVal === false && !hasDismissedToday()) {
        nextTick(() => {
          const completed = completedItems.value
          const total = totalItems.value
          if (total > 0 && completed === total && completed === totalItems.value && !hasDismissedToday()) {
            checkAndShowCompletionDialog()
          }
        })
      }
    } else {
      if (showCompletionDialog.value && !shareDialogPinned.value) {
        showCompletionDialog.value = false
      }
      hasShownCompletionDialog.value = false
      clearDismissalForToday()
    }
  }, { immediate: false })

  watch([completedItems, totalItems], ([completed, total], [oldCompleted, oldTotal]) => {
    if (showCompletionDialog.value && !shareDialogPinned.value) {
      if (total === 0 || completed !== total) {
        showCompletionDialog.value = false
        hasShownCompletionDialog.value = false
        clearDismissalForToday()
      }
    }

    const wasCompleted = oldTotal > 0 && oldCompleted === oldTotal
    const isNowCompleted = total > 0 && completed === total

    if (
      !wasCompleted
      && isNowCompleted
      && !isInitialDataLoading()
      && !isChecklistLoading()
      && !hasShownCompletionDialog.value
      && !hasDismissedToday()
    ) {
      setTimeout(() => {
        checkAndShowCompletionDialog()
      }, 500)
    }

    if (wasCompleted && !isNowCompleted) {
      hasShownCompletionDialog.value = false
      clearDismissalForToday()
    }
  })

  if (watchChecklistCompletedSteps) {
    watch(watchChecklistCompletedSteps, () => {
      nextTick(() => {
        if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
          checkAndShowCompletionDialog()
        }
      })
    })
  }

  return {
    showCompletionDialog,
    hasShownCompletionDialog,
    generatingImage,
    preparingShare,
    savingImage,
    copyingCaption,
    shareError,
    statusMessage,
    previewDataUrl,
    shareCaption,
    shareFormat,
    selectedShareTasks,
    sparksClaimed,
    canNativeShare,
    setSelectedTasks,
    setShareFormat,
    closeCompletionDialog,
    openCompletionShare,
    checkAndShowCompletionDialog,
    scheduleCompletionDialogCheck,
    shareVictory,
    saveImage,
    copyCaption,
    generateCompletionImage
  }
}
