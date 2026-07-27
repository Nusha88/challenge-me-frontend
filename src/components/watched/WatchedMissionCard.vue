<template>
  <v-card
    class="watched-mission-card mb-4"
    variant="flat"
    @click="$emit('open', challenge)"
  >
    <v-card-text class="watched-mission-card-body">
      <div class="watched-mission-card-top">
        <div class="watched-mission-card-copy">
          <h3 class="mission-title">{{ challenge.title }}</h3>
          <div class="author-tag">
            <v-icon size="14" color="#4FD1C5">mdi-shield-check</v-icon>
            <span class="author-label">{{ t('challenges.createdByLabel') }}</span>
            <button
              type="button"
              class="author-name"
              @click.stop="$emit('navigate-user', challenge.owner)"
            >
              {{ challenge.owner?.name || t('common.unknown') }}
            </button>
          </div>
        </div>
        <span
          class="type-chip"
          :class="challenge.challengeType === CHALLENGE_TYPES.HABIT ? 'type-chip--ritual' : 'type-chip--quest'"
        >
          {{ challenge.challengeType === CHALLENGE_TYPES.HABIT ? t('watched.ritual') : t('watched.quest') }}
        </span>
      </div>

      <div v-if="challenge.owner" class="author-progress-block">
        <div class="progress-meta">
          <span class="progress-label">{{ t('watched.heroProgress') }}</span>
          <span class="progress-val">{{ progressPercentage }}%</span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          color="#4FD1C5"
          height="8"
          rounded
          class="mission-bar"
        />
      </div>

      <div class="card-actions">
        <v-btn
          variant="text"
          size="small"
          class="unwatch-btn"
          :loading="unwatchLoading"
          @click.stop="$emit('unwatch', challenge)"
        >
          <v-icon start size="16">mdi-eye-off-outline</v-icon>
          {{ t('watched.unfollow') }}
        </v-btn>

        <v-btn
          v-if="canJoin"
          color="#4FD1C5"
          variant="flat"
          size="small"
          class="join-btn"
          :loading="joinLoading"
          @click.stop="$emit('join', challenge)"
        >
          {{ t('watched.joinMission') }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHALLENGE_TYPES } from '../../constants/challengeTypes'
import { getOwnerProgressPercentage } from '../../utils/challengeProgress'
import { canJoinHabitChallenge } from '../../utils/challengeMembership'

const props = defineProps({
  challenge: { type: Object, required: true },
  currentUserId: { type: [String, Number], default: null },
  joinLoading: { type: Boolean, default: false },
  unwatchLoading: { type: Boolean, default: false }
})

defineEmits(['open', 'join', 'unwatch', 'navigate-user'])

const { t } = useI18n()

const progressPercentage = computed(() => getOwnerProgressPercentage(props.challenge))
const canJoin = computed(() => canJoinHabitChallenge(props.challenge, props.currentUserId))
</script>

<style scoped>
.watched-mission-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.55)) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
  border-radius: var(--home-radius, 22px) !important;
  transition:
    border-color 0.25s var(--home-ease, ease),
    transform 0.25s var(--home-ease, ease);
  cursor: pointer;
}

.watched-mission-card:hover {
  border-color: var(--home-border-hi, rgba(79, 209, 197, 0.38)) !important;
  transform: translateY(-2px);
}

.watched-mission-card-body {
  padding: clamp(14px, 2vw, 22px) !important;
}

.watched-mission-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.watched-mission-card-copy {
  min-width: 0;
}

.mission-title {
  margin: 0;
  color: var(--home-text, #f1f5f9);
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.25;
}

.author-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.author-label {
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.75rem;
}

.author-name {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--home-teal, #4fd1c5);
  font-size: 0.75rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.author-name:hover {
  text-decoration: underline;
}

.type-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
}

.type-chip--quest {
  background: var(--home-teal, #4fd1c5);
}

.type-chip--ritual {
  background: var(--home-purple, #7048e8);
}

.author-progress-block {
  margin-bottom: 16px;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--home-text-dim, #94a3b8);
}

.progress-val {
  font-weight: 800;
  color: var(--home-teal, #4fd1c5);
  font-size: 0.85rem;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.unwatch-btn {
  color: var(--home-text-dim, #94a3b8) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
}

.unwatch-btn:hover {
  color: #ff6b6b !important;
  background: rgba(255, 82, 82, 0.1) !important;
}

.join-btn {
  text-transform: none !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em !important;
  border-radius: 12px !important;
  color: #0d111c !important;
  box-shadow: var(--home-glow-teal, 0 0 16px rgba(79, 209, 197, 0.28)) !important;
}

@media (max-width: 480px) {
  .mission-title {
    font-size: 1.05rem;
  }

  .join-btn,
  .unwatch-btn {
    font-size: 0.78rem !important;
  }
}
</style>
