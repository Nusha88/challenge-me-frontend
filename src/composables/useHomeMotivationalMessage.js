import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import motivationalMessagesEn from '../data/motivationalMessages.en.json'
import motivationalMessagesRu from '../data/motivationalMessages.ru.json'
import motivationalMessagesCompletedEn from '../data/motivationalMessagesCompleted.en.json'
import motivationalMessagesCompletedRu from '../data/motivationalMessagesCompleted.ru.json'

function dayOfYear(date = new Date()) {
  return Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
}

/**
 * Picks a stable daily motivational line from the locale-specific message banks.
 */
export function useHomeMotivationalMessage() {
  const { locale } = useI18n()

  const dailyMotivationalMessage = computed(() => {
    const messages = locale.value === 'ru' ? motivationalMessagesRu : motivationalMessagesEn
    return messages[dayOfYear() % messages.length]
  })

  const dailyMotivationalMessageCompleted = computed(() => {
    const messages =
      locale.value === 'ru' ? motivationalMessagesCompletedRu : motivationalMessagesCompletedEn
    return messages[dayOfYear() % messages.length]
  })

  return {
    dailyMotivationalMessage,
    dailyMotivationalMessageCompleted
  }
}
