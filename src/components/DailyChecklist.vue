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
import { useUserStore } from '../stores/user'
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
const userStore = useUserStore()

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
  loading,
  todaySteps // Expose steps for image generation
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

    // Update store with new user data if backend returned it
    if (response?.data?.user) {
      userStore.updateUser(response.data.user)
      window.dispatchEvent(new Event('auth-changed'))
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
  color: rgba(255, 255, 255, 0.3); /* Приглушенный плейсхолдер */
}

.add-step-btn {
  background: #7048E8 !important;
  color: white !important;
  border-radius: 10px !important;
  height: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  padding: 0 !important;
  box-shadow: 0 4px 10px rgba(112, 72, 232, 0.3) !important;
}

.add-step-btn:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

/* Пустое состояние */
.empty-state {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.85rem;
  text-align: center;
  padding-top: 40px;
  font-style: italic;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-state-icon {
  color: rgba(255, 255, 255, 0.2);
}

/* Reduce margin/padding for empty state on mobile */
@media (max-width: 959px) {
  .empty-state {
    padding-top: 20px;
    min-height: 100px;
  }
  .checklist-item {
    padding: 14px 8px; /* Чуть больше места для нажатия пальцем */
  }
}
</style>
