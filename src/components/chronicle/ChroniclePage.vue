<template>
  <div class="chronicle-page">
    <header class="chronicle-header">
      <div class="chronicle-header-title-row">
        <v-icon color="#4FD1C5" size="36" class="chronicle-header-icon">mdi-book-open-page-variant-outline</v-icon>
        <div>
          <h1 class="chronicle-title">{{ t('chronicle.title') }}</h1>
          <p class="chronicle-subtitle">{{ t('chronicle.subtitle') }}</p>
        </div>
      </div>
      <p class="chronicle-lead">{{ t('chronicle.description') }}</p>
    </header>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="errorMessage = ''"
    >
      <div class="chronicle-error-row">
        <span>{{ errorMessage }}</span>
        <v-btn
          size="small"
          variant="text"
          color="error"
          class="text-none"
          @click="loadFeed({ reset: true })"
        >
          {{ t('chronicle.retry') }}
        </v-btn>
      </div>
    </v-alert>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="#4FD1C5"
      height="4"
      class="mb-4"
    />

    <ChronicleEmptyState v-else-if="!activities.length && !errorMessage" />

    <div v-else-if="activities.length" class="chronicle-feed">
      <div
        v-for="activity in activities"
        :key="activity._id"
        class="chronicle-row"
        role="button"
        tabindex="0"
        @click="openActivity(activity)"
        @keydown.enter.prevent="openActivity(activity)"
        @keydown.space.prevent="openActivity(activity)"
      >
        <v-avatar size="40" class="chronicle-avatar">
          <v-img v-if="activity.actor?.avatarUrl" :src="activity.actor.avatarUrl" />
          <span v-else class="chronicle-initial">{{ getChronicleActorInitial(activity) }}</span>
        </v-avatar>
        <div class="chronicle-copy">
          <div class="chronicle-text">
            <b class="chronicle-user">{{ getChronicleActorName(activity) }}</b>
            {{ getChronicleEventText(activity, t) }}
          </div>
          <div class="chronicle-time">{{ formatTime(activity.createdAt) }}</div>
        </div>
        <v-btn
          class="chronicle-cheer text-none"
          size="small"
          variant="text"
          :disabled="activity.cheeredByMe || cheeringId === activity._id"
          :loading="cheeringId === activity._id"
          @click.stop="cheerActivity(activity)"
        >
          <v-icon size="16" start>mdi-fire</v-icon>
          {{ activity.cheeredByMe ? t('chronicle.cheered') : t('chronicle.cheer') }}
          <span v-if="activity.cheersCount > 0" class="chronicle-cheer-count">
            {{ activity.cheersCount }}
          </span>
        </v-btn>
      </div>

      <div v-if="nextCursor" class="chronicle-more">
        <v-btn
          class="text-none"
          variant="outlined"
          :loading="loadingMore"
          @click="loadFeed()"
        >
          {{ t('chronicle.loadMore') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ChronicleEmptyState from './ChronicleEmptyState.vue'
import { chronicleService } from '../../services/api'
import { formatActivityTime } from '../../utils/activityTime'
import {
  getChronicleActorId,
  getChronicleActorInitial,
  getChronicleActorName,
  getChronicleEventText
} from '../../utils/chronicleDisplay'
import { openMissionDetails } from '../../utils/openMissionDetails'

const { t, locale } = useI18n()
const router = useRouter()

const activities = ref([])
const nextCursor = ref(null)
const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')
const cheeringId = ref(null)

function formatTime(timestamp) {
  return formatActivityTime(timestamp, { t, locale: locale.value })
}

function openActivity(activity) {
  const challengeId = activity?.challengeId?._id || activity?.challengeId
  if (challengeId) {
    openMissionDetails({ challengeId: String(challengeId) })
    return
  }
  const actorId = getChronicleActorId(activity)
  if (actorId) router.push(`/heroes/${actorId}`)
}

async function loadFeed({ reset = false } = {}) {
  if (loading.value || loadingMore.value) return
  if (reset) {
    loading.value = true
    nextCursor.value = null
  } else {
    if (!nextCursor.value && activities.value.length) return
    loadingMore.value = true
  }

  errorMessage.value = ''
  try {
    const { data } = await chronicleService.getFeed({
      cursor: reset ? undefined : nextCursor.value
    })
    const page = data?.activities || []
    activities.value = reset ? page : [...activities.value, ...page]
    nextCursor.value = data?.nextCursor || null
  } catch (error) {
    console.error('Error loading chronicle:', error)
    errorMessage.value = t('chronicle.loadError')
    if (reset) activities.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function cheerActivity(activity) {
  if (!activity?._id || activity.cheeredByMe || cheeringId.value) return
  cheeringId.value = activity._id
  try {
    const { data } = await chronicleService.cheer(activity._id)
    const index = activities.value.findIndex((row) => row._id === activity._id)
    if (index !== -1) {
      activities.value[index] = {
        ...activities.value[index],
        ...data,
        cheeredByMe: true
      }
    }
  } catch (error) {
    console.error('Error cheering chronicle activity:', error)
  } finally {
    cheeringId.value = null
  }
}

onMounted(() => {
  loadFeed({ reset: true })
})
</script>

<style scoped>
.chronicle-page {
  width: 100%;
  max-width: 840px;
  margin: 0 auto;
  padding: 0;
  color: var(--home-text, #f1f5f9);
}

.chronicle-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.chronicle-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.chronicle-header-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.35));
}

.chronicle-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.chronicle-subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.chronicle-lead {
  margin: 0;
  max-width: 54ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}

.chronicle-error-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.chronicle-feed {
  border-radius: var(--home-radius, 22px);
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  overflow: hidden;
}

.chronicle-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.06));
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease;
}

.chronicle-row:last-of-type {
  border-bottom: none;
}

.chronicle-row:hover,
.chronicle-row:focus-visible {
  background: rgba(255, 255, 255, 0.04);
  outline: none;
}

.chronicle-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.chronicle-initial {
  font-size: 0.9rem;
  font-weight: 800;
  color: #4fd1c5;
}

.chronicle-copy {
  min-width: 0;
  flex: 1;
}

.chronicle-text {
  color: var(--home-text, #f1f5f9);
  font-size: 0.9rem;
  line-height: 1.4;
}

.chronicle-user {
  color: var(--home-teal, #4fd1c5);
  font-weight: 800;
}

.chronicle-time {
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.72rem;
  margin-top: 4px;
}

.chronicle-cheer {
  flex-shrink: 0;
  color: var(--home-gold, #fbbf24) !important;
  font-weight: 800 !important;
}

.chronicle-cheer-count {
  margin-left: 4px;
  opacity: 0.8;
}

.chronicle-more {
  display: flex;
  justify-content: center;
  padding: 14px 16px 16px;
}
</style>
