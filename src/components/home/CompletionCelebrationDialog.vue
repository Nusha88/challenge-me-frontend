<template>
  <v-dialog
    :model-value="modelValue"
    max-width="450"
    persistent
    overlay-color="#1A1A2E"
    overlay-opacity="0.8"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="completion-dialog-card overflow-visible">
      <div class="glow-bg"></div>

      <v-btn
        icon
        variant="text"
        class="dialog-close-btn"
        size="small"
        @click="emit('close')"
      >
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>

      <v-card-text class="text-center pa-8 pt-12">
        <div class="completion-icon-wrapper mb-6">
          <div class="icon-circle">
            <img :src="crystalImage" alt="Crystal" class="crystal-img" />
          </div>
        </div>

        <h2 class="completion-title mb-2">
          {{ t('home.loggedIn.completionDialog.conqueredTitle') }}
        </h2>

        <p class="completion-message mb-6">
          {{ t('home.loggedIn.completionDialog.congrats', { name: displayName }) }}
        </p>

        <div v-if="localTasks.length > 0" class="task-list mb-6">
          <p class="task-list-title text-left text-caption mb-2">
            {{ t('home.loggedIn.completionDialog.chooseShare') }}
          </p>

          <v-checkbox
            v-for="task in localTasks"
            :key="task.id"
            v-model="task.selected"
            :label="task.title"
            color="#4FD1C5"
            hide-details
            density="compact"
            class="task-checkbox"
          />
        </div>

        <div class="progress-section mb-6 text-left">
          <div class="d-flex justify-space-between text-caption mb-1 progress-labels">
            <span>{{ completed }} / {{ total }} {{ t('home.loggedIn.dailyChecklist.completed') }}</span>
            <span>{{ normalizedPercentage }}%</span>
          </div>

          <v-progress-linear
            :model-value="normalizedPercentage"
            color="#4FD1C5"
            height="8"
            rounded
          />
        </div>

        <v-btn
          block
          height="56"
          class="celebration-button text-none"
          elevation="0"
          :loading="generatingImage"
          :disabled="selectedTasks.length === 0 || generatingImage"
          @click="handleGenerateImage"
        >
          {{ t('home.loggedIn.completionDialog.captureTriumph') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import crystalImage from '../../assets/crystal.png'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  generatingImage: { type: Boolean, default: false },
  userName: { type: String, default: '' },
  tasks: { type: Array, default: () => [] },
  completed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  percentage: { type: Number, default: 100 }
})

const emit = defineEmits(['update:modelValue', 'close', 'generate-image'])

const { t } = useI18n()

const localTasks = ref([])

watch(
  () => props.tasks,
  (tasks) => {
    localTasks.value = tasks.map((task, index) => ({
      id: task.id || `${task.type || 'task'}-${index}`,
      title: task.title || '',
      selected: task.selected !== false,
      type: task.type,
      payload: task.payload
    }))
  },
  { immediate: true, deep: true }
)

const selectedTasks = computed(() => {
  return localTasks.value.filter((task) => task.selected)
})

const displayName = computed(() => {
  return props.userName || t('profile.ranks.explorer')
})

const normalizedPercentage = computed(() => {
  return Math.min(100, Math.max(0, Math.round(Number(props.percentage) || 0)))
})

function handleGenerateImage() {
  emit('generate-image', selectedTasks.value)
}
</script>

<style scoped>
.completion-dialog-card {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(126, 70, 196, 0.5) !important;
  border-radius: 24px !important;
  position: relative;
  overflow: visible !important;
}

.glow-bg {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  height: 250px;
  background: radial-gradient(
    circle,
    rgba(79, 209, 197, 0.15) 0%,
    rgba(126, 70, 196, 0.1) 50%,
    transparent 70%
  );
  z-index: 0;
  pointer-events: none;
}

.completion-icon-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
}

.icon-circle {
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, #7E46C4 0%, #2D2D45 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(126, 70, 196, 0.4);
  animation: float 3s ease-in-out infinite;
}

.crystal-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.45));
}

.completion-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  text-shadow: 0 0 15px rgba(79, 209, 197, 0.2);
}

.completion-message {
  font-size: 1rem;
  color: #D1D5DB;
  line-height: 1.5;
}

.task-list {
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-height: 220px;
  overflow-y: auto;
}

.task-list-title {
  color: #A0A0A0;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.task-checkbox {
  color: #FFFFFF;
}

.task-checkbox :deep(.v-label) {
  color: #FFFFFF !important;
  font-size: 0.9rem;
  opacity: 0.95;
}

.task-checkbox :deep(.v-selection-control__input i) {
  color: rgba(79, 209, 197, 0.65) !important;
}

.progress-section {
  position: relative;
  z-index: 1;
}

.progress-labels {
  color: rgba(255, 255, 255, 0.65);
  font-weight: 700;
}

.progress-section :deep(.v-progress-linear) {
  background: rgba(255, 255, 255, 0.08) !important;
  overflow: visible !important;
}

.progress-section :deep(.v-progress-linear__determinate) {
  box-shadow: 0 0 14px rgba(79, 209, 197, 0.6);
}

.celebration-button {
  background: linear-gradient(90deg, #7E46C4 0%, #4FD1C5 100%) !important;
  color: white !important;
  border-radius: 16px !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 10px 25px rgba(126, 70, 196, 0.3) !important;
  border: none !important;
  transition: all 0.3s ease !important;
}

.celebration-button:hover:not(.v-btn--disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(79, 209, 197, 0.35) !important;
  filter: brightness(1.08);
}

.dialog-close-btn {
  position: absolute !important;
  top: 16px !important;
  right: 16px !important;
  z-index: 10 !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s ease !important;
}

.dialog-close-btn:hover {
  color: #FFFFFF !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: scale(1.1);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-circle,
  .celebration-button,
  .dialog-close-btn {
    animation: none !important;
    transition: none !important;
  }
}
</style>
