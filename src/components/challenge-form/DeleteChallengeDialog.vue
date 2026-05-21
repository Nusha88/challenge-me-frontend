<template>
  <v-dialog
    v-model="open"
    max-width="480"
    content-class="ignite-dialog"
    transition="dialog-bottom-transition"
  >
    <v-card class="delete-card">
      <div class="danger-line"></div>

      <v-card-title class="d-flex align-center pt-6 px-6">
        <v-icon color="#FF5252" class="mr-3">mdi-alert-octagon-outline</v-icon>
        <span class="dialog-title">{{ t('challenges.deleteConfirmTitle') }}</span>
      </v-card-title>

      <v-card-text class="px-6 py-4">
        <div class="dialog-message mb-4">
          {{ t('challenges.deleteConfirmMessage') }}
        </div>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-2 rounded-xl custom-alert"
        >
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <div class="dialog-actions">
          <v-btn
            variant="text"
            class="cancel-btn"
            :disabled="loading"
            @click="open = false"
          >
            {{ t('common.cancel') }}
          </v-btn>

          <v-btn
            class="confirm-delete-btn"
            :loading="loading"
            @click="emit('confirm')"
          >
            {{ t('challenges.delete') }}
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
})

const emit = defineEmits(['confirm'])

const open = defineModel({ type: Boolean, default: false })

const { t } = useI18n()
</script>

<style scoped>
.delete-card {
  background: rgba(30, 41, 59, 0.7) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 28px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
  color: #fff !important;
  position: relative;
}

.danger-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #FF5252, transparent);
}

.dialog-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #fff;
}

.dialog-message {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
}

.dialog-actions {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.cancel-btn {
  color: rgba(255, 255, 255, 0.5) !important;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  border-radius: 12px;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
}

.confirm-delete-btn {
  color: red;
  border-radius: 14px !important;
  padding: 0 24px !important;
  height: 44px !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 4px 15px rgba(255, 82, 82, 0.2) !important;
  transition: all 0.3s ease !important;
}

.confirm-delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 82, 82, 0.4) !important;
}

.custom-alert {
  background: rgba(255, 82, 82, 0.1) !important;
  border: 1px solid rgba(255, 82, 82, 0.2) !important;
}

@media (max-width: 600px) {
  .dialog-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .dialog-actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>

<style>
.v-overlay__content.ignite-dialog {
  border-radius: 28px !important;
  overflow: hidden;
}
</style>
