<template>
  <v-card
    class="main-ritual-hero mb-10"
    :class="{ 'is-joined': isJoined }"
    theme="dark"
    elevation="0"
    @click="handleCardClick"
  >
    <v-img
      :src="template?.imageUrl || fallbackImage"
      cover
      class="hero-image-wrapper align-center justify-center"
    >
      <div class="hero-overlay"></div>

      <v-card-text class="hero-content d-flex flex-column align-center text-center">
        <div class="ritual-badge-container mb-5">
          <span class="weekly-quest-badge weekly-quest-badge--hero">
            {{ t('allChallenges.templates.weeklyRitualBadge') }}
          </span>
        </div>

        <h1 class="ritual-title mb-4">
          {{ template?.title || t('challenges.defaultRitualTitle') }}
        </h1>

        <p v-if="template?.description" class="ritual-description mb-6">
          {{ template.description }}
        </p>

        <div class="actions-wrapper">
          <div
            class="social-panel d-flex align-center py-2 px-6"
            :class="{ 'social-panel--joined': isJoined }"
          >
            <div class="reward-block text-left">
              <div class="stats-count">
                <span class="sparks-icon">✦</span>
                {{ rewardSparks }}
                {{ t('navigation.sparksLabel') }}
              </div>
              <div class="stats-label">{{ t('allChallenges.weeklyRitual.boostedHint') }}</div>
            </div>

            <v-divider vertical class="mx-6 my-2" color="rgba(255,255,255,0.2)"></v-divider>

            <div class="meta-block text-left">
              <div class="stats-count">{{ durationLabel }}</div>
              <div class="stats-label">{{ t('challenges.duration') }}</div>
            </div>

            <v-divider vertical class="mx-6 my-2" color="rgba(255,255,255,0.2)"></v-divider>

            <div v-if="isJoined" class="status-block" @click.stop>
              <div class="status-personal">
                <button
                  v-if="canCheckIn"
                  type="button"
                  class="check-in-btn"
                  :disabled="checkingIn"
                  @click="$emit('check-in')"
                >
                  {{ t('allChallenges.weeklyRitual.checkIn') }}
                </button>
                <p v-else class="in-game-status">
                  {{ t('allChallenges.weeklyRitual.inGame', { current: currentDay, total: totalDays }) }}
                </p>
              </div>

              <div class="status-rule" aria-hidden="true"></div>

              <div class="status-social">
                <p class="together-text">
                  {{ togetherLabel }}
                </p>
                <div v-if="visibleCompanions.length" class="avatar-stack">
                  <button
                    v-for="companion in visibleCompanions"
                    :key="companion.id"
                    type="button"
                    class="avatar-stack-item"
                    :title="companion.name"
                    @click="$emit('open-hero', companion.id)"
                  >
                    <img
                      v-if="companion.avatarUrl"
                      :src="companion.avatarUrl"
                      :alt="companion.name"
                    />
                    <span v-else>{{ getInitial(companion.name) }}</span>
                  </button>
                  <div
                    v-if="hiddenCompanionsCount > 0"
                    class="avatar-stack-item avatar-stack-more"
                    :title="t('challenges.moreParticipants', { count: hiddenCompanionsCount })"
                  >
                    +{{ hiddenCompanionsCount }}
                  </div>
                </div>
              </div>
            </div>

            <v-btn
              v-else
              color="teal-accent-3"
              height="54"
              rounded="xl"
              class="join-btn px-8"
              @click.stop="handleUse"
            >
              {{ t('allChallenges.weeklyRitual.accept') }}
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-img>
  </v-card>
</template>

<style scoped>
.main-ritual-hero {
  height: 480px !important;
  border-radius: 32px !important;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.main-ritual-hero.is-joined {
  height: 540px !important;
}

.main-ritual-hero:hover {
  transform: scale(1.01);
}

.hero-image-wrapper {
  height: 100%;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 900px !important;
}

.ritual-badge-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.weekly-quest-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.95) 0%, rgba(249, 115, 22, 0.95) 100%);
  color: #1a1204;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.5);
  animation: weekly-flame-pulse 1.6s ease-in-out infinite;
}

@keyframes weekly-flame-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.4);
  }
  50% {
    transform: scale(1.06);
    box-shadow: 0 0 26px rgba(251, 191, 36, 0.85);
  }
}

.ritual-subtitle {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: 700;
  color: #4FD1C5;
}

.ritual-title {
  font-size: 3.2rem !important;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -2px !important;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.ritual-description {
  max-width: 640px;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.05rem;
  line-height: 1.45;
  font-weight: 500;
}

.social-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 60px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.stats-count {
  font-weight: 800;
  font-size: 16px;
  color: #fff;
}

.sparks-icon {
  color: #FBBF24;
  margin-right: 4px;
}

.stats-label {
  font-size: 11px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.join-btn {
  font-weight: 900 !important;
  font-size: 16px !important;
  letter-spacing: 0;
  white-space: nowrap;
  color: #000 !important;
  box-shadow: 0 10px 25px rgba(20, 255, 236, 0.3) !important;
  transition: all 0.3s ease;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(20, 255, 236, 0.5) !important;
}

.social-panel--joined {
  border-radius: 28px;
  gap: 8px;
}

.status-block {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  text-align: left;
}

.status-personal,
.status-social {
  min-width: 0;
}

.status-rule {
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.16);
}

.in-game-status,
.together-text {
  margin: 0;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.3;
  color: #fff;
}

.together-text {
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  margin-bottom: 8px;
}

.check-in-btn {
  appearance: none;
  border: 1px solid rgba(74, 222, 128, 0.45);
  background: rgba(34, 197, 94, 0.18);
  color: #d1fae5;
  font: inherit;
  font-weight: 800;
  font-size: 14px;
  line-height: 1.2;
  padding: 12px 16px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
}

.check-in-btn:disabled {
  opacity: 0.6;
  cursor: wait;
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

@media (prefers-reduced-motion: reduce) {
  .weekly-quest-badge {
    animation: none;
  }
}

@media (max-width: 960px) {
  .ritual-title { font-size: 2.4rem !important; }
  .social-panel { flex-wrap: wrap; border-radius: 24px; justify-content: center; }
  .status-block { width: 100%; justify-content: space-between; }
}

@media (max-width: 600px) {
  .main-ritual-hero,
  .main-ritual-hero.is-joined { height: auto !important; min-height: 360px; }
  .ritual-title { font-size: 1.6rem !important; letter-spacing: -1px !important; }
  .ritual-description { font-size: 0.9rem; }
  .social-panel {
    padding: 12px !important;
    flex-direction: column;
    width: 100%;
    text-align: center;
  }
  .reward-block,
  .meta-block { text-align: center !important; }
  .v-divider { display: none; }
  .join-btn { width: 100%; }
  .status-block {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }
  .status-rule {
    width: 48px;
    height: 1px;
  }
  .check-in-btn { width: 100%; }
  .together-text { margin-bottom: 10px; }
  .avatar-stack { justify-content: center; }
}
</style>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  template: { type: Object, default: null },
  rewardSparks: { type: Number, default: 150 },
  isJoined: { type: Boolean, default: false },
  currentDay: { type: Number, default: 0 },
  totalDays: { type: Number, default: 0 },
  canCheckIn: { type: Boolean, default: false },
  checkingIn: { type: Boolean, default: false },
  companionsCount: { type: Number, default: 0 },
  visibleCompanions: { type: Array, default: () => [] },
  hiddenCompanionsCount: { type: Number, default: 0 }
})

const emit = defineEmits(['use', 'check-in', 'open', 'open-hero'])
const { t } = useI18n()

const togetherLabel = computed(() => {
  const count = Number(props.companionsCount || 0)
  return t('allChallenges.weeklyRitual.together', {
    count,
    heroes: t('allChallenges.weeklyRitual.togetherHeroes', count)
  })
})

const fallbackImage = 'https://images.unsplash.com/photo-149485981460c-3834b3a25b5c?auto=format&fit=crop&q=80&w=1200'

const durationLabel = computed(() => {
  const days = Number(props.template?.durationDays)
  if (!days) return ''
  const optionKey = `challenges.durationOptions.${days}days`
  const translated = t(optionKey)
  if (translated !== optionKey) return translated
  return t('allChallenges.templates.durationDays', { days })
})

function getInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?'
}

function handleUse() {
  if (props.template) emit('use', props.template)
}

function handleCardClick() {
  if (props.isJoined) {
    emit('open')
    return
  }
  handleUse()
}
</script>
