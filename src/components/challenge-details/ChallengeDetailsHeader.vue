<template>
  <v-img
    :src="challenge.imageUrl"
    height="280"
    cover
    class="align-end text-white header-image"
  >
    <div class="header-actions">
      <v-btn
        v-if="isOwner && !isFinished"
        icon="mdi-pencil"
        variant="text"
        size="small"
        class="action-btn"
        @click.stop="$emit('edit')"
      />

      <v-btn
        v-if="canInviteFriends && !isFinished"
        icon="mdi-share-variant"
        variant="text"
        size="small"
        class="action-btn"
        :aria-label="t('challenges.share.share')"
        @click.stop="$emit('invite')"
      />

      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        class="action-btn"
        @click.stop="$emit('close')"
      />
    </div>

    <div class="header-overlay">
      <div class="header-content px-6 py-6">
        <div class="d-flex align-center gap-2 mb-3">
          <v-chip
            size="x-small"
            :class="isHabit ? 'chip-habit' : 'chip-result'"
            class="font-weight-black text-uppercase px-3"
          >
            {{ typeLabel }}
          </v-chip>
          <v-icon v-if="challenge.privacy === 'private'" color="rgba(255,255,255,0.5)" size="14">mdi-lock</v-icon>
        </div>

        <h2 class="text-h4 font-weight-bold mb-2 challenge-title">
          {{ challenge.title }}
        </h2>

        <div class="d-flex align-center date-info">
          <v-icon size="16" color="#4FD1C5" class="mr-2">mdi-calendar-clock</v-icon>
          <span class="text-caption opacity-80">
            {{ startLabel }} — {{ endLabel }}
          </span>
        </div>
      </div>
    </div>
  </v-img>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHALLENGE_TYPES } from '../../constants/challengeTypes'

const props = defineProps({
  challenge: { type: Object, required: true },
  isOwner: { type: Boolean, default: false },
  isFinished: { type: Boolean, default: false },
  canInviteFriends: { type: Boolean, default: false },
  typeLabel: { type: String, default: '' },
  startLabel: { type: String, default: '' },
  endLabel: { type: String, default: '' }
})

defineEmits(['edit', 'invite', 'close'])

const { t } = useI18n()
const isHabit = computed(() => props.challenge.challengeType === CHALLENGE_TYPES.HABIT)
</script>

<style scoped>
.header-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.action-btn { color: white !important; opacity: 0.9; }
.action-btn:hover { opacity: 1; background: rgba(255, 255, 255, 0.12) !important; }

.header-overlay {
  background: linear-gradient(to top, rgba(11, 13, 18, 0.92) 0%, rgba(11, 13, 18, 0.35) 55%, transparent 100%);
  width: 100%;
}

.challenge-title {
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}

.chip-habit {
  background-color: #4FD1C5 !important;
  color: #0b0d12 !important;
}
.chip-result {
  background-color: rgba(251, 191, 36, 0.9) !important;
  color: #0b0d12 !important;
}
</style>
