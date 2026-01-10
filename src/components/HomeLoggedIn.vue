<template>
  <div class="home-logged-in-container">
    <div class="greeting-section">
      <h1 class="greeting-title">
        {{ t('home.loggedIn.greeting', { name: userName }) }}
        <span class="wave-icon">👋</span>
      </h1>
      <p class="motivational-text">{{ t('home.loggedIn.motivational') }}</p>
    </div>
    
    <div
      v-if="streakDays > 0"
      class="streak-display-mobile d-md-none"
    >
      <i class="mdi mdi-fire"></i>
      <span>{{ streakDays }} {{ t('navigation.streakDays') }}</span>
    </div>
    
    <!-- Today's Card: Challenges + Checklist -->
    <v-card class="todays-card">
      <v-card-text>
        <!-- Combined Progress Bar -->
        <div v-if="!checklistLoading && totalItems > 0" class="combined-progress-section mb-4">
          <div class="progress-header">
            <span class="progress-text">{{ completedItems }} / {{ totalItems }} {{ t('home.loggedIn.dailyChecklist.completed') }}</span>
            <span class="progress-percentage">{{ combinedProgressPercentage }}%</span>
          </div>
          <v-progress-linear
            :model-value="combinedProgressPercentage"
            color="primary"
            height="8"
            rounded
            class="progress-bar"
          ></v-progress-linear>
        </div>
        
        <!-- Today's Challenges Section -->
        <div v-if="todaysChallenges.length > 0" class="todays-challenges-section">
          <h3 class="section-subtitle">{{ t('home.loggedIn.todaysChallenges') }}</h3>
          <div class="todays-challenges-list">
            <div
              v-for="challenge in todaysChallenges"
              :key="challenge._id"
              class="todays-challenge-item"
              :class="{ completed: isTodayCompleted(challenge) }"
              @click="navigateToChallenge(challenge)"
            >
              <v-icon 
                v-if="isTodayCompleted(challenge)"
                size="small" 
                class="mr-2 check-icon"
                color="success"
              >mdi-check-circle</v-icon>
              <v-icon 
                v-else
                size="small" 
                class="mr-2"
              >mdi-flag</v-icon>
              <span class="challenge-title" :class="{ completed: isTodayCompleted(challenge) }">{{ challenge.title }}</span>
            </div>
          </div>
        </div>
        
        <!-- Divider between sections -->
        <v-divider v-if="todaysChallenges.length > 0" class="my-4"></v-divider>
        
        <!-- Today's Checklist Section -->
        <div class="todays-checklist-section">
          <h3 class="section-subtitle">{{ t('home.loggedIn.dailyChecklist.title') }}</h3>
          <DailyChecklist ref="checklistRef" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import DailyChecklist from './DailyChecklist.vue'
import { userService, challengeService } from '../services/api'

const { t } = useI18n()
const router = useRouter()

const userName = ref('')
const streakDays = ref(0)
const challenges = ref([])
const loadingChallenges = ref(false)
const checklistRef = ref(null)
const checklistLoading = ref(false)

function readStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

function getCurrentUserId() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || parsed?._id || null
  } catch {
    return null
  }
}

function updateUser() {
  const user = readStoredUser()
  userName.value = user?.name || ''
}

async function calculateStreak() {
  const userId = getCurrentUserId()
  const isLoggedIn = !!localStorage.getItem('token')
  
  if (!userId || !isLoggedIn) {
    streakDays.value = 0
    return
  }

  try {
    // Fetch both checklist history and challenges
    const [checklistResponse, challengesResponse] = await Promise.all([
      userService.getChecklistHistory(),
      challengeService.getChallengesByUser(userId, { excludePrivate: false })
    ])
    
    const checklists = checklistResponse.data?.checklists || []
    const allChallenges = challengesResponse.data?.challenges || []
    
    // Filter for habit challenges only
    const habitChallenges = allChallenges.filter(c => c.challengeType === 'habit')

    // Sort checklists by date descending
    const sortedChecklists = [...checklists].sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })

    // Check if today's checklist exists and has completed tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streak = 0
    let currentDate = new Date(today)
    
    // Check each day backwards from today
    for (let i = 0; i < 365; i++) { // Max 365 days
      const currentDateStr = formatDateString(currentDate)
      
      // Find checklist for this date
      const checklist = sortedChecklists.find(c => {
        const checklistDate = new Date(c.date)
        checklistDate.setHours(0, 0, 0, 0)
        return checklistDate.getTime() === currentDate.getTime()
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
          const hasDate = participant.completedDays.some(date => {
            if (!date) return false
            let dateStr = String(date)
            if (dateStr.includes('T')) {
              dateStr = dateStr.split('T')[0]
            }
            dateStr = dateStr.substring(0, 10)
            return dateStr === currentDateStr
          })
          
          if (hasDate) {
            hasCompletedChallenge = true
            break
          }
        }
      }
      
      // Day counts if checklist OR challenges were completed
      if (hasCompletedChecklistTask || hasCompletedChallenge) {
        streak++
      } else {
        // No completion for this day, break streak
        break
      }
      
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1)
      currentDate.setHours(0, 0, 0, 0)
    }
    
    streakDays.value = streak
  } catch (error) {
    console.error('Error calculating streak:', error)
    streakDays.value = 0
  }
}

function isChallengeFinished(challenge) {
  // Check if endDate is in the past
  if (challenge.endDate) {
    try {
      const endDate = new Date(challenge.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < today) {
        return true
      }
    } catch {
      // Continue to check other conditions
    }
  }
  
  // For result challenges, check if all actions are done
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions) || challenge.actions.length === 0) {
      return false
    }
    
    // Check if all actions and their children are checked
    return challenge.actions.every(action => {
      if (!action.checked) return false
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every(child => child.checked)
      }
      return true
    })
  }
  
  return false
}

function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isTodayValidForChallenge(challenge) {
  // If frequency is not "everyOtherDay", today is always valid
  if (challenge.frequency !== 'everyOtherDay') {
    return true
  }
  
  // For "everyOtherDay" frequency, check if today is a valid completion day
  if (!challenge.startDate) {
    return false
  }
  
  const startDate = new Date(challenge.startDate)
  const today = new Date()
  startDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  // If today is before start date, it's not valid
  if (today < startDate) {
    return false
  }
  
  // Calculate dayIndex: days from start date
  // Day 0 (start date) is enabled, day 1 is disabled, day 2 is enabled, etc.
  const diffTime = today - startDate
  const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Today is valid only if dayIndex is even (dayIndex % 2 === 0)
  return dayIndex % 2 === 0
}

function isTodayCompleted(challenge) {
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
  
  // Check if today's date is in completedDays
  // Use local time formatting to match how dates are stored
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)
  
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
    return dateStr === todayStr
  })
}

async function loadTodaysChallenges() {
  const userId = getCurrentUserId()
  const isLoggedIn = !!localStorage.getItem('token')
  
  if (!userId || !isLoggedIn) {
    challenges.value = []
    return
  }

  loadingChallenges.value = true
  try {
    const { data } = await challengeService.getChallengesByUser(userId, { excludePrivate: false })
    const allChallenges = data?.challenges || []
    
    // Filter for active challenges (including completed ones - they'll be marked as done)
    challenges.value = allChallenges.filter(challenge => {
      // Must be active (not finished)
      if (isChallengeFinished(challenge)) return false
      
      // Must be a habit challenge (only habit challenges have daily completion)
      if (challenge.challengeType !== 'habit') return false
      
      // Must have started (startDate <= today)
      if (challenge.startDate) {
        const startDate = new Date(challenge.startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        startDate.setHours(0, 0, 0, 0)
        if (startDate > today) return false
      }
      
      // Must be a participant (user must have joined the challenge)
      if (!challenge.participants || challenge.participants.length === 0) {
        return false
      }
      
      // Check if current user is a participant
      const userId = getCurrentUserId()
      const isParticipant = challenge.participants.some(p => {
        const pUserId = p.userId?._id || p.userId || p._id
        return pUserId && pUserId.toString() === userId.toString()
      })
      
      if (!isParticipant) {
        return false
      }
      
      // For "everyOtherDay" frequency, check if today is a valid completion day
      if (!isTodayValidForChallenge(challenge)) {
        return false
      }
      
      return true
    })
  } catch (error) {
    console.error('Error loading today\'s challenges:', error)
    challenges.value = []
  } finally {
    loadingChallenges.value = false
  }
}

function navigateToChallenge(challenge) {
  // Check if user is owner - navigate to edit page
  const userId = getCurrentUserId()
  const ownerId = challenge.owner?._id || challenge.owner
  if (ownerId && ownerId.toString() === userId.toString()) {
    router.push(`/challenges/edit/${challenge._id}`)
  } else {
    // Otherwise navigate to challenge details
    router.push(`/challenges/${challenge._id}`)
  }
}

const todaysChallenges = computed(() => {
  return challenges.value
})

// Calculate combined progress (challenges + checklist)
const completedChallenges = computed(() => {
  return todaysChallenges.value.filter(challenge => isTodayCompleted(challenge)).length
})

const checklistCompletedSteps = computed(() => {
  return checklistRef.value?.completedSteps || 0
})

const checklistTotalSteps = computed(() => {
  return checklistRef.value?.totalSteps || 0
})

const completedItems = computed(() => {
  return completedChallenges.value + checklistCompletedSteps.value
})

const totalItems = computed(() => {
  return todaysChallenges.value.length + checklistTotalSteps.value
})

const combinedProgressPercentage = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.round((completedItems.value / totalItems.value) * 100)
})

// Watch for checklist loading state
const updateChecklistLoading = () => {
  if (checklistRef.value) {
    checklistLoading.value = checklistRef.value.loading || false
  }
}

// Watch checklist ref to update loading state
watch(checklistRef, () => {
  nextTick(() => {
    updateChecklistLoading()
  })
}, { immediate: true })

// Watch for checklist updates
watch(() => checklistRef.value?.completedSteps, () => {
  updateChecklistLoading()
})

watch(() => checklistRef.value?.loading, (newVal) => {
  if (newVal !== undefined) {
    checklistLoading.value = newVal
  }
})

onMounted(() => {
  updateUser()
  calculateStreak()
  loadTodaysChallenges()
  window.addEventListener('auth-changed', updateUser)
  window.addEventListener('checklist-updated', () => {
    calculateStreak()
    nextTick(() => {
      updateChecklistLoading()
    })
  })
  window.addEventListener('challenge-updated', loadTodaysChallenges)
  window.addEventListener('challenge-completed', loadTodaysChallenges)
  window.addEventListener('participant-completed-days-updated', loadTodaysChallenges)
  
  // Initial checklist loading state update
  nextTick(() => {
    updateChecklistLoading()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', updateUser)
  window.removeEventListener('checklist-updated', calculateStreak)
  window.removeEventListener('challenge-updated', loadTodaysChallenges)
  window.removeEventListener('challenge-completed', loadTodaysChallenges)
  window.removeEventListener('participant-completed-days-updated', loadTodaysChallenges)
})
</script>

<style scoped>
.home-logged-in-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 1.5em 1em;
  gap: 2em;
}

@media (min-width: 400px) {
  .home-logged-in-container {
    padding: 2em 1em;
  }
}

@media (min-width: 600px) {
  .home-logged-in-container {
    padding: 2.5em 1.5em;
    gap: 2.5em;
  }
}

@media (min-width: 960px) {
  .home-logged-in-container {
    padding: 3em 24px;
    gap: 3em;
  }
}

.greeting-section {
  width: 100%;
  max-width: 800px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.greeting-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5em;
}

@media (min-width: 400px) {
  .greeting-title {
    font-size: 2rem;
  }
}

@media (min-width: 600px) {
  .greeting-title {
    font-size: 2.5rem;
  }
}

@media (min-width: 960px) {
  .greeting-title {
    font-size: 3rem;
  }
}

.wave-icon {
  font-size: 1em;
  display: inline-block;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(20deg);
  }
  75% {
    transform: rotate(-20deg);
  }
}

.motivational-text {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.7);
  margin: 0;
  font-weight: 500;
}

@media (min-width: 400px) {
  .motivational-text {
    font-size: 1.1rem;
  }
}

@media (min-width: 600px) {
  .motivational-text {
    font-size: 1.25rem;
  }
}

@media (min-width: 960px) {
  .motivational-text {
    font-size: 1.35rem;
  }
}

.streak-display-mobile {
  width: 100%;
  max-width: 600px;
  background: #FEF3E1;
  color: #FF6D00;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(255, 109, 0, 0.3);
  text-transform: uppercase;
}

.streak-display-mobile span {
  color: #FF6D00;
}

.streak-display-mobile i {
  color: #FF6D00;
  font-size: 18px;
}

.todays-card {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: linear-gradient(to right, #e3f2fd, #fce4ec) !important;
  border-left: 4px solid #42a5f5;
  box-shadow: 0 2px 8px rgba(66, 165, 245, 0.2) !important;
}

.section-subtitle {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 0.75em;
  margin-top: 0;
}

@media (min-width: 600px) {
  .section-subtitle {
    font-size: 1.1rem;
  }
}

.todays-challenges-section {
  margin-bottom: 0;
}

.todays-checklist-section {
  margin-top: 0;
}

.combined-progress-section {
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

.todays-challenges-list {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  background-color: white;
  border-radius: 8px;
  padding: 0.75em;
}

.todays-challenge-item {
  display: flex;
  align-items: center;
  padding: 0.75em;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.todays-challenge-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: translateX(4px);
}

.todays-challenge-item.completed {
  opacity: 0.7;
}

.todays-challenge-item.completed:hover {
  opacity: 0.9;
}

.todays-challenge-item .v-icon {
  color: #1FA0F6;
}

.todays-challenge-item .check-icon {
  color: #4caf50 !important;
}

.challenge-title {
  flex: 1;
  font-size: 0.95rem;
  color: rgba(0, 0, 0, 0.87);
  font-weight: 500;
}

.challenge-title.completed {
  text-decoration: line-through;
  color: rgba(0, 0, 0, 0.5);
}
</style>
