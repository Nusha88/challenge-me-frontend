import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'

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
    timestamp: new Date(activity.timestamp),
    userName: activity.userName || t('common.unknown'),
    userAvatar: activity.userAvatar || null,
    text: t(feedKey, { mission })
  }
}

export function useWatchedActivityFeed() {
  const { t } = useI18n()
  const feedActivities = ref([])

  async function loadFeedActivities(userId) {
    if (!userId) {
      feedActivities.value = []
      return
    }

    try {
      const { data } = await challengeService.getWatchedFeed(userId)
      const activities = data?.activities || []
      feedActivities.value = activities.map((activity) => mapActivityToFeedItem(activity, t))
    } catch (error) {
      console.error('Error loading watched feed:', error)
      feedActivities.value = []
    }
  }

  return {
    feedActivities,
    loadFeedActivities
  }
}
