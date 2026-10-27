<template>
  <v-img
    :src="challenge.imageUrl"
    :height="coverHeight"
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
        v-if="showInviteButton"
        :icon="canInviteSquad ? 'mdi-account-plus' : 'mdi-share-variant'"
        variant="text"
        size="small"
        class="action-btn"
        :aria-label="inviteAriaLabel"
        @click.stop="$emit(canInviteSquad ? 'invite-squad' : 'invite')"
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
          <v-chip
            v-if="challenge.inviteOnly"
            size="x-small"
            class="chip-squad font-weight-black text-uppercase px-3"
          >
            {{ t('challenges.squad.title') }}
          </v-chip>
          <v-icon
            v-else-if="challenge.privacy === 'private'"
            color="rgba(255,255,255,0.5)"
            size="14"
          >
            mdi-lock
          </v-icon>
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
import { useDisplay } from 'vuetify'
import { CHALLENGE_TYPES } from '../../constants/challengeTypes'

const props = defineProps({
  challenge: { type: Object, required: true },
  isOwner: { type: Boolean, default: false },
  isFinished: { type: Boolean, default: false },
  canInviteFriends: { type: Boolean, default: false },
  canInviteSquad: { type: Boolean, default: false },
  typeLabel: { type: String, default: '' },
  startLabel: { type: String, default: '' },
  endLabel: { type: String, default: '' }
})

defineEmits(['edit', 'invite', 'invite-squad', 'close'])

const { t } = useI18n()
const { smAndDown } = useDisplay()
const isHabit = computed(() => props.challenge.challengeType === CHALLENGE_TYPES.HABIT)
const coverHeight = computed(() => (smAndDown.value ? 160 : 280))
const showInviteButton = computed(() =>
  !props.isFinished && (props.canInviteFriends || props.canInviteSquad)
)
const inviteAriaLabel = computed(() =>
  props.canInviteSquad ? t('challenges.squad.add') : t('challenges.share.share')
)
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
.chip-squad {
  background-color: rgba(112, 72, 232, 0.92) !important;
  color: #ffffff !important;
}

@media (max-width: 600px) {
  .header-content {
    padding: 12px 20px !important;
  }
  .header-content .mb-3 {
    margin-bottom: 8px !important;
  }
  .challenge-title {
    font-size: 1.2rem !important;
    line-height: 1.3;
    margin-bottom: 4px !important;
  }
}
</style>
