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
        <v-btn icon="mdi-close" variant="text" size="small" class="sm-close" @click="close" />
      </div>

      <v-card-text class="sm-body">
        <ShareAchievementCard
          :payload="normalizedPayload"
          @invite-mission="$emit('invite-mission')"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
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

const emit = defineEmits(['update:modelValue', 'invite-mission'])

const { t } = useI18n()

const normalizedPayload = computed(() => ({
  ...createEmptyTriumphSharePayload(),
  ...(props.payload || {})
}))

const isFinal = computed(() => Boolean(normalizedPayload.value.isFinal))

const modalTitle = computed(() =>
  isFinal.value
    ? t('challenges.shareCard.finalModalTitle')
    : t('challenges.shareCard.modalTitle')
)

function close() {
  emit('update:modelValue', false)
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
</style>
