<template>
  <div class="checklists-history">
    <div class="header-section">
      <h1 class="journal-header">{{ t('home.loggedIn.checklistHistory.title') }}</h1>
      <p class="journal-subtitle">{{ t('home.loggedIn.checklistHistory.subtitle') }}</p>
    </div>
    
    <div v-if="loading" class="journal-loading-container">
      <IgniteLoader :loading-text="t('home.loggedIn.checklistHistory.loading', 'Loading your legend...')" />
    </div>
    
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    
    <div v-if="!loading && checklists.length === 0" class="empty-journal">
      <div class="empty-icon">✨</div>
      <p class="empty-text">{{ t('home.loggedIn.checklistHistory.empty') }}</p>
    </div>
    
    <div v-else-if="!loading" class="journal-timeline">
       <div
         v-for="checklist in checklists"
         :key="checklist._id || checklist.clientDay || checklist.date"
         class="timeline-item"
         :class="{ 'active': isToday(checklist.date), 'future': isFuture(checklist.date) }"
       >
        <div class="timeline-dot"></div>
        
        <div class="timeline-content">
          <div class="day-card" :class="{ 'card-completed': isFull(checklist) }">
            <div class="checklist-header">
              <h3 class="checklist-date">{{ formatDate(checklist.clientDay || checklist.date) }}</h3>
              
              <div class="ignite-badge" :class="getCompletionStatusClass(checklist)">
                {{ getCompletionText(checklist) }}
              </div>
            </div>
            
            <!-- Daily Challenges -->
            <div v-if="getChallengesForDate(checklist.clientDay || checklist.date).length > 0" class="challenges-section">
              <div
                v-for="challenge in getChallengesForDate(checklist.clientDay || checklist.date)"
                :key="challenge._id"
                class="challenge-item"
                :class="{ 'completed': isChallengeCompletedOnDate(challenge, checklist.clientDay || checklist.date) }"
              >
                <div class="challenge-icon">
                  <v-icon 
                    v-if="isChallengeCompletedOnDate(challenge, checklist.clientDay || checklist.date)"
                    size="small"
                    color="#7048e8"
                  >mdi-check-circle</v-icon>
                  <v-icon 
                    v-else
                    size="small"
                    color="#7048e8"
                  >mdi-flag</v-icon>
                </div>
                <span class="challenge-text" :class="{ completed: isChallengeCompletedOnDate(challenge, checklist.clientDay || checklist.date) }">
                  {{ challenge.title }}
                </span>
              </div>
            </div>
            
            <!-- Divider between challenges and checklist -->
            <v-divider v-if="getChallengesForDate(checklist.clientDay || checklist.date).length > 0 && checklist.tasks && checklist.tasks.length > 0" class="my-4"></v-divider>
            
            <div v-if="checklist.tasks && checklist.tasks.length > 0" class="tasks-list">
              <div
                v-for="(task, index) in checklist.tasks"
                :key="index"
                class="task-item"
              >
                <div class="custom-check" :class="{ 'checked': task.done }">
                  <v-icon v-if="task.done" size="10" color="white">mdi-check</v-icon>
                </div>
                
                <span class="task-text" :class="{ completed: task.done }">
                  {{ task.title }}
                </span>
              </div>
            </div>

            <!-- Empty state: show only if no missions and no checklist -->
            <div v-if="getChallengesForDate(checklist.clientDay || checklist.date).length === 0 && (!checklist.tasks || checklist.tasks.length === 0)" class="no-tasks-state">
              <p class="no-tasks-text">The page is blank. Start your mission today.</p>
            </div>
            
            <!-- Generate Legend Card button - show when all tasks are completed -->
            <v-btn
              v-if="isFull(checklist)"
              block
              class="generate-art-btn"
              @click="generateLegendImage(checklist)"
              :loading="generatingImage"
            >
              <v-icon left>mdi-creation</v-icon>
              Generate Legend Card
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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

<style scoped>
  .checklists-history {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 2em 1em;
  }

.journal-loading-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}
  
  /* Заголовки */
  .journal-header {
    font-size: 2.8rem;
    font-weight: 800;
    letter-spacing: -1px;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #1A1A2E 0%, #7E46C4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .journal-subtitle {
  font-size: 1rem;
  font-style: italic;
  color: rgba(26, 26, 46, 0.5);
  border-left: 2px solid #F4A782; /* Делаем линию чуть тоньше */
  padding-left: 15px;
  margin-top: 10px; /* Отступ от Hero's Journal */
  margin-bottom: 40px; /* Отступ до начала таймлайна */
  font-weight: 300;
}
  
  /* Линия таймлайна */
  .journal-timeline {
    position: relative;
  }
  
  .journal-timeline::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 2px;
    height: calc(100% - 20px);
    background: linear-gradient(to bottom, #7E46C4, #F4A782, transparent);
  }
  
  /* Элемент таймлайна */
  .timeline-item {
    position: relative;
    padding-left: 40px;
    margin-bottom: 30px;
  }
  
  .timeline-dot {
    position: absolute;
    left: -7px;
    top: 24px;
    width: 16px;
    height: 16px;
    background: #fff;
    border: 2px solid #7E46C4;
    transform: rotate(45deg);
    z-index: 2;
    transition: all 0.3s ease;
  }
  
  .timeline-item.active .timeline-dot {
    background: #F4A782;
    border-color: #F4A782;
    box-shadow: 0 0 15px rgba(244, 167, 130, 0.6);
    animation: pulse-glow 2s infinite;
  }
  
  /* Стили для будущих дней */
  .timeline-item.future .day-card {
    opacity: 0.7;
    border: 1px dashed rgba(126, 70, 196, 0.3); /* Пунктир */
    background: rgba(255, 255, 255, 0.4);
  }
  
  /* Специальный стиль для будущих событий */
  .timeline-item.future .timeline-dot {
    border-color: rgba(126, 70, 196, 0.4);
    box-shadow: none;
    border-style: dashed;
    background: transparent;
  }
  
  .timeline-item.future .checklist-date {
    color: rgba(26, 26, 46, 0.4); /* Бледный заголовок */
  }
  
  /* Эффект "заблокированности" для задач */
  .timeline-item.future .custom-check {
    border-color: rgba(126, 70, 196, 0.2);
    background: rgba(126, 70, 196, 0.05);
  }
  
  .timeline-item.future .task-text {
    color: rgba(26, 26, 46, 0.3);
  }
  
  /* Бейдж для будущего дня */
  .timeline-item.future .ignite-badge {
    background: transparent;
    border: 1px solid rgba(126, 70, 196, 0.2);
    color: rgba(126, 70, 196, 0.4);
  }
  
  /* Карточка */
  .day-card {
    background: white;
    border-radius: 20px;
    padding: 24px;
    border: 1px solid rgba(126, 70, 196, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .day-card:hover {
    transform: translateX(10px);
    box-shadow: 0 10px 30px rgba(126, 70, 196, 0.08);
  }
  
  .checklist-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  /* Бейджи Ignite */
  .ignite-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 40px;
  text-align: center;
}

.status-complete {
  background: linear-gradient(135deg, #7E46C4, #9D50BB);
  color: white !important;
}

.status-progress {
  background: #F0EBFF;
  color: #7E46C4;
}
  
  /* Кастомные чекбоксы */
  .custom-check {
  width: 14px; /* Уменьшаем с 18px */
  height: 14px;
  border: 1.5px solid #7E46C4;
  transform: rotate(45deg);
  margin-right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

/* Исправляем галочку внутри */
.custom-check .v-icon {
  transform: rotate(-45deg); /* Поворачиваем иконку обратно, чтобы она стояла ровно */
  font-size: 10px !important;
}

.custom-check.checked {
  background: #7E46C4;
  border-color: #7E46C4;
}
  
  .task-text.completed {
    text-decoration: line-through;
    opacity: 0.4;
  }
  
  .task-item {
  display: flex;
  align-items: center; /* Центрируем ромб и текст по вертикали */
  padding: 6px 0;
}

  .task-text {
    font-size: 0.95rem;
    line-height: 1.2;
    color: #1A1A2E;
  }
  
  /* Challenges Section */
  .challenges-section {
    margin-bottom: 16px;
  }
  
  .challenge-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    transition: all 0.2s ease;
  }
  
  .challenge-icon {
    width: 32px;
    height: 32px;
    background: #F3F0FF;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    transition: background 0.3s ease;
  }
  
  .challenge-item.completed .challenge-icon {
    background: #E8E2FF;
  }
  
  .challenge-text {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #2D3436;
    transition: color 0.3s ease;
  }
  
  .challenge-text.completed {
    text-decoration: line-through;
    color: #94A3B8;
  }
  
  .challenge-item.completed .challenge-icon .v-icon {
    color: #94A3B8 !important;
  }
.no-tasks-state {
  padding: 10px 0;
  text-align: center;
}

.no-tasks-text {
  color: rgba(0, 0, 0, 0.4);
  font-style: italic;
  font-size: 0.9rem;
}

  @keyframes pulse-glow {
    0% { transform: rotate(45deg) scale(1); }
    50% { transform: rotate(45deg) scale(1.2); }
    100% { transform: rotate(45deg) scale(1); }
  }
  
  /* Generate Legend Card Button */
  .generate-art-btn {
    background: linear-gradient(135deg, #7E46C4 0%, #F4A782 100%) !important;
    color: white !important;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 12px;
    margin-top: 15px;
    box-shadow: 0 4px 15px rgba(126, 70, 196, 0.4);
    transition: all 0.3s ease;
  }

  .generate-art-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(244, 167, 130, 0.5);
  }

  .achievement-footer {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  </style>
