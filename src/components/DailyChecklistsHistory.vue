<template>
  <div class="checklists-history dark-mode-journal">
    <div class="header-section text-left mb-8">
      <div class="d-flex align-center mb-2">
        <v-icon color="teal-accent-4" size="32" class="mr-3">mdi-book-open-variant</v-icon>
        <h1 class="journal-header-dark">{{ t('home.loggedIn.checklistHistory.title') }}</h1>
      </div>
      <p class="journal-subtitle-dark">{{ t('home.loggedIn.checklistHistory.subtitle') }}</p>
    </div>
    <v-progress-linear v-if="loading" indeterminate color="teal-accent-4" class="mb-4 shadow-neon"></v-progress-linear>
    <div v-if="loading" class="diary-skeleton-wrapper pa-6">
  <div class="timeline-line-skeleton"></div>

  <div v-for="n in 3" :key="n" class="timeline-item-skeleton mb-10">
    <div class="timeline-dot-skeleton"></div>

    <v-card class="skeleton-card-dark rounded-xl pa-5 ml-8">
      <v-skeleton-loader type="subtitle" class="mb-4" theme="dark"></v-skeleton-loader>
      
      <v-skeleton-loader type="list-item-avatar@2" theme="dark"></v-skeleton-loader>
      
      <v-skeleton-loader type="actions" class="mt-4" theme="dark"></v-skeleton-loader>
    </v-card>
  </div>
</div>
    
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-6 shadow-neon-red">
      {{ error }}
    </v-alert>
    
    <div v-else-if="checklists.length === 0" class="empty-journal-dark">
      <div class="empty-icon-glow">✨</div>
      <p class="empty-text-dark">{{ t('home.loggedIn.checklistHistory.empty') }}</p>
      <v-btn color="teal-accent-4" variant="outlined" rounded="pill" class="mt-4" to="/missions">
        Start First Mission
      </v-btn>
    </div>
    
    <div v-else class="journal-timeline-dark">
       <div
         v-for="(checklist, index) in checklists"
         :key="checklist._id || checklist.clientDay || checklist.date"
         class="timeline-item-dark reveal-animation"
         :class="{ 'active': isToday(checklist.date), 'future': isFuture(checklist.date) }"
         :style="{ '--i': index }"
       >
        <div class="timeline-dot-neon"></div>
        
        <div class="timeline-content">
          <div class="day-card-dark" :class="{ 'card-completed': isFull(checklist) }">
            <div class="checklist-header d-flex justify-space-between align-start mb-4">
              <h3 class="checklist-date-dark">{{ formatDate(checklist.clientDay || checklist.date) }}</h3>
              
              <v-chip 
                :color="isFull(checklist) ? 'teal-accent-4' : 'grey-darken-3'" 
                variant="flat" 
                size="x-small"
                class="font-weight-black shadow-neon-dim px-2"
              >
                {{ getCompletionText(checklist) }}
              </v-chip>
            </div>
            
            <div v-if="getChallengesForDate(checklist.clientDay || checklist.date).length > 0" class="challenges-section">
              <div
                v-for="challenge in getChallengesForDate(checklist.clientDay || checklist.date)"
                :key="challenge._id"
                class="challenge-item-dark"
                :class="{ 'completed': isChallengeCompletedOnDate(challenge, checklist.clientDay || checklist.date) }"
              >
                <div class="challenge-status-icon">
                  <v-icon 
                    :color="isChallengeCompletedOnDate(challenge, checklist.clientDay || checklist.date) ? 'teal-accent-4' : 'grey-darken-2'"
                    size="16"
                  >
                    {{ isChallengeCompletedOnDate(challenge, checklist.clientDay || checklist.date) ? 'mdi-check-decagram' : 'mdi-shield-outline' }}
                  </v-icon>
                </div>
                <span class="challenge-text-dark">{{ challenge.title }}</span>
              </div>
            </div>
            
            <v-divider 
              v-if="getChallengesForDate(checklist.clientDay || checklist.date).length > 0 && checklist.tasks?.length > 0" 
              class="my-4 border-opacity-25" 
              color="teal-accent-4"
            ></v-divider>
            
            <div v-if="checklist.tasks?.length > 0" class="tasks-list">
              <div
                v-for="(task, index) in checklist.tasks"
                :key="index"
                class="task-item-dark"
              >
                <div class="diamond-check" :class="{ 'checked': task.done }">
                  <v-icon v-if="task.done" size="10" color="black">mdi-check</v-icon>
                </div>
                
                <span class="task-text-dark" :class="{ 'completed-dim': task.done }">
                  {{ task.title }}
                </span>
              </div>
            </div>

            <div v-if="getChallengesForDate(checklist.clientDay || checklist.date).length === 0 && (!checklist.tasks || checklist.tasks.length === 0)" class="no-tasks-state-dark">
              <p class="no-tasks-text-dark">The logs are empty. No action recorded.</p>
            </div>
            
            <v-btn
              v-if="isFull(checklist)"
              block
              class="generate-art-btn-dark mt-4"
              @click="generateLegendImage(checklist)"
              :loading="generatingImage"
            >
              <v-icon left size="18" class="mr-2">mdi-auto-fix</v-icon>
              Mint Legend Card
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Base Layout */
.checklists-history {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
}

/* Typography */
.journal-header-dark {
  font-size: 2.2rem;
  font-weight: 900;
  background: linear-gradient(90deg, #4FD1C5 0%, #7048E8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
  text-transform: uppercase;
}

.journal-subtitle-dark {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5);
  border-left: 2px solid #4FD1C5;
  padding-left: 16px;
  font-style: italic;
}

/* Timeline Logic */
.journal-timeline-dark {
  position: relative;
  padding-top: 10px;
}

.journal-timeline-dark::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(to bottom, #4FD1C5 0%, rgba(79, 209, 197, 0.1) 80%, transparent 100%);
}

.timeline-item-dark {
  position: relative;
  padding-left: 32px;
  margin-bottom: 32px;
}

.timeline-dot-neon {
  position: absolute;
  left: -5px;
  top: 24px;
  width: 11px;
  height: 11px;
  background: #0B0E14;
  border: 2px solid #4FD1C5;
  transform: rotate(45deg);
  z-index: 2;
  box-shadow: 0 0 8px rgba(79, 209, 197, 0.3);
}

.active .timeline-dot-neon {
  background: #4FD1C5;
  box-shadow: 0 0 15px #4FD1C5;
  animation: pulse-neon 2s infinite;
}

/* Card Style */
.day-card-dark {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.day-card-dark:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(79, 209, 197, 0.4);
  transform: translateX(8px);
}

.checklist-date-dark {
  font-size: 1.1rem;
  font-weight: 800;
  color: #FFFFFF;
}

/* Challenges & Tasks */
.challenge-item-dark {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.challenge-status-icon {
  width: 28px;
  height: 28px;
  background: rgba(79, 209, 197, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.challenge-text-dark {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 0.95rem;
}

.completed .challenge-text-dark {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.3);
}

/* Diamond Checkboxes */
.task-item-dark {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

.diamond-check {
  width: 14px;
  height: 14px;
  border: 1.5px solid rgba(79, 209, 197, 0.5);
  transform: rotate(45deg);
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.diamond-check.checked {
  background: #4FD1C5;
  border-color: #4FD1C5;
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
}

.diamond-check .v-icon {
  transform: rotate(-45deg);
}

.task-text-dark {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
}

.completed-dim {
  text-decoration: line-through;
  opacity: 0.3;
}

/* Buttons */
.generate-art-btn-dark {
  background: linear-gradient(135deg, #4FD1C5 0%, #3B82F6 100%) !important;
  color: #000 !important;
  font-weight: 900 !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 12px;
}

/* Future State */
.future .day-card-dark {
  opacity: 0.4;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: transparent;
}

/* Animations */
.reveal-animation {
  opacity: 0;
  transform: translateY(20px);
  animation: revealJournal 0.5s ease forwards;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes revealJournal {
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-neon {
  0%, 100% { box-shadow: 0 0 5px #4FD1C5; }
  50% { box-shadow: 0 0 15px #4FD1C5; }
}

/* Mobile Optimization (430px - 480px) */
@media (max-width: 480px) {
  .checklists-history { padding: 12px; }
  .journal-header-dark { font-size: 1.5rem !important; }
  .day-card-dark { padding: 16px !important; }
  .timeline-item-dark { padding-left: 24px; }
  .challenge-text-dark, .task-text-dark { font-size: 0.85rem !important; }
  .diamond-check { width: 12px; height: 12px; margin-right: 12px; }
}
.shadow-neon-line {
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
  border-radius: 4px;
}

/* Фикс белого цвета для скелетонов, если тема не подхватилась */
:deep(.v-skeleton-loader) {
  background-color: rgba(15, 23, 42, 0.6) !important;
}

:deep(.v-skeleton-loader__bone) {
  background: rgba(255, 255, 255, 0.05) !important;
}
.diary-skeleton-wrapper {
  position: relative;
  max-width: 900px;
}

/* Вертикальная линия */
.timeline-line-skeleton {
  position: absolute;
  left: 31px; /* Выровняй точно под свою линию из скрина */
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(79, 209, 197, 0.1);
}

/* Точки на линии */
.timeline-dot-skeleton {
  position: absolute;
  left: 24px;
  width: 16px;
  height: 16px;
  background: rgba(15, 23, 42, 1);
  border: 2px solid rgba(79, 209, 197, 0.2);
  border-radius: 4px; /* У тебя на скрине они квадратные/ромбовидные */
  transform: rotate(45deg);
  z-index: 2;
}

.skeleton-card-dark {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(79, 209, 197, 0.1) !important;
}
</style>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService, challengeService } from '../services/api'
import { generateCompletionImage as generateImage } from '../utils/imageGenerator'
import IgniteLoader from './IgniteLoader.vue'

const { t, locale } = useI18n()
const checklists = ref([])
const challenges = ref([])
const loading = ref(false)
const error = ref('')
const generatingImage = ref(false)

const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user._id || user.id
}

const formatDateString = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isToday = (dateString) => {
  const date = new Date(dateString).setHours(0,0,0,0)
  const today = new Date().setHours(0,0,0,0)
  return date === today
}

const isFuture = (dateString) => {
  const date = new Date(dateString).setHours(0,0,0,0)
  const today = new Date().setHours(0,0,0,0)
  return date > today
}

const isFull = (checklist) => {
  const dateChallenges = getChallengesForDate(checklist.date)
  const completedChallenges = dateChallenges.filter(c => isChallengeCompletedOnDate(c, checklist.date)).length
  const totalChallenges = dateChallenges.length
  
  const completedTasks = checklist.tasks?.filter(t => t.done).length || 0
  const totalTasks = checklist.tasks?.length || 0
  
  const totalCompleted = completedTasks + completedChallenges
  const totalItems = totalTasks + totalChallenges
  
  if (totalItems === 0) return false
  return totalCompleted === totalItems
}

const getCompletionStatusClass = (checklist) => {
  const dateChallenges = getChallengesForDate(checklist.date)
  const totalTasks = checklist.tasks?.length || 0
  const totalChallenges = dateChallenges.length
  const totalItems = totalTasks + totalChallenges
  
  if (totalItems === 0) return 'status-empty'
  return isFull(checklist) ? 'status-complete' : 'status-progress'
}

const loadChecklists = async () => {
  loading.value = true
  error.value = ''
  try {
    const userId = getCurrentUserId()
    const [checklistResponse, challengesResponse] = await Promise.all([
      userService.getChecklistHistory(),
      userId ? challengeService.getChallengesByUser(userId, { excludePrivate: false }) : Promise.resolve({ data: { challenges: [] } })
    ])
    checklists.value = checklistResponse.data?.checklists || []
    challenges.value = challengesResponse.data?.challenges || []
  } catch (err) {
    console.error('Error loading checklist history:', err)
    error.value = err.response?.data?.message || t('home.loggedIn.checklistHistory.loadError')
    checklists.value = []
    challenges.value = []
  } finally {
    loading.value = false
  }
}

const getChallengesForDate = (dateString) => {
  const targetDate = new Date(dateString)
  targetDate.setHours(0, 0, 0, 0)
  const userId = getCurrentUserId()
  
  if (!userId || !challenges.value.length) return []
  
  return challenges.value.filter(challenge => {
    // Must be a habit challenge (only habit challenges have daily completion)
    if (challenge.challengeType !== 'habit') return false
    
    // Must have started (startDate <= targetDate)
    if (challenge.startDate) {
      const startDate = new Date(challenge.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (startDate > targetDate) return false
    }
    
    // Must not be finished before target date
    if (challenge.endDate) {
      const endDate = new Date(challenge.endDate)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < targetDate) return false
    }
    
    // Must be a participant (user must have joined the challenge)
    if (!challenge.participants || challenge.participants.length === 0) {
      return false
    }
    
    // Check if current user is a participant
    const isParticipant = challenge.participants.some(p => {
      const pUserId = p.userId?._id || p.userId || p._id
      return pUserId && pUserId.toString() === userId.toString()
    })
    
    if (!isParticipant) {
      return false
    }
    
    return true
  })
}

const isChallengeCompletedOnDate = (challenge, dateString) => {
  const userId = getCurrentUserId()
  if (!userId || !challenge.participants) return false
  
  // Find current user's participant entry
  const participant = challenge.participants.find(p => {
    const pUserId = p.userId?._id || p.userId || p._id
    return pUserId && pUserId.toString() === userId.toString()
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) {
    return false
  }
  
  // Check if target date is in completedDays
  const targetDateStr = formatDateString(dateString)
  
  return participant.completedDays.some(date => {
    if (!date) return false
    // Handle both string dates and Date objects
    let dateStr = String(date)
    // If it's a full ISO string, extract just the date part
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0]
    }
    // Ensure it's in YYYY-MM-DD format (first 10 characters)
    dateStr = dateStr.substring(0, 10)
    return dateStr === targetDateStr
  })
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
  const dateChallenges = getChallengesForDate(checklist.date)
  const completedChallenges = dateChallenges.filter(c => isChallengeCompletedOnDate(c, checklist.date)).length
  const totalChallenges = dateChallenges.length
  
  const completedTasks = checklist.tasks?.filter(t => t.done).length || 0
  const totalTasks = checklist.tasks?.length || 0
  
  const totalCompleted = completedTasks + completedChallenges
  const totalItems = totalTasks + totalChallenges
  
  if (totalItems === 0) {
    return t('home.loggedIn.checklistHistory.noTasks')
  }
  
  return `${totalCompleted}/${totalItems}`
}

// Calculate streak for a specific date
function calculateStreakForDate(targetDate) {
  const userId = getCurrentUserId()
  if (!userId) return 0
  
  // Sort checklists by date descending
  const sortedChecklists = [...checklists.value].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })
  
  // Filter for habit challenges only
  const habitChallenges = challenges.value.filter(c => c.challengeType === 'habit')
  
  // Helper function to check if a day has completed tasks
  function checkDayCompletion(date) {
    const dateStr = formatDateString(date)
    
    // Find checklist for this date
    const checklist = sortedChecklists.find(c => {
      const checklistDate = new Date(c.date)
      checklistDate.setHours(0, 0, 0, 0)
      return checklistDate.getTime() === date.getTime()
    })
    
    // Check if checklist has completed tasks
    const hasCompletedChecklistTask = checklist && checklist.tasks && checklist.tasks.length > 0
      ? checklist.tasks.some(task => task.done === true)
      : false
    
    // Check if any challenge was completed on this date
    let hasCompletedChallenge = false
    for (const challenge of habitChallenges) {
      if (!challenge.participants || challenge.participants.length === 0) continue
      
      // Find current user's participant entry
      const participant = challenge.participants.find(p => {
        const pUserId = p.userId?._id || p.userId || p._id
        return pUserId && pUserId.toString() === userId.toString()
      })
      
      if (participant && participant.completedDays && Array.isArray(participant.completedDays)) {
        const hasDate = participant.completedDays.some(completedDate => {
          if (!completedDate) return false
          let completedDateStr = String(completedDate)
          if (completedDateStr.includes('T')) {
            completedDateStr = completedDateStr.split('T')[0]
          }
          completedDateStr = completedDateStr.substring(0, 10)
          return completedDateStr === dateStr
        })
        
        if (hasDate) {
          hasCompletedChallenge = true
          break
        }
      }
    }
    
    return hasCompletedChecklistTask || hasCompletedChallenge
  }
  
  // Calculate streak starting from target date
  let streak = 0
  let currentDate = new Date(targetDate)
  currentDate.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 365; i++) {
    if (checkDayCompletion(currentDate)) {
      streak++
    } else {
      break
    }
    currentDate.setDate(currentDate.getDate() - 1)
    currentDate.setHours(0, 0, 0, 0)
  }
  
  return streak
}

async function generateLegendImage(checklist) {
  generatingImage.value = true
  try {
    await nextTick()
    
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userName = user?.name || 'Hero'
    
    // Get all challenges for the date (same format as HomeLoggedIn)
    const dateChallenges = getChallengesForDate(checklist.date)
    // Map to same format as HomeLoggedIn - include progress numbers
    const challenges = dateChallenges.map(c => {
      const userId = getCurrentUserId()
      let completedDays = 0
      
      // Find current user's participant entry to get completedDays count
      if (userId && c.participants) {
        const participant = c.participants.find(p => {
          const pUserId = p.userId?._id || p.userId || p._id
          return pUserId && pUserId.toString() === userId.toString()
        })
        if (participant && participant.completedDays && Array.isArray(participant.completedDays)) {
          completedDays = participant.completedDays.length
        }
      }
      
      // Calculate total days
      let totalDays = 0
      if (c.startDate && c.endDate) {
        try {
          const start = new Date(c.startDate)
          const end = new Date(c.endDate)
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            start.setHours(0, 0, 0, 0)
            end.setHours(0, 0, 0, 0)
            
            if (c.frequency === 'everyOtherDay') {
              let count = 0
              const current = new Date(start)
              let dayIndex = 0
              while (current <= end) {
                if (dayIndex % 2 === 0) count++
                current.setDate(current.getDate() + 1)
                dayIndex++
              }
              totalDays = count
            } else {
              const diffTime = end - start
              totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
            }
          }
        } catch {
          totalDays = 0
        }
      }
      
      return {
        title: c.title,
        completed: isChallengeCompletedOnDate(c, checklist.date),
        completedDays: completedDays,
        totalDays: totalDays
      }
    })
    
    // Get completed checklist tasks (same as HomeLoggedIn)
    const checklistTasks = (checklist.tasks || [])
      .filter(task => task.done)
      .map(task => ({ title: task.title, done: true }))
    
    // Calculate streak for this historical date
    const streakDaysValue = calculateStreakForDate(checklist.date)
    
    await generateImage({
      userName: userName,
      date: checklist.date,
      challenges: challenges, // Same format as HomeLoggedIn
      checklistTasks: checklistTasks,
      streakDays: streakDaysValue, // Calculate streak for historical date
      locale: locale.value,
      t: t, // Use translation function to match HomeLoggedIn
      includeMotivationalMessage: true, // Include motivational message to match HomeLoggedIn
      filenamePrefix: 'legend'
    })
  } catch (error) {
    console.error('Generation failed', error)
  } finally {
    generatingImage.value = false
  }
}

onMounted(() => {
  loadChecklists()
})
</script>
