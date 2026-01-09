<template>
  <div class="checklists-history">
    <h1 class="page-title">{{ t('home.loggedIn.checklistHistory.title') }}</h1>
    
    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        
        <div v-if="!loading && checklists.length === 0" class="empty-state">
          <p class="empty-text">{{ t('home.loggedIn.checklistHistory.empty') }}</p>
        </div>
        
        <div v-else-if="!loading" class="checklists-list">
          <div
            v-for="checklist in checklists"
            :key="checklist._id || checklist.date"
            class="checklist-item"
          >
            <div class="checklist-header">
              <h3 class="checklist-date">{{ formatDate(checklist.date) }}</h3>
              <v-chip
                :color="getCompletionColor(checklist)"
                size="small"
                variant="flat"
              >
                {{ getCompletionText(checklist) }}
              </v-chip>
            </div>
            
            <div v-if="checklist.tasks && checklist.tasks.length > 0" class="tasks-list">
              <div
                v-for="(task, index) in checklist.tasks"
                :key="index"
                class="task-item"
              >
                <v-icon
                  :color="task.done ? 'success' : 'grey'"
                  size="small"
                  class="task-icon"
                >
                  {{ task.done ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
                <span
                  class="task-text"
                  :class="{ completed: task.done }"
                >
                  {{ task.title }}
                </span>
              </div>
            </div>
            <div v-else class="no-tasks">
              <p class="no-tasks-text">{{ t('home.loggedIn.checklistHistory.noTasks') }}</p>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'

const { t } = useI18n()

const checklists = ref([])
const loading = ref(false)
const error = ref('')

const loadChecklists = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await userService.getChecklistHistory()
    checklists.value = response.data?.checklists || []
  } catch (err) {
    console.error('Error loading checklist history:', err)
    error.value = err.response?.data?.message || t('home.loggedIn.checklistHistory.loadError')
    checklists.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dateToCompare = new Date(date)
  dateToCompare.setHours(0, 0, 0, 0)
  
  if (dateToCompare.getTime() === today.getTime()) {
    return t('home.loggedIn.checklistHistory.today')
  } else if (dateToCompare.getTime() === yesterday.getTime()) {
    return t('home.loggedIn.checklistHistory.yesterday')
  } else {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

const getCompletionColor = (checklist) => {
  if (!checklist.tasks || checklist.tasks.length === 0) return 'grey'
  const completedCount = checklist.tasks.filter(t => t.done).length
  const totalCount = checklist.tasks.length
  if (completedCount === totalCount) return 'success'
  if (completedCount > 0) return 'warning'
  return 'info'
}

const getCompletionText = (checklist) => {
  if (!checklist.tasks || checklist.tasks.length === 0) {
    return t('home.loggedIn.checklistHistory.noTasks')
  }
  const completedCount = checklist.tasks.filter(t => t.done).length
  const totalCount = checklist.tasks.length
  return `${completedCount}/${totalCount}`
}

onMounted(() => {
  loadChecklists()
})
</script>

<style scoped>
.checklists-history {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1em;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 1.5em;
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.empty-state {
  text-align: center;
  padding: 3em 1em;
}

.empty-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 1rem;
  margin: 0;
}

.checklists-list {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}

.checklist-item {
  padding: 1em;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.01);
}

.checklist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1em;
  padding-bottom: 0.75em;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.checklist-date {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.5em 0;
}

.task-icon {
  flex-shrink: 0;
}

.task-text {
  flex: 1;
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.87);
  word-wrap: break-word;
}

.task-text.completed {
  text-decoration: line-through;
  color: rgba(0, 0, 0, 0.5);
}

.no-tasks {
  padding: 1em 0;
  text-align: center;
}

.no-tasks-text {
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}
</style>
