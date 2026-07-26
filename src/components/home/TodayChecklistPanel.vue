<template>
  <v-card
    class="todays-card todays-checklist-card home-glass-card"
    :class="{ 'home-glass-card--empty': isEmpty }"
  >
    <v-card-text>
      <div class="checklist-panel">
        <div class="checklist-panel-head">
          <h3 class="home-section-title mb-0">{{ t('home.loggedIn.dailyChecklist.title') }}</h3>
          <v-btn
            v-if="unfinishedStepsCount > 0"
            size="small"
            variant="text"
            class="copy-to-tomorrow-btn"
            @click="$emit('copy-to-tomorrow')"
          >
            {{ t('home.loggedIn.dailyChecklist.copyToTomorrow') }} | {{ unfinishedStepsCount }}
          </v-btn>
        </div>
        <DailyChecklist ref="innerChecklistRef" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DailyChecklist from '../DailyChecklist.vue'

defineProps({
  unfinishedStepsCount: { type: Number, default: 0 },
  isEmpty: { type: Boolean, default: false }
})

defineEmits(['copy-to-tomorrow'])

const { t } = useI18n()
const innerChecklistRef = ref(null)

defineExpose({
  get todaySteps() {
    return innerChecklistRef.value?.todaySteps
  },
  get completedSteps() {
    return innerChecklistRef.value?.completedSteps
  },
  get totalSteps() {
    return innerChecklistRef.value?.totalSteps
  },
  get loading() {
    return innerChecklistRef.value?.loading
  },
  loadTodaySteps() {
    return innerChecklistRef.value?.loadTodaySteps?.()
  }
})
</script>

<style scoped>
.todays-checklist-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.checklist-panel {
  width: 100%;
}

.checklist-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.copy-to-tomorrow-btn {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  color: var(--home-teal, #4fd1c5) !important;
  text-transform: none !important;
  padding: 4px 12px !important;
  min-width: auto !important;
}

.copy-to-tomorrow-btn:hover {
  background: rgba(112, 72, 232, 0.1) !important;
}
</style>
