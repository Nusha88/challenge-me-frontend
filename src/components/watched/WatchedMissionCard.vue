<template>
  <v-card
    class="watched-mission-card mb-6"
    variant="flat"
    @click="$emit('open', challenge)"
  >
    <v-card-text class="pa-6">
      <div class="d-flex justify-space-between align-start mb-4">
        <div>
          <h3 class="mission-title text-h5 font-weight-bold white--text">{{ challenge.title }}</h3>
          <div class="author-tag d-flex align-center mt-1">
            <v-icon size="14" color="teal-accent-4" class="mr-1">mdi-shield-check</v-icon>
            <span class="text-caption grey-text mr-1">{{ createdByPrefix }}</span>
            <span class="author-name text-caption font-weight-bold" @click.stop="$emit('navigate-user', challenge.owner)">
              {{ challenge.owner?.name || t('common.unknown') }}
            </span>
          </div>
        </div>
        <v-chip
          :style="{ backgroundColor: challenge.challengeType === CHALLENGE_TYPES.HABIT ? '#7048E8' : '#4FD1C5', color: '#FFFFFF' }"
          size="small"
          variant="flat"
          class="font-weight-black"
        >
          {{ challenge.challengeType === CHALLENGE_TYPES.HABIT ? t('watched.ritual') : t('watched.quest') }}
        </v-chip>
      </div>

      <div v-if="challenge.owner" class="author-progress-block mb-6">
        <div class="d-flex justify-space-between mb-2 align-center">
          <span class="text-overline grey-text">{{ t('watched.heroProgress') }}</span>
          <span class="progress-val font-weight-black text-teal-accent-4">
            {{ progressPercentage }}%
          </span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          color="teal-accent-4"
          height="10"
          rounded
          class="mission-bar"
        >
          <div class="bar-glow"></div>
        </v-progress-linear>
      </div>

      <div class="card-actions d-flex justify-space-between">
        <v-btn
          variant="text"
          color="grey-lighten-1"
          size="small"
          class="unwatch-btn"
          :loading="unwatchLoading"
          @click.stop="$emit('unwatch', challenge)"
        >
          <v-icon start size="16">mdi-eye-off-outline</v-icon>
          {{ t('watched.stopMonitoring') }}
        </v-btn>

        <v-btn
          v-if="canJoin"
          color="teal-accent-4"
          variant="flat"
          size="small"
          rounded="lg"
          class="join-btn font-weight-black px-6"
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

const createdByPrefix = computed(() => t('challenges.createdBy').split('{name}')[0])
const progressPercentage = computed(() => getOwnerProgressPercentage(props.challenge))
const canJoin = computed(() => canJoinHabitChallenge(props.challenge, props.currentUserId))
</script>

<style scoped>
.watched-mission-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  transition: all 0.3s ease;
  cursor: pointer;
}

.watched-mission-card:hover {
  border-color: rgba(79, 209, 197, 0.3) !important;
  transform: translateY(-2px);
}

.mission-title {
  color: #ffffff !important;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.grey-text {
  color: rgba(255, 255, 255, 0.5);
}

.text-overline.grey-text,
.progress-val {
  color: rgba(255, 255, 255, 0.9);
}

.author-name {
  color: #4fd1c5;
  cursor: pointer;
}

.author-name:hover {
  text-decoration: underline;
}

.mission-bar {
  position: relative;
  overflow: visible !important;
}

.bar-glow {
  position: absolute;
  inset: 0;
  box-shadow: 0 0 12px rgba(79, 209, 197, 0.4);
  border-radius: inherit;
  pointer-events: none;
}

.unwatch-btn {
  color: rgba(255, 255, 255, 0.5) !important;
  text-transform: none !important;
  font-weight: 600 !important;
}

.unwatch-btn:hover {
  color: #ff5252 !important;
  background: rgba(255, 82, 82, 0.1) !important;
}

.join-btn {
  letter-spacing: 0.05em;
  box-shadow: 0 4px 15px rgba(79, 209, 197, 0.3) !important;
}

@media (max-width: 480px) {
  .watched-mission-card {
    margin-bottom: 12px !important;
    border-radius: 16px !important;
  }

  .watched-mission-card :deep(.v-card-text) {
    padding: 12px !important;
  }

  .mission-title {
    font-size: 1.1rem !important;
  }

  .join-btn {
    height: 32px !important;
    font-size: 10px !important;
    padding: 0 12px !important;
  }

  .unwatch-btn {
    font-size: 10px !important;
    height: 28px !important;
  }
}
</style>
