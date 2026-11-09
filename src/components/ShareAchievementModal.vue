<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="onModelUpdate"
  >
    <v-card class="share-modal-card" :class="{ 'share-modal-card--final': isFinal }">
      <div class="sm-header">
        <h3 class="sm-title">{{ modalTitle }}</h3>
        <v-btn icon="mdi-close" variant="text" size="small" class="sm-close" @click="close" />
      </div>

      <v-card-text class="sm-body">
        <v-textarea
          v-if="isFinal"
          v-model="reflection"
          class="sm-reflection"
          :placeholder="t('challenges.missionAccomplished.reflectionPlaceholder')"
          :hint="t('challenges.shareCard.reflectionHint')"
          persistent-hint
          variant="solo-filled"
          flat
          rows="2"
          auto-grow
          maxlength="150"
          counter
          hide-details="auto"
        />

        <ShareAchievementCard :payload="payloadWithReflection" />

        <v-btn
          v-if="isFinal"
          class="sm-done mt-2"
          block
          variant="text"
          @click="close"
        >
          {{ t('challenges.shareCard.done') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ShareAchievementCard from './ShareAchievementCard.vue'
import { createEmptyTriumphSharePayload } from '../utils/triumphSharePayload'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  payload: {
    type: Object,
    default: () => createEmptyTriumphSharePayload()
  }
})

const emit = defineEmits(['update:modelValue', 'dismiss'])

const { t } = useI18n()
const reflection = ref('')

const normalizedPayload = computed(() => ({
  ...createEmptyTriumphSharePayload(),
  ...(props.payload || {})
}))

const payloadWithReflection = computed(() => ({
  ...normalizedPayload.value,
  userText: reflection.value
}))

const isFinal = computed(() => Boolean(normalizedPayload.value.isFinal))

const modalTitle = computed(() =>
  isFinal.value
    ? t('challenges.shareCard.finalModalTitle')
    : t('challenges.shareCard.modalTitle')
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) reflection.value = String(props.payload?.userText || '')
  }
)

function close() {
  emit('update:modelValue', false)
}

function onModelUpdate(value) {
  if (!value) emit('dismiss', reflection.value.trim())
  emit('update:modelValue', value)
}
</script>

<style scoped>
.share-modal-card {
  background: var(--home-surface-hi, #16213e) !important;
  border: 1px solid var(--home-border, rgba(79, 209, 197, 0.15));
  border-radius: 20px !important;
  color: var(--home-text, #fff);
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

.sm-reflection {
  margin-bottom: 12px;
}

.sm-reflection :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 14px !important;
}

.sm-reflection :deep(textarea) {
  color: #fff !important;
}

.sm-reflection :deep(.v-messages),
.sm-reflection :deep(.v-counter) {
  color: rgba(255, 255, 255, 0.45) !important;
}

.sm-done {
  color: rgba(255, 255, 255, 0.72) !important;
  text-transform: none !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em;
}
</style>
