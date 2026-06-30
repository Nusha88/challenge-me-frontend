<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="share-modal-card" :class="{ 'share-modal-card--final': isFinal }">
      <div class="sm-header">
        <h3 class="sm-title">{{ modalTitle }}</h3>
        <v-btn icon="mdi-close" variant="text" size="small" class="sm-close" @click="close"></v-btn>
      </div>

      <v-card-text class="sm-body">
        <ShareAchievementCard
          :quest-title="questTitle"
          :step-name="stepName"
          :user-text="userText"
          :user-image="userImage"
          :user-image-data-url="userImageDataUrl"
          :user-level="userLevel"
          :user-rank-title="userRankTitle"
          :is-final="isFinal"
          :xp-earned="xpEarned"
          :sparks-earned="sparksEarned"
          :completed-steps="completedSteps"
          :total-steps="totalSteps"
          :mission-dates="missionDates"
          :mission-type="missionType"
          :completed-days="completedDays"
          :total-days="totalDays"
          :completion-tier="completionTier"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ShareAchievementCard from './ShareAchievementCard.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  questTitle: { type: String, default: '' },
  stepName: { type: String, default: '' },
  userText: { type: String, default: '' },
  userImage: { type: String, default: '' },
  userImageDataUrl: { type: String, default: '' },
  userLevel: { type: [Number, String], default: 1 },
  userRankTitle: { type: String, default: '' },
  isFinal: { type: Boolean, default: false },
  xpEarned: { type: [Number, String], default: 0 },
  sparksEarned: { type: [Number, String], default: 0 },
  completedSteps: { type: [Number, String], default: 0 },
  totalSteps: { type: [Number, String], default: 0 },
  missionDates: { type: String, default: '' },
  missionType: { type: String, default: 'quest' },
  completedDays: { type: Number, default: 0 },
  totalDays: { type: Number, default: 0 },
  completionTier: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const modalTitle = computed(() =>
  props.isFinal
    ? t('challenges.shareCard.finalModalTitle')
    : t('challenges.shareCard.modalTitle')
)

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.share-modal-card {
  background: #16213E !important;
  border: 1px solid rgba(79, 209, 197, 0.15);
  border-radius: 20px !important;
  color: #fff;
}

.share-modal-card--final {
  background: linear-gradient(165deg, #1a1030 0%, #16213e 100%) !important;
  border-color: rgba(245, 158, 11, 0.28);
}

.sm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px 4px;
}

.sm-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
}

.sm-close {
  color: rgba(255, 255, 255, 0.6) !important;
}

.sm-body {
  padding: 12px 22px 22px !important;
}
</style>
