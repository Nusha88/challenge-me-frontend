<template>
  <div class="daily-checklist-content">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>
    <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>
    
    <div v-if="!loading && todaySteps.length === 0" class="empty-state" aria-hidden="true">
      <Footprints :size="20" class="empty-state-icon" />
    </div>
    <div v-else class="checklist-list">
      <div
        v-for="(step, index) in todaySteps"
        :key="index"
        class="checklist-item"
      >
        <div
          class="custom-check"
          :class="{ checked: step.done }"
          @click="updateStep(index, !step.done)"
        >
          <v-icon v-if="step.done" size="small" color="white">mdi-check</v-icon>
        </div>
        <span
          class="step-text"
          :class="{ 'text-strike': step.done }"
        >
          {{ step.title }}
        </span>
        <div
          v-if="!step.done && !isFirstDayQuestStep(step)"
          class="delete-action"
          :title="t('home.loggedIn.dailyChecklist.deleteStep')"
          :aria-label="t('home.loggedIn.dailyChecklist.deleteStep')"
          @click="removeStep(index)"
        >
          <Trash2 :size="16" />
        </div>
      </div>
    </div>
    
    <div v-if="!hideComposer" class="add-step-wrapper">
      <input
        v-model="newStepText"
        type="text"
        :placeholder="stepPlaceholder"
        class="step-input"
        @keyup.enter="addStep"
      />
      <v-btn
        :disabled="!newStepText.trim()"
        class="add-step-btn"
        variant="text"
        @click="addStep"
      >
        + {{ t('home.loggedIn.dailyChecklist.addStep') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineExpose } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { userService } from '../services/api'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import { toDateInputValue } from '../utils/dateUtils'
import { isFirstDayQuestStep } from '../utils/firstDayQuest'
import {
  getDemoChecklistForDate,
  setDemoChecklistForDate
} from '../services/demoStorage'
import {
  DEMO_CHECKLIST_TASK_XP,
  DEMO_CHECKLIST_TASK_SPARKS
} from '../constants/demo'
import { Trash2, Footprints } from 'lucide-vue-next'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'

defineProps({
  hideComposer: { type: Boolean, default: false }
})

const { t } = useI18n()
const { mobile } = useDisplay()
const userStore = useUserStore()
const demoStore = useDemoStore()
const { applyRewardResponse } = useXpAwardFeedback()
const isDemoMode = computed(() => demoStore.isDemoMode)

const todaySteps = ref([])
const newStepText = ref('')
const loading = ref(false)
const error = ref('')

const completedSteps = computed(() => {
  return todaySteps.value.filter(step => step.done).length
})

const stepPlaceholder = computed(() => {
  return todaySteps.value.length === 0
    ? t('home.loggedIn.dailyChecklist.firstStepPlaceholder')
    : t('home.loggedIn.dailyChecklist.addStepPlaceholder')
})

const totalSteps = computed(() => {
  return todaySteps.value.length
})

const progressPercentage = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round((completedSteps.value / totalSteps.value) * 100)
})

function mapTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).map((task) => ({
    title: task.title,
    done: Boolean(task.done),
    locked: Boolean(task.done)
  }))
}

function buildDemoRewardResponse() {
  return {
    data: {
      xpAward: { gained: DEMO_CHECKLIST_TASK_XP },
      sparksAward: { gained: DEMO_CHECKLIST_TASK_SPARKS }
    }
  }
}

const loadTodaySteps = async () => {
  loading.value = true
  error.value = ''
  try {
    if (isDemoMode.value) {
      todaySteps.value = mapTasks(getDemoChecklistForDate().tasks)
      return
    }

    const response = await userService.getTodayChecklist()
    if (response.data?.checklist?.tasks) {
      todaySteps.value = mapTasks(response.data.checklist.tasks)
    } else {
      todaySteps.value = []
    }
  } catch (err) {
    console.error('Error loading daily checklist:', err)
    error.value = err.response?.data?.message || t('home.loggedIn.dailyChecklist.loadError')
    todaySteps.value = []
  } finally {
    loading.value = false
  }
}

// Expose progress data and reload function to parent component
defineExpose({
  completedSteps,
  totalSteps,
  progressPercentage,
  loading,
  todaySteps, // Expose steps for image generation
  loadTodaySteps
})

const saveTodaySteps = async ({ awardDemo = false } = {}) => {
  try {
    const tasks = todaySteps.value.map((step) => ({
      title: step.title,
      done: step.done || false
    }))

    if (isDemoMode.value) {
      setDemoChecklistForDate(toDateInputValue(), tasks)
      if (awardDemo) {
        demoStore.awardChecklistTask()
        applyRewardResponse(buildDemoRewardResponse())
      }
      dispatchAppEvent(APP_EVENTS.CHECKLIST_UPDATED)
      return
    }

    const response = await userService.updateTodayChecklist(tasks)
    applyRewardResponse(response)
    dispatchAppEvent(APP_EVENTS.CHECKLIST_UPDATED)
  } catch (err) {
    console.error('Error saving daily checklist:', err)
    error.value = err.response?.data?.message || t('home.loggedIn.dailyChecklist.saveError')
  }
}

const addStep = async () => {
  if (!newStepText.value.trim()) return
  
  todaySteps.value.push({
    title: newStepText.value.trim(),
    done: false
  })
  newStepText.value = ''
  await saveTodaySteps()
}

const removeStep = async (index) => {
  todaySteps.value.splice(index, 1)
  await saveTodaySteps()
}

const updateStep = async (index, done) => {
  if (todaySteps.value[index]) {
    const wasUnchecked = !todaySteps.value[index].done && done
    todaySteps.value[index].done = done
    
    // If item was just checked (unchecked -> checked), lock it after saving
    if (wasUnchecked) {
      await saveTodaySteps({ awardDemo: true })
      todaySteps.value[index].locked = true
    } else {
      await saveTodaySteps()
    }
  }
}

onMounted(() => {
  loadTodaySteps()
})
</script>

<style scoped>
.daily-checklist-content {
  width: 100%;
}

/* Список элементов */
.checklist-list {
  margin-top: 8px;
}

.checklist-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}
.checklist-item:hover {
  background: rgba(255, 255, 255, 0.02);
}

.delete-action {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.3); /* Тусклый белый */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 4px;
  border-radius: 8px;
  flex-shrink: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-action:hover {
  color: #EF4444; 
  background: rgba(239, 68, 68, 0.1); /* Темно-красная подложка */
  transform: scale(1.1);
}

/* Кастомный круглый чекбокс */
.custom-check {
  width: 22px;
  height: 22px;
  /* Темная граница чекбокса */
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  flex-shrink: 0;
}
.custom-check:hover {
  border-color: #7048E8;
  box-shadow: 0 0 8px rgba(112, 72, 232, 0.4);
}

.custom-check.checked {
  background: #7048E8;
  border-color: #7048E8;
  box-shadow: 0 0 12px rgba(112, 72, 232, 0.4);
}

/* Текст задачи */
.step-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9); /* Почти белый текст */
  font-family: 'Plus Jakarta Sans', sans-serif;
  flex: 1;
  word-wrap: break-word;
  transition: all 0.3s ease;
}

.text-strike {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.3) !important; /* Зачеркнутый текст уходит в тень */
}

/* Поле добавления задачи (Add Step) */
.add-step-wrapper {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05); /* Темный инпут */
  padding: 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.3s ease;
}

.add-step-wrapper:focus-within {
  border-color: rgba(112, 72, 232, 0.5);
}

.step-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  font-size: 0.85rem;
  outline: none;
  color: #FFFFFF; /* Белый текст при вводе */
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.step-input::placeholder {
  color: #a8b4c8;
}

.add-step-btn {
  color: #c4b5fd !important;
  text-transform: none !important;
  font-size: 0.82rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.01em;
  height: 36px !important;
  min-width: auto !important;
  padding: 0 10px !important;
  flex-shrink: 0;
  white-space: nowrap;
}

.add-step-btn:hover:not(.v-btn--disabled) {
  color: #fff !important;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0 12px;
}

.empty-state-icon {
  color: rgba(255, 255, 255, 0.28);
}

@media (max-width: 959px) {
  .checklist-item {
    padding: 14px 8px;
  }
}
</style>
