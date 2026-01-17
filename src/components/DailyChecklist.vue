<template>
  <div class="daily-checklist-content">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>
    <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>
    
    <div v-if="!loading && todaySteps.length === 0" class="empty-state">
      <Footprints :size="24" class="empty-state-icon" />
      {{ t('home.loggedIn.dailyChecklist.empty') }}
    </div>
    <div v-else-if="!loading" class="checklist-list">
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
          v-if="!step.done"
          class="delete-action"
          :title="t('home.loggedIn.dailyChecklist.deleteStep')"
          :aria-label="t('home.loggedIn.dailyChecklist.deleteStep')"
          @click="removeStep(index)"
        >
          <Trash2 :size="16" />
        </div>
      </div>
    </div>
    
    <div v-if="!hideAddStep" class="add-step-wrapper">
      <input
        v-model="newStepText"
        type="text"
        :placeholder="t('home.loggedIn.dailyChecklist.addStepPlaceholder')"
        class="step-input"
        @keyup.enter="addStep"
      />
      <v-btn
        :disabled="!newStepText.trim()"
        class="add-step-btn"
        icon
        @click="addStep"
      >
        <Plus :size="18" color="white" />
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineExpose } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { userService } from '../services/api'
import { Plus, Trash2, Footprints } from 'lucide-vue-next'

const props = defineProps({
  hideAddStep: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
const { mobile } = useDisplay()

const todaySteps = ref([])
const newStepText = ref('')
const loading = ref(false)
const error = ref('')

const completedSteps = computed(() => {
  return todaySteps.value.filter(step => step.done).length
})

const totalSteps = computed(() => {
  return todaySteps.value.length
})

const progressPercentage = computed(() => {
  if (totalSteps.value === 0) return 0
  return Math.round((completedSteps.value / totalSteps.value) * 100)
})

// Expose progress data to parent component
defineExpose({
  completedSteps,
  totalSteps,
  progressPercentage,
  loading
})

const loadTodaySteps = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await userService.getTodayChecklist()
    if (response.data?.checklist?.tasks) {
      // Mark steps that were already checked as locked (they already got XP)
      todaySteps.value = response.data.checklist.tasks.map(task => ({
        title: task.title,
        done: task.done || false,
        locked: task.done || false // Lock already checked items
      }))
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

const saveTodaySteps = async () => {
  try {
    const tasks = todaySteps.value.map(step => ({
      title: step.title,
      done: step.done || false
    }))
    const response = await userService.updateTodayChecklist(tasks)

    // Update stored user XP if backend returned it
    if (response?.data?.user) {
      try {
        const stored = localStorage.getItem('user')
        const storedUser = stored ? JSON.parse(stored) : {}
        const merged = { ...storedUser, ...response.data.user }
        localStorage.setItem('user', JSON.stringify(merged))
        window.dispatchEvent(new Event('auth-changed'))
      } catch {
        // ignore storage errors
      }
    }
    // Dispatch event to update streak in header
    window.dispatchEvent(new Event('checklist-updated'))
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
      await saveTodaySteps()
      // Lock the checkbox after XP is awarded
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
  margin-top: 16px;
  min-height: 150px;
}

.checklist-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid #F8F9FA;
  transition: all 0.2s ease;
}

.delete-action {
  cursor: pointer;
  color: #94A3B8; /* Приглушенный серо-голубой */
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
  color: #EF4444; /* Насыщенный красный при наведении */
  background: #FEF2F2; /* Нежно-розовая подложка */
  transform: scale(1.1);
}

/* Кастомный круглый чекбокс */
.custom-check {
  width: 22px;
  height: 22px;
  border: 2px solid #E2E8F0;
  border-radius: 50%; /* Круглый стиль */
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.custom-check.checked {
  background: #7048E8;
  border-color: #7048E8;
}

/* Текст задачи */
.step-text {
  font-size: 0.9rem;
  color: #4A5568;
  font-family: 'Plus Jakarta Sans', sans-serif;
  flex: 1;
  word-wrap: break-word;
}

.text-strike {
  text-decoration: line-through;
  color: #CBD5E0;
}

/* Поле добавления задачи */
.add-step-wrapper {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  background: #F8FAFC;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
}

.step-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  font-size: 0.85rem;
  outline: none;
  color: #1A1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.step-input::placeholder {
  color: #A0AEC0;
}

.add-step-btn {
  background: #7048E8 !important;
  color: white !important;
  border-radius: 10px !important;
  height: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  padding: 0 !important;
}

/* Пустое состояние */
.empty-state {
  color: #A0AEC0;
  font-size: 0.85rem;
  text-align: center;
  padding-top: 40px;
  font-style: italic;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-state-icon {
  color: #94A3B8;
  opacity: 0.7;
}
</style>
