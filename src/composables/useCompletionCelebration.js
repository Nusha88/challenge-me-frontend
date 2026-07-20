import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { userService } from '../services/api'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import {
  buildVictoryImageDataUrl,
  shareVictoryImage
} from '../utils/imageGenerator'
import { openImagePreview } from '../utils/shareImage'

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

function buildTaskKey(tasks = []) {
  return tasks
    .map((task) => `${task.type}:${task.id}:${task.selected !== false ? '1' : '0'}`)
    .join('|')
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
  const shareError = ref('')
  const shareDialogPinned = ref(false)
  const prefetchedDataUrl = ref(null)
  const prefetchedTaskKey = ref(null)

  const shouldShowCompletionDialog = computed(() => {
    return showCompletionDialog.value
      && isAllCompleted.value
      && completedItems.value === totalItems.value
      && totalItems.value > 0
  })

  function buildImageOptions(tasksToUse) {
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

    return {
      userName: userName || 'Hero',
      date: new Date(),
      challenges,
      checklistTasks,
      streakDays,
      locale: locale.value,
      translations: {
        reportSuccess: t('home.loggedIn.completionImage.reportSuccess'),
        excellentWork: t('home.loggedIn.completionImage.excellentWork'),
        activeMissions: t('home.loggedIn.completionImage.activeMissions'),
        progress: t('home.loggedIn.completionImage.progress'),
        operationalLog: t('home.loggedIn.completionImage.operationalLog'),
        dailyGoalsCompleted: t('home.loggedIn.completionImage.dailyGoalsCompleted'),
        systemStatus: t('home.loggedIn.completionImage.systemStatus'),
        dayStreak: t('home.loggedIn.completionImage.dayStreak')
      }
    }
  }

  async function prefetchVictoryImage(tasksToUse) {
    if (!Array.isArray(tasksToUse) || tasksToUse.length === 0) {
      prefetchedDataUrl.value = null
      prefetchedTaskKey.value = null
      return
    }

    const taskKey = buildTaskKey(tasksToUse)
    if (prefetchedTaskKey.value === taskKey && prefetchedDataUrl.value) {
      return
    }

    preparingShare.value = true
    try {
      const dataUrl = await buildVictoryImageDataUrl(buildImageOptions(tasksToUse))
      prefetchedDataUrl.value = dataUrl
      prefetchedTaskKey.value = taskKey
    } catch (error) {
      console.warn('Victory image prefetch failed:', error)
      prefetchedDataUrl.value = null
      prefetchedTaskKey.value = null
    } finally {
      preparingShare.value = false
    }
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

  function closeCompletionDialog() {
    shareDialogPinned.value = false
    shareError.value = ''
    dismissDialogToday()
    showCompletionDialog.value = false
    hasShownCompletionDialog.value = true
  }

  function openCompletionShare() {
    clearDismissalForToday()
    shareError.value = ''
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

  async function generateCompletionImage(selectedTasks = null) {
    generatingImage.value = true
    shareError.value = ''

    try {
      const tasksToUse = Array.isArray(selectedTasks)
        ? selectedTasks
        : (getDefaultShareTasks?.() || [])

      if (tasksToUse.length === 0) {
        shareError.value = t('home.loggedIn.completionDialog.shareUnavailable')
        return
      }

      const taskKey = buildTaskKey(tasksToUse)
      const imageOptions = buildImageOptions(tasksToUse)
      const fileName = `ignite-victory-${new Date().toISOString().split('T')[0]}.png`
      const shareMeta = {
        title: 'Ignite',
        text: imageOptions.translations.reportSuccess
      }

      let dataUrl = prefetchedDataUrl.value
      if (!dataUrl || prefetchedTaskKey.value !== taskKey) {
        dataUrl = await buildVictoryImageDataUrl(imageOptions)
        prefetchedDataUrl.value = dataUrl
        prefetchedTaskKey.value = taskKey
      }

      const shareResult = await shareVictoryImage(dataUrl, fileName, shareMeta)

      if (shareResult === 'cancelled') {
        return
      }

      if (shareResult === 'unsupported') {
        const openedPreview = openImagePreview(dataUrl)
        if (!openedPreview) {
          shareError.value = t('home.loggedIn.completionDialog.shareUnavailable')
          return
        }
      }

      try {
        const response = await userService.awardManifestSparks({ type: 'victory' })
        applyRewardResponse(response)
      } catch (manifestError) {
        console.warn('Victory manifest sparks award failed', manifestError)
      }

      dismissDialogToday()
      shareDialogPinned.value = false
      showCompletionDialog.value = false
      hasShownCompletionDialog.value = true
    } catch (error) {
      console.error('Generation failed', error)
      shareError.value = t('home.loggedIn.completionDialog.shareUnavailable')
    } finally {
      generatingImage.value = false
    }
  }

  watch(showCompletionDialog, (open) => {
    if (open) {
      shareDialogPinned.value = true
      shareError.value = ''
      prefetchVictoryImage(getDefaultShareTasks?.() || [])
      return
    }

    prefetchedDataUrl.value = null
    prefetchedTaskKey.value = null
    preparingShare.value = false
  })

  watch(
    () => getDefaultShareTasks?.() || [],
    (tasks) => {
      if (!showCompletionDialog.value) return
      prefetchVictoryImage(tasks)
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
    shareError,
    shouldShowCompletionDialog,
    closeCompletionDialog,
    openCompletionShare,
    checkAndShowCompletionDialog,
    scheduleCompletionDialogCheck,
    generateCompletionImage
  }
}
