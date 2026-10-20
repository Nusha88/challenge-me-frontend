<template>
  <v-card
    class="mission-template-card"
    :class="{
      'has-cover': Boolean(template.imageUrl),
      'is-weekly-ritual': isWeeklyRitual
    }"
    @click="$emit('use', template)"
  >
    <div
      v-if="template.imageUrl"
      class="card-background"
      :style="{ backgroundImage: `url(${template.imageUrl})` }"
    >
      <div class="overlay-mask"></div>
    </div>

    <div class="card-content">
      <div class="header-row">
        <span
          v-if="isWeeklyRitual"
          class="weekly-quest-badge"
        >
          {{ t('allChallenges.templates.weeklyRitualBadge') }}
        </span>
        <span v-else class="type-tag habit">{{ typeLabel }}</span>
      </div>

      <h3 class="mission-title">{{ template.title }}</h3>
      <p class="mission-description">{{ template.description }}</p>

      <div class="meta-row">
        <span class="meta-pill">
          <v-icon size="14">mdi-calendar-range</v-icon>
          {{ durationLabel }}
        </span>
        <span class="meta-pill">
          <v-icon size="14">mdi-repeat</v-icon>
          {{ frequencyLabel }}
        </span>
        <span class="meta-pill">
          <v-icon size="14">mdi-earth</v-icon>
          {{ privacyLabel }}
        </span>
      </div>

      <v-spacer />

      <div v-if="participants.length" class="participants-block" @click.stop>
        <div class="participants-label">{{ t('allChallenges.templates.participants') }}</div>
        <div class="avatar-stack">
          <button
            v-for="participant in visibleParticipants"
            :key="participant.id"
            type="button"
            class="avatar-stack-item"
            :title="participant.name"
            @click="openHero(participant.id)"
          >
            <img
              v-if="participant.avatarUrl"
              :src="participant.avatarUrl"
              :alt="participant.name"
            />
            <span v-else>{{ getInitial(participant.name) }}</span>
          </button>
          <div
            v-if="hiddenParticipantsCount > 0"
            class="avatar-stack-item avatar-stack-more"
            :title="t('challenges.moreParticipants', { count: hiddenParticipantsCount })"
          >
            +{{ hiddenParticipantsCount }}
          </div>
        </div>
      </div>

      <div class="author-row">
        <div class="author-text">
          <div class="author-label">{{ t('challenges.createdByLabel') }}</div>
          <div class="author-name">{{ t('allChallenges.templates.systemAuthor') }}</div>
        </div>
        <v-btn
          class="use-template-btn"
          size="small"
          rounded="lg"
          @click.stop="$emit('use', template)"
        >
          {{ t('allChallenges.templates.use') }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChallengeType } from '../../composables/useChallengeType'
import { useDemoMode } from '../../composables/useDemoMode'

const VISIBLE_AVATARS = 5

const props = defineProps({
  template: {
    type: Object,
    required: true
  },
  isWeeklyRitual: {
    type: Boolean,
    default: false
  },
  participants: {
    type: Array,
    default: () => []
  }
})

defineEmits(['use'])

const router = useRouter()
const { requireAuthOrPrompt } = useDemoMode()

const { t } = useI18n()
const { getMissionTypeLabel } = useChallengeType()

const typeLabel = computed(() => getMissionTypeLabel(props.template.challengeType))

const durationLabel = computed(() => {
  const days = Number(props.template.durationDays)
  const key = `${days}days`
  const optionKey = `challenges.durationOptions.${key}`
  const translated = t(optionKey)
  if (translated !== optionKey) return translated
  return t('allChallenges.templates.durationDays', { days })
})

const frequencyLabel = computed(() => {
  const frequency = props.template.frequency || 'daily'
  return t(`challenges.frequencyOptions.${frequency}`)
})

const privacyLabel = computed(() => {
  const privacy = props.template.privacy || 'public'
  return t(`challenges.privacyOptions.${privacy}`)
})

const visibleParticipants = computed(() => props.participants.slice(0, VISIBLE_AVATARS))
const hiddenParticipantsCount = computed(() => Math.max(props.participants.length - VISIBLE_AVATARS, 0))

function getInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?'
}

function openHero(userId) {
  if (!userId) return
  if (!requireAuthOrPrompt()) return
  router.push(`/heroes/${userId}`)
}
</script>

<style scoped>
.mission-template-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

.mission-template-card:hover {
  transform: translateY(-8px);
  border-color: rgba(79, 209, 197, 0.35) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
}

.mission-template-card.is-weekly-ritual {
  border-color: rgba(251, 191, 36, 0.45) !important;
}

.mission-template-card.is-weekly-ritual:hover {
  border-color: rgba(251, 191, 36, 0.75) !important;
}

.card-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.overlay-mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(13, 17, 28, 0.35) 0%,
      rgba(13, 17, 28, 0.72) 45%,
      rgba(13, 17, 28, 0.94) 100%
    );
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  min-height: 280px;
  height: 100%;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.weekly-quest-badge {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.95) 0%, rgba(249, 115, 22, 0.95) 100%);
  color: #1a1204;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.45);
  animation: weekly-flame-pulse 1.6s ease-in-out infinite;
}

@keyframes weekly-flame-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 22px rgba(251, 191, 36, 0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .weekly-quest-badge {
    animation: none;
  }
}

.type-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.type-tag.habit {
  background: rgba(79, 209, 197, 0.18);
  color: #4FD1C5;
  border: 1px solid rgba(79, 209, 197, 0.35);
  backdrop-filter: blur(8px);
}

.mission-title {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}

.mission-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.88rem;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.74rem;
  font-weight: 650;
  backdrop-filter: blur(8px);
}

.participants-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participants-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-stack-item {
  width: 32px;
  height: 32px;
  margin-left: -8px;
  border-radius: 50%;
  border: 2px solid rgba(13, 17, 28, 0.9);
  background: rgba(79, 209, 197, 0.2);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
}

.avatar-stack-item:first-child {
  margin-left: 0;
}

.avatar-stack-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-stack-more {
  background: rgba(15, 23, 42, 0.92);
  cursor: default;
  font-size: 0.62rem;
}

.author-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.author-label {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.author-name {
  margin-top: 2px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #ffffff;
}

.use-template-btn {
  flex-shrink: 0;
  background: linear-gradient(135deg, #7048E8 0%, #4FD1C5 100%) !important;
  color: #ffffff !important;
  font-weight: 800 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}
</style>
