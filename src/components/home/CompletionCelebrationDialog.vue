<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    persistent
    scrollable
    :retain-focus="false"
    overlay-color="#0b0d12"
    overlay-opacity="0.82"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="completion-dialog-card">
      <div class="glow-bg" aria-hidden="true"></div>

      <v-btn
        icon
        variant="text"
        class="dialog-close-btn"
        size="small"
        :aria-label="t('home.loggedIn.completionDialog.close')"
        @click="emit('close')"
      >
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>

      <v-card-text class="completion-body pa-6 pt-10">
        <header class="celebrate-strip text-center mb-4">
          <div class="ember-row">
            <img
              :src="crystalImage"
              :alt="t('home.loggedIn.crystalAlt')"
              class="crystal-mini"
              width="48"
              height="48"
              decoding="async"
            />
            <span v-if="streakDays" class="streak-ember">🔥 {{ streakDays }}</span>
          </div>
          <h2 class="completion-title">
            {{ t('home.loggedIn.completionDialog.conqueredTitle') }}
          </h2>
          <p class="completion-message">
            {{ t('home.loggedIn.completionDialog.congrats', { name: displayName }) }}
          </p>
          <p class="sparks-hint">
            {{ t('home.loggedIn.completionDialog.sparksHint') }}
          </p>
        </header>

        <div class="preview-frame is-story">
          <div v-if="preparingShare && !previewDataUrl" class="preview-skeleton" aria-hidden="true">
            <div class="skel-block skel-badge"></div>
            <div class="skel-block skel-title"></div>
            <div class="skel-block skel-line"></div>
            <div class="skel-block skel-card"></div>
          </div>
          <img
            v-else-if="previewDataUrl"
            :src="previewDataUrl"
            :alt="t('home.loggedIn.completionDialog.previewAlt')"
            class="preview-img"
          />
          <div v-else class="preview-empty">
            {{ t('home.loggedIn.completionDialog.previewEmpty') }}
          </div>
          <div v-if="preparingShare && previewDataUrl" class="preview-refreshing">
            <v-progress-circular indeterminate size="22" width="2" color="#4FD1C5" />
          </div>
        </div>

        <v-btn
          block
          height="52"
          class="share-primary text-none"
          elevation="0"
          :loading="sharing"
          :disabled="!canAct || sharing"
          @click="emit('share')"
        >
          <v-icon start size="20">mdi-share-variant</v-icon>
          {{ t('home.loggedIn.completionDialog.shareWin') }}
        </v-btn>

        <v-btn
          block
          class="secondary-btn text-none"
          variant="outlined"
          height="44"
          :loading="saving"
          :disabled="!canAct || saving || sharing"
          @click="emit('save')"
        >
          <v-icon start size="18">mdi-download</v-icon>
          {{ t('home.loggedIn.completionDialog.saveImage') }}
        </v-btn>

        <p v-if="statusMessage" class="status-msg" :class="{ success: sparksClaimed }">
          {{ statusMessage }}
        </p>
        <p v-if="shareError" class="share-error">
          {{ shareError }}
        </p>

        <button type="button" class="later-link" @click="emit('close')">
          {{ t('home.loggedIn.completionDialog.close') }}
        </button>

        <details class="customize" :open="customizeOpen" @toggle="onCustomizeToggle">
          <summary class="customize-summary">
            {{ t('home.loggedIn.completionDialog.customize') }}
          </summary>
          <div v-if="localTasks.length > 0" class="task-list">
            <v-checkbox
              v-for="task in localTasks"
              :key="task.id"
              v-model="task.selected"
              :label="task.title"
              color="#4FD1C5"
              hide-details
              density="compact"
              class="task-checkbox"
              @update:model-value="emitSelection"
            />
          </div>
          <p v-else class="preview-empty customize-empty">
            {{ t('home.loggedIn.completionDialog.previewEmpty') }}
          </p>
        </details>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import crystalImage from '../../assets/home/crystal-320.webp'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  preparingShare: { type: Boolean, default: false },
  sharing: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  shareError: { type: String, default: '' },
  statusMessage: { type: String, default: '' },
  sparksClaimed: { type: Boolean, default: false },
  previewDataUrl: { type: String, default: null },
  userName: { type: String, default: '' },
  streakDays: { type: Number, default: null },
  tasks: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'update:modelValue',
  'close',
  'share',
  'save',
  'update:selected-tasks'
])

const { t } = useI18n()
const localTasks = ref([])
const customizeOpen = ref(false)

watch(
  () => props.tasks,
  (tasks) => {
    localTasks.value = (tasks || []).map((task, index) => ({
      id: task.id || `${task.type || 'task'}-${index}`,
      title: task.title || '',
      selected: task.selected !== false,
      type: task.type,
      payload: task.payload
    }))
  },
  { immediate: true, deep: true }
)

const selectedTasks = computed(() => localTasks.value.filter((task) => task.selected))

const canAct = computed(() => selectedTasks.value.length > 0)

const displayName = computed(() => props.userName || t('profile.ranks.explorer'))

function emitSelection() {
  emit('update:selected-tasks', localTasks.value.map((task) => ({ ...task })))
}

function onCustomizeToggle(event) {
  customizeOpen.value = event.target.open
}
</script>

<style scoped>
.completion-dialog-card {
  background: rgba(15, 18, 28, 0.96) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(126, 70, 196, 0.45) !important;
  border-radius: 24px !important;
  position: relative;
  max-height: min(92vh, 820px);
  overflow: hidden;
}

.glow-bg {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 240px;
  background: radial-gradient(
    circle,
    rgba(79, 209, 197, 0.16) 0%,
    rgba(126, 70, 196, 0.12) 45%,
    transparent 70%
  );
  z-index: 0;
  pointer-events: none;
}

.completion-body {
  position: relative;
  z-index: 1;
  max-height: min(92vh, 820px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.celebrate-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ember-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.crystal-mini {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.45));
  animation: float 3s ease-in-out infinite;
}

.streak-ember {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(79, 209, 197, 0.25), rgba(166, 46, 232, 0.35));
  border: 1px solid rgba(79, 209, 197, 0.35);
  font-weight: 800;
  font-size: 0.9rem;
  color: #fff;
}

.completion-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  text-shadow: 0 0 15px rgba(79, 209, 197, 0.2);
}

.completion-message {
  font-size: 0.95rem;
  color: #d1d5db;
  line-height: 1.4;
  margin: 0;
}

.sparks-hint {
  font-size: 0.8rem;
  color: rgba(79, 209, 197, 0.9);
  margin: 2px 0 0;
  font-weight: 600;
}

.preview-frame {
  position: relative;
  width: min(100%, 220px);
  margin: 0 auto 18px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #0b0d12;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.preview-frame.is-story {
  aspect-ratio: 9 / 16;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-skeleton {
  position: absolute;
  inset: 0;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skel-block {
  border-radius: 10px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.06)
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.skel-badge {
  width: 48%;
  height: 18px;
}

.skel-title {
  width: 86%;
  height: 28px;
}

.skel-line {
  width: 62%;
  height: 16px;
}

.skel-card {
  flex: 1;
  margin-top: 8px;
  min-height: 80px;
}

.preview-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.85rem;
}

.preview-refreshing {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(11, 13, 18, 0.7);
  display: grid;
  place-items: center;
}

.share-primary {
  background: linear-gradient(90deg, #7e46c4 0%, #4fd1c5 100%) !important;
  color: white !important;
  border-radius: 14px !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 25px rgba(126, 70, 196, 0.3) !important;
  margin-bottom: 10px;
}

.share-primary:hover:not(.v-btn--disabled) {
  filter: brightness(1.06);
}

.secondary-btn {
  border-color: rgba(79, 209, 197, 0.45) !important;
  color: #e5e7eb !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
  margin-bottom: 8px;
}

.status-msg {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: rgba(209, 213, 219, 0.9);
  text-align: center;
  line-height: 1.4;
}

.status-msg.success {
  color: #4fd1c5;
  font-weight: 700;
}

.share-error {
  color: #fca5a5;
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: center;
  margin: 8px 0 0;
}

.later-link {
  display: block;
  width: 100%;
  margin: 10px 0 4px;
  padding: 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.later-link:hover {
  color: rgba(255, 255, 255, 0.85);
}

.customize {
  margin-top: 8px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 0 12px;
}

.customize-summary {
  cursor: pointer;
  list-style: none;
  padding: 12px 4px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.customize-summary::-webkit-details-marker {
  display: none;
}

.task-list {
  padding: 0 0 12px;
  max-height: 180px;
  overflow-y: auto;
}

.task-checkbox {
  color: #ffffff;
}

.task-checkbox :deep(.v-label) {
  color: #ffffff !important;
  font-size: 0.88rem;
  opacity: 0.95;
}

.task-checkbox :deep(.v-selection-control__input i) {
  color: rgba(79, 209, 197, 0.65) !important;
}

.customize-empty {
  position: static;
  padding: 0 0 12px;
}

.dialog-close-btn {
  position: absolute !important;
  top: 12px !important;
  right: 12px !important;
  z-index: 10 !important;
  color: rgba(255, 255, 255, 0.7) !important;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .crystal-mini,
  .skel-block,
  .share-primary {
    animation: none !important;
    transition: none !important;
  }
}
</style>
