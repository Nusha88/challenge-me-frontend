<template>
  <v-card class="daily-checklist-card">
    <v-card-title class="checklist-title">
      {{ t('home.loggedIn.dailyChecklist.title') }}
    </v-card-title>
    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>
      <v-alert v-if="error" type="error" class="mb-4" density="compact">{{ error }}</v-alert>
      
      <div v-if="!loading && todaySteps.length > 0" class="progress-section mb-4">
        <div class="progress-header">
          <span class="progress-text">{{ completedSteps }} / {{ totalSteps }} {{ t('home.loggedIn.dailyChecklist.completed') }}</span>
          <span class="progress-percentage">{{ progressPercentage }}%</span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          color="primary"
          height="8"
          rounded
          class="progress-bar"
        ></v-progress-linear>
      </div>
      
      <div v-if="!loading && todaySteps.length === 0" class="empty-checklist">
        <p class="empty-text">{{ t('home.loggedIn.dailyChecklist.empty') }}</p>
      </div>
      <div v-else-if="!loading" class="steps-list">
        <div
          v-for="(step, index) in todaySteps"
          :key="index"
          class="step-item"
        >
          <v-checkbox
            v-model="step.done"
            density="compact"
            hide-details
            :aria-label="step.done ? t('home.loggedIn.dailyChecklist.markIncomplete') : t('home.loggedIn.dailyChecklist.markComplete')"
            @update:model-value="updateStep(index, $event)"
          />
          <span
            class="step-text"
            :class="{ completed: step.done }"
          >
            {{ step.title }}
          </span>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            :title="t('home.loggedIn.dailyChecklist.deleteStep')"
            :aria-label="t('home.loggedIn.dailyChecklist.deleteStep')"
            @click="removeStep(index)"
          />
        </div>
      </div>
      
      <div class="add-step-section">
        <v-text-field
          v-model="newStepText"
          :label="t('home.loggedIn.dailyChecklist.addStepPlaceholder')"
          variant="outlined"
          :density="mobile ? 'default' : 'compact'"
          hide-details
          class="add-step-input"
          @keyup.enter="addStep"
        />
        <v-btn
          color="primary"
          :disabled="!newStepText.trim()"
          @click="addStep"
        >
          {{ t('home.loggedIn.dailyChecklist.addStep') }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { userService } from '../services/api'

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

const loadTodaySteps = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await userService.getTodayChecklist()
    if (response.data?.checklist?.tasks) {
      todaySteps.value = response.data.checklist.tasks.map(task => ({
        title: task.title,
        done: task.done || false
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
    await userService.updateTodayChecklist(tasks)
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
    todaySteps.value[index].done = done
    await saveTodaySteps()
  }
}

onMounted(() => {
  loadTodaySteps()
})
</script>

<style scoped>
.daily-checklist-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: linear-gradient(to right, #e3f2fd, #fce4ec) !important;
  border-left: 4px solid #42a5f5;
  box-shadow: 0 2px 8px rgba(66, 165, 245, 0.2) !important;
}

.checklist-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  padding-bottom: 0.5em;
}

@media (min-width: 600px) {
  .checklist-title {
    font-size: 1.5rem;
  }
}

.empty-checklist {
  text-align: center;
  padding: 2em 1em;
}

.empty-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.95rem;
  margin: 0;
}

.progress-section {
  padding: 0.75em;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5em;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
}

.progress-percentage {
  font-size: 0.9rem;
  font-weight: 600;
  color: #42a5f5;
}

.progress-bar {
  border-radius: 4px;
  overflow: hidden;
}

@media (min-width: 600px) {
  .progress-text,
  .progress-percentage {
    font-size: 1rem;
  }
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  margin-bottom: 1.5em;
  min-height: 60px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.5em;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.step-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.step-item .v-btn {
  flex-shrink: 0;
  min-width: auto;
  width: auto;
  height: auto;
  padding: 0.25em;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.step-item:hover .v-btn {
  opacity: 1;
}

.step-text {
  flex: 1;
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.87);
  word-wrap: break-word;
  transition: all 0.2s;
}

.step-text.completed {
  text-decoration: line-through;
  color: rgba(0, 0, 0, 0.5);
}

.add-step-section {
  display: flex;
  gap: 0.75em;
  align-items: flex-start;
  margin-top: 1em;
  padding-top: 1em;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.add-step-input {
  flex: 1;
}

.add-step-input :deep(.v-field) {
  min-height: 48px;
}

.add-step-input :deep(.v-field__input) {
  min-height: 48px;
  font-size: 1rem;
}

@media (max-width: 600px) {
  .add-step-section {
    flex-direction: column;
    gap: 1em;
  }
  
  .add-step-input {
    width: 100%;
  }
  
  .add-step-section .v-btn {
    width: 100%;
    height: 48px;
    font-size: 1rem;
  }

  .add-step-input :deep(.v-field) {
    min-height: 56px;
    width: 100%;
  }

  .add-step-input :deep(.v-field__input) {
    min-height: 56px;
    font-size: 1.1rem;
    padding: 12px 16px;
    width: 100%;
  }

  .add-step-input :deep(.v-label) {
    font-size: 1rem;
  }
}
</style>
