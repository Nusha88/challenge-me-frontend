import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { userService } from '../services/api'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { generateImage } from '../utils/imageGenerator'

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

export function useCompletionCelebration({
  isAllCompleted,
  completedItems,
  totalItems,
  isInitialDataLoading,
  isChecklistLoading,
  getCompletionImageData,
  watchChecklistCompletedSteps
}) {
  const { t, locale } = useI18n()
  const userStore = useUserStore()
  const { applyXpAwardResponse } = useXpAwardFeedback()

  const showCompletionDialog = ref(false)
  const hasShownCompletionDialog = ref(false)
  const generatingImage = ref(false)

  const shouldShowCompletionDialog = computed(() => {
    return showCompletionDialog.value
      && isAllCompleted.value
      && completedItems.value === totalItems.value
      && totalItems.value > 0
  })

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
    dismissDialogToday()
    showCompletionDialog.value = false
    hasShownCompletionDialog.value = true
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

  async function generateCompletionImage() {
    dismissDialogToday()
    showCompletionDialog.value = false
    hasShownCompletionDialog.value = true
    generatingImage.value = true

    try {
      await nextTick()

      const { userName, streakDays, challenges, doneSteps } = getCompletionImageData()

      const checklistTasks = doneSteps.length > 3
        ? [{ title: t('home.loggedIn.completionImage.completedTasksSummary', { count: doneSteps.length }), isSummary: true }]
        : doneSteps.map((step) => ({ title: step.title, done: true }))

      await generateImage({
        userName: userName || 'Hero',
        date: new Date(),
        challenges,
        checklistTasks,
        streakDays,
        locale: locale.value,
        filenamePrefix: 'ignite-victory',
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
      })
    } catch (error) {
      console.error('Generation failed', error)
    } finally {
      generatingImage.value = false
    }
  }

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
      if (showCompletionDialog.value) {
        showCompletionDialog.value = false
      }
      hasShownCompletionDialog.value = false
      clearDismissalForToday()
    }
  }, { immediate: false })

  watch([completedItems, totalItems], ([completed, total], [oldCompleted, oldTotal]) => {
    if (showCompletionDialog.value) {
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
    shouldShowCompletionDialog,
    closeCompletionDialog,
    checkAndShowCompletionDialog,
    scheduleCompletionDialogCheck,
    generateCompletionImage
  }
}
