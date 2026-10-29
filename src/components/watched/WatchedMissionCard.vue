<template>
  <v-card
    class="watched-mission-card"
    variant="flat"
    @click="$emit('open', challenge)"
  >
    <v-card-text class="watched-mission-card-body">
      <div class="watched-mission-card-top">
        <div class="watched-mission-card-copy">
          <h3 class="mission-title">{{ challenge.title }}</h3>
          <div class="mission-meta">
            <button
              v-if="challenge.owner"
              type="button"
              class="author-name"
              @click.stop="$emit('navigate-user', challenge.owner)"
            >
              {{ challenge.owner?.name || t('common.unknown') }}
            </button>
            <span v-if="challenge.owner && progressPercentage > 0" class="meta-dot">·</span>
            <span v-if="progressPercentage > 0" class="progress-val">{{ progressPercentage }}%</span>
            <span v-if="lastActivity" class="meta-dot">·</span>
            <span v-if="lastActivity" class="last-activity">{{ lastActivity }}</span>
          </div>
        </div>
        <span
          class="type-chip"
          :class="challenge.challengeType === CHALLENGE_TYPES.HABIT ? 'type-chip--ritual' : 'type-chip--quest'"
        >
          {{ challenge.challengeType === CHALLENGE_TYPES.HABIT ? t('watched.ritual') : t('watched.quest') }}
        </span>
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
          size="x-small"
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
  unwatchLoading: { type: Boolean, default: false },
  lastActivity: { type: String, default: '' }
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
  border-radius: 16px !important;
  transition:
    border-color 0.25s var(--home-ease, ease),
    transform 0.25s var(--home-ease, ease);
  cursor: pointer;
}

.watched-mission-card:hover {
  border-color: var(--home-border-hi, rgba(79, 209, 197, 0.38)) !important;
}

.watched-mission-card-body {
  padding: 12px 14px 10px !important;
}

.watched-mission-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.watched-mission-card-copy {
  min-width: 0;
}

.mission-title {
  margin: 0;
  color: var(--home-text, #f1f5f9);
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.25;
}

.mission-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.72rem;
}

.author-name {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--home-teal, #4fd1c5);
  font-size: inherit;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.author-name:hover {
  text-decoration: underline;
}

.meta-dot {
  opacity: 0.6;
}

.progress-val {
  font-weight: 800;
  color: var(--home-teal, #4fd1c5);
}

.last-activity {
  color: var(--home-text-dim, #94a3b8);
}

.type-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 0.62rem;
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

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.unwatch-btn {
  color: var(--home-text-dim, #94a3b8) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  min-width: 0 !important;
  padding-inline: 4px !important;
}

.unwatch-btn:hover {
  color: #ff6b6b !important;
  background: rgba(255, 82, 82, 0.1) !important;
}

.join-btn {
  text-transform: none !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em !important;
  border-radius: 10px !important;
  color: #0d111c !important;
}
</style>
