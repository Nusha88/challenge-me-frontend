import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'

const FEED_TTL_MS = 15000

const FEED_TYPE_I18N_KEYS = {
  comment: 'commented',
  join: 'joined',
  progress: 'progress',
  finished: 'finished'
}

function mapActivityToFeedItem(activity, t) {
  const mission = activity.challengeTitle || ''
  const i18nType = FEED_TYPE_I18N_KEYS[activity.type] || activity.type
  const feedKey = `challenges.feed.${i18nType}`

  return {
    id: activity.id,
    type: activity.type,
    timestamp: new Date(activity.timestamp),
    userId: activity.userId || null,
    userName: activity.userName || t('common.unknown'),
    userAvatar: activity.userAvatar || null,
    challengeId: activity.challengeId || null,
    commentId: activity.commentId || null,
    text: t(feedKey, { mission })
  }
}

export function useWatchedActivityFeed() {
  const { t } = useI18n()
  const feedActivities = ref([])
  const feedLoading = ref(false)
  let lastFeedAt = 0
  let lastFeedUserId = null
  let inflight = null

  async function loadFeedActivities(userId, { force = false } = {}) {
    if (!userId) {
      feedActivities.value = []
      lastFeedUserId = null
      lastFeedAt = 0
      return
    }

    const withinTtl =
      !force &&
      lastFeedUserId === userId &&
      Date.now() - lastFeedAt < FEED_TTL_MS

    if (withinTtl) return
    if (inflight && !force) return inflight

    const showLoader = feedActivities.value.length === 0
    if (showLoader) feedLoading.value = true

    inflight = (async () => {
      try {
        const { data } = await challengeService.getWatchedFeed(userId)
        const activities = data?.activities || []
        feedActivities.value = activities.map((activity) => mapActivityToFeedItem(activity, t))
        lastFeedUserId = userId
        lastFeedAt = Date.now()
      } catch (error) {
        console.error('Error loading watched feed:', error)
        if (!feedActivities.value.length) {
          feedActivities.value = []
        }
      } finally {
        feedLoading.value = false
        inflight = null
      }
    })()

    return inflight
  }

  return {
    feedActivities,
    feedLoading,
    loadFeedActivities
  }
}
