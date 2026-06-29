<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="quest-success-card">
      <div class="qs-header">
        <div class="d-flex align-center">
          <v-icon class="qs-header-icon mr-3">mdi-flag-checkered</v-icon>
          <div>
            <h3 class="qs-title">{{ t('challenges.questSuccess.title') }}</h3>
            <p v-if="stepName" class="qs-subtitle mb-0">{{ stepName }}</p>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" class="qs-close" @click="close"></v-btn>
      </div>

      <v-card-text class="qs-body">
        <div class="qs-options">
          <button
            type="button"
            class="qs-option"
            :class="{ 'is-active': mode === 'check' }"
            @click="mode = 'check'"
          >
            <v-icon class="qs-option-icon">mdi-flash</v-icon>
            <span class="qs-option-text">{{ t('challenges.questSuccess.justCheck') }}</span>
            <span class="qs-option-reward">{{ t('challenges.questSuccess.justCheckReward') }}</span>
          </button>

          <button
            type="button"
            class="qs-option"
            :class="{ 'is-active': mode === 'report' }"
            @click="mode = 'report'"
          >
            <v-icon class="qs-option-icon">mdi-star-four-points</v-icon>
            <span class="qs-option-text">{{ t('challenges.questSuccess.addReport') }}</span>
            <span class="qs-option-reward">{{ t('challenges.questSuccess.addReportReward') }}</span>
          </button>
        </div>

        <div v-if="mode === 'report'" class="qs-composer mt-5">
          <CommentComposer
            ref="composerRef"
            v-model:text="reportText"
            v-model:image-url="reportImageUrl"
            v-model:share-to-community="shareToCommunity"
            :show-share-switch="true"
            :hide-submit="true"
            :placeholder="t('challenges.diary.placeholder')"
            :loading="loading"
            @uploading="uploadingImage = $event"
          />
        </div>
      </v-card-text>

      <div class="qs-actions">
        <v-btn
          class="qs-confirm"
          block
          size="large"
          :loading="loading"
          :disabled="confirmDisabled"
          @click="confirm"
        >
          {{ t('challenges.questSuccess.confirm') }}
        </v-btn>
        <v-btn
          variant="outlined"
          class="qs-cancel"
          block
          size="large"
          :disabled="loading"
          @click="close"
        >
          {{ t('common.cancel') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CommentComposer from './CommentComposer.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  stepName: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const { t } = useI18n()

const mode = ref('report')
const reportText = ref('')
const reportImageUrl = ref(null)
const shareToCommunity = ref(false)
const uploadingImage = ref(false)
const composerRef = ref(null)

const confirmDisabled = computed(() => {
  if (props.loading) return true
  if (mode.value === 'report') {
    if (uploadingImage.value) return true
    return !reportText.value.trim() && !reportImageUrl.value
  }
  return false
})

function resetState() {
  mode.value = 'report'
  reportText.value = ''
  reportImageUrl.value = null
  shareToCommunity.value = false
  uploadingImage.value = false
  composerRef.value?.reset()
}

watch(() => props.modelValue, (open) => {
  if (open) resetState()
})

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  if (confirmDisabled.value) return
  emit('confirm', {
    mode: mode.value,
    text: mode.value === 'report' ? reportText.value.trim() : '',
    imageUrl: mode.value === 'report' ? reportImageUrl.value : null,
    shareToCommunity: mode.value === 'report' ? shareToCommunity.value : false
  })
}
</script>

<style scoped>
.quest-success-card {
  background: #16213E !important;
  border: 1px solid rgba(79, 209, 197, 0.15);
  border-radius: 20px !important;
  color: #fff;
}

.qs-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 8px;
}

.qs-header-icon {
  color: #4FD1C5;
  font-size: 26px;
}

.qs-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.qs-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.qs-close {
  color: rgba(255, 255, 255, 0.6) !important;
}

.qs-body {
  padding: 12px 24px 8px !important;
}

.qs-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.qs-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: center;
}

.qs-option:hover {
  border-color: rgba(79, 209, 197, 0.4);
}

.qs-option.is-active {
  border-color: #4FD1C5;
  background: rgba(79, 209, 197, 0.1);
  box-shadow: 0 0 18px rgba(79, 209, 197, 0.2);
}

.qs-option-icon {
  font-size: 28px;
  color: #4FD1C5;
}

.qs-option-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
}

.qs-option-reward {
  font-size: 0.78rem;
  font-weight: 700;
  color: #FBBF24;
}

.qs-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 20px 20px;
}

.qs-actions :deep(.v-btn) {
  width: 100%;
  min-height: 46px;
  letter-spacing: 0.2px;
}

.qs-cancel {
  text-transform: none;
  color: rgba(255, 255, 255, 0.78) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  background: rgba(255, 255, 255, 0.03) !important;
}

.qs-confirm {
  background: #4FD1C5 !important;
  color: #0F172A !important;
  font-weight: 800;
  text-transform: none;
  border-radius: 12px !important;
  box-shadow: 0 4px 14px rgba(79, 209, 197, 0.35) !important;
}

.qs-confirm:disabled {
  opacity: 0.5;
}

@media (max-width: 599px) {
  .qs-options {
    grid-template-columns: 1fr;
  }
}
</style>
