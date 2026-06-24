<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="share-modal-card">
      <div class="sm-header">
        <h3 class="sm-title">{{ t('challenges.shareCard.modalTitle') }}</h3>
        <v-btn icon="mdi-close" variant="text" size="small" class="sm-close" @click="close"></v-btn>
      </div>

      <v-card-text class="sm-body">
        <ShareAchievementCard
          :quest-title="questTitle"
          :step-name="stepName"
          :user-text="userText"
          :user-image="userImage"
          :user-level="userLevel"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ShareAchievementCard from './ShareAchievementCard.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  questTitle: { type: String, default: '' },
  stepName: { type: String, default: '' },
  userText: { type: String, default: '' },
  userImage: { type: String, default: '' },
  userLevel: { type: [Number, String], default: 1 }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

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
