<template>
  <div v-if="initialDataLoading" class="home-loading-container">
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
      width="6"
    ></v-progress-circular>
  </div>
  <div v-else class="home-logged-in-container">
    <div class="greeting-section">
      <div class="greeting-content">
        <h1 class="greeting-title">
          <span class="greeting-text">{{ t('home.loggedIn.greeting', { name: userName }) }}</span>
          <span class="wave-icon">👋</span>
        </h1>
        <p v-if="!hasTodayCompletedTasks" class="motivational-text">{{ dailyMotivationalMessage }}</p>
        <p v-else class="motivational-text">{{ dailyMotivationalMessageCompleted }}</p>
        <button class="inspiration-btn" @click="showInspiration">
          <Sparkles :size="16" class="inspiration-btn-icon" />
          {{ t('home.loggedIn.needInspiration') }}
        </button>
      </div>
      <div class="greeting-image">
        <img src="@/assets/roket.png" alt="Rocket" class="rocket-img" />
      </div>
    </div>
    
    <!-- Debug: Always show if yesterdayStreakDays > 0 -->
    <div
      v-if="yesterdayStreakDays > 0 || displayStreakDays > 0"
      class="streak-display-mobile d-md-none"
      :class="{ 'streak-yesterday': !hasTodayCompletedTasks && yesterdayStreakDays > 0 }"
    >
      <i class="mdi mdi-fire"></i>
      <span>{{ (!hasTodayCompletedTasks && yesterdayStreakDays > 0) ? yesterdayStreakDays : displayStreakDays }} {{ streakDaysText }}</span>
    </div>
    
    <!-- Combined Progress Card -->
    <div v-if="!checklistLoading && totalItems > 0" class="hero-progress-light">
      <div class="progress-header">
        <span class="level-badge">{{ completedItems }} / {{ totalItems }} {{ t('home.loggedIn.dailyChecklist.completed') }}</span>
        <span class="level-badge">{{ combinedProgressPercentage }}%</span>
      </div>
      <div class="progress-track-soft">
        <div class="progress-fill-vibrant" :style="{ width: combinedProgressPercentage + '%' }"></div>
      </div>
    </div>
    
    <!-- Today's Cards: Challenges and Checklist -->
    <div class="todays-cards-wrapper">
      <!-- Today's Challenges Card -->
      <v-card v-if="todaysChallenges.length > 0" class="todays-card todays-challenges-card">
        <v-card-text>
          <div class="todays-challenges-section">
            <h3 class="section-subtitle">{{ t('home.loggedIn.todaysChallenges') }}</h3>
            <div class="todays-challenges-list">
              <div
                v-for="challenge in todaysChallenges"
                :key="challenge._id"
                class="challenge-card"
                :class="{ completed: isTodayCompleted(challenge) }"
                @click="navigateToChallenge(challenge)"
              >
                <div class="challenge-icon">
                  <v-icon 
                    v-if="isTodayCompleted(challenge)"
                    size="small"
                    color="#7048e8"
                  >mdi-check-circle</v-icon>
                  <v-icon 
                    v-else
                    size="small"
                    color="#7048e8"
                  >mdi-flag</v-icon>
                </div>
                <span class="challenge-text" :class="{ completed: isTodayCompleted(challenge) }">{{ challenge.title }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- Empty State for Daily Missions -->
      <v-card v-else class="todays-card todays-challenges-card">
        <v-card-text>
          <div class="todays-challenges-section">
            <h3 class="section-subtitle">{{ t('home.loggedIn.todaysChallenges') }}</h3>
            <div class="empty-missions-container">
              <img src="@/assets/treasure.png" class="empty-icon" alt="Treasure">
              <p class="empty-text-sub" v-html="t('home.loggedIn.emptyMissions.text')"></p>
            </div>
          </div>
        </v-card-text>
      </v-card>
      
      <!-- Today's Checklist Card -->
      <v-card class="todays-card todays-checklist-card checklist-card" :class="{ 'checklist-card-empty': checklistTotalSteps === 0 }">
        <v-card-text>
          <div class="todays-checklist-section">
            <h3 class="section-subtitle">{{ t('home.loggedIn.dailyChecklist.title') }}</h3>
            <DailyChecklist ref="checklistRef" :hide-add-step="isAllCompleted && !checklistLoading && totalItems > 0" />
          </div>
          
          <!-- Completion Celebration Button -->
          <div v-if="isAllCompleted && !checklistLoading && totalItems > 0" class="completion-celebration mt-4">
            <v-btn
              color="success"
              size="large"
              variant="elevated"
              prepend-icon="mdi-image"
              @click="generateCompletionImage"
              :loading="generatingImage"
              class="celebration-button"
            >
              {{ t('home.loggedIn.generateCompletionImage') }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onActivated, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import html2canvas from 'html2canvas'
import { Sparkles } from 'lucide-vue-next'
import DailyChecklist from './DailyChecklist.vue'
import { userService, challengeService } from '../services/api'
import motivationalMessagesEn from '../data/motivationalMessages.en.json'
import motivationalMessagesRu from '../data/motivationalMessages.ru.json'
import motivationalMessagesCompletedEn from '../data/motivationalMessagesCompleted.en.json'
import motivationalMessagesCompletedRu from '../data/motivationalMessagesCompleted.ru.json'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()

const userName = ref('')
const streakDays = ref(0)
const yesterdayStreakDays = ref(0)
const hasTodayCompletedTasks = ref(false)
const challenges = ref([])
const loadingChallenges = ref(false)
const checklistRef = ref(null)
const checklistLoading = ref(false)
const generatingImage = ref(false)
const initialDataLoading = ref(true)

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

function checkDayCompletion(date, checklists, habitChallenges, userId) {
  const dateStr = formatDateString(date)
  
  // Find checklist for this date
  const checklist = checklists.find(c => {
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

async function calculateStreak() {
  const userId = getCurrentUserId()
  const isLoggedIn = !!localStorage.getItem('token')
  
  if (!userId || !isLoggedIn) {
    streakDays.value = 0
    yesterdayStreakDays.value = 0
    hasTodayCompletedTasks.value = false
    initialDataLoading.value = false
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if today has any completed tasks
    hasTodayCompletedTasks.value = checkDayCompletion(today, sortedChecklists, habitChallenges, userId)
    
    // Calculate today's streak (starting from today)
    let todayStreak = 0
    let currentDate = new Date(today)
    
    for (let i = 0; i < 365; i++) {
      if (checkDayCompletion(currentDate, sortedChecklists, habitChallenges, userId)) {
        todayStreak++
      } else {
        break
      }
      currentDate.setDate(currentDate.getDate() - 1)
      currentDate.setHours(0, 0, 0, 0)
    }
    
    streakDays.value = todayStreak
    
    // Calculate yesterday's streak (starting from yesterday)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    let yesterdayStreak = 0
    currentDate = new Date(yesterday)
    
    for (let i = 0; i < 365; i++) {
      if (checkDayCompletion(currentDate, sortedChecklists, habitChallenges, userId)) {
        yesterdayStreak++
      } else {
        break
      }
      currentDate.setDate(currentDate.getDate() - 1)
      currentDate.setHours(0, 0, 0, 0)
    }
    
    yesterdayStreakDays.value = yesterdayStreak
    
    // Debug logging
    console.log('Streak calculation:', {
      hasTodayCompletedTasks: hasTodayCompletedTasks.value,
      todayStreak: streakDays.value,
      yesterdayStreak: yesterdayStreakDays.value,
      displayStreakDays: displayStreakDays.value,
      checklistsCount: sortedChecklists.length,
      habitChallengesCount: habitChallenges.length
    })
  } catch (error) {
    console.error('Error calculating streak:', error)
    streakDays.value = 0
    yesterdayStreakDays.value = 0
    hasTodayCompletedTasks.value = false
  } finally {
    initialDataLoading.value = false
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

function showInspiration() {
  // Navigate to explore page to see all challenges
  router.push('/challenges')
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

const isAllCompleted = computed(() => {
  if (totalItems.value === 0) return false
  return completedItems.value === totalItems.value
})

// Award +50 XP once per day when today's activities reach 100%
function getDailyBonusKey() {
  const todayStr = new Date().toISOString().slice(0, 10) // UTC YYYY-MM-DD
  return `xp_daily_bonus_${todayStr}`
}

async function tryAwardDailyBonusXp() {
  try {
    if (!isLoggedIn.value) return
    if (!isAllCompleted.value) return

    const key = getDailyBonusKey()
    if (localStorage.getItem(key)) return

    const response = await userService.awardDailyBonusXp()
    if (response?.data?.awarded) {
      localStorage.setItem(key, '1')
    } else {
      // still set to avoid spamming the server
      localStorage.setItem(key, '0')
    }

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
  } catch (err) {
    // Don't block UI; just avoid infinite retries this session
    try {
      localStorage.setItem(getDailyBonusKey(), '0')
    } catch {
      // ignore
    }
  }
}

watch(isAllCompleted, (val) => {
  if (val) {
    tryAwardDailyBonusXp()
  }
})

// Display streak: show yesterday's streak in grey if today isn't completed, otherwise show today's streak
const displayStreakDays = computed(() => {
  if (hasTodayCompletedTasks.value) {
    return streakDays.value
  } else if (yesterdayStreakDays.value > 0) {
    return yesterdayStreakDays.value
  }
  return streakDays.value
})

// Get daily motivational message based on date (when no tasks completed)
const dailyMotivationalMessage = computed(() => {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
  const messages = locale.value === 'ru' ? motivationalMessagesRu : motivationalMessagesEn
  const messageIndex = dayOfYear % messages.length
  return messages[messageIndex]
})

// Get daily motivational message when first task is completed
const dailyMotivationalMessageCompleted = computed(() => {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
  const messages = locale.value === 'ru' ? motivationalMessagesCompletedRu : motivationalMessagesCompletedEn
  const messageIndex = dayOfYear % messages.length
  return messages[messageIndex]
})

// Helper function for Russian pluralization of "день"
function getRussianDayWord(days) {
  if (locale.value !== 'ru') {
    return t('navigation.streakDays')
  }
  
  const num = Math.abs(days)
  const lastDigit = num % 10
  const lastTwoDigits = num % 100
  
  // Special cases: 11, 12, 13, 14 use "дней"
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней подряд'
  }
  
  // 1, 21, 31, etc. (ends in 1, but not 11) → "день"
  if (lastDigit === 1) {
    return 'день подряд'
  }
  
  // 2, 3, 4, 22, 23, 24, etc. (ends in 2, 3, 4, but not 12, 13, 14) → "дня"
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня подряд'
  }
  
  // Everything else (5-9, 0, 10, 15-20, 25-30, etc.) → "дней"
  return 'дней подряд'
}

const streakDaysText = computed(() => {
  const days = (!hasTodayCompletedTasks.value && yesterdayStreakDays.value > 0) 
    ? yesterdayStreakDays.value 
    : displayStreakDays.value
  return getRussianDayWord(days)
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
  window.addEventListener('challenge-updated', () => {
    loadTodaysChallenges()
    calculateStreak()
  })
  window.addEventListener('challenge-completed', () => {
    loadTodaysChallenges()
    calculateStreak()
  })
  window.addEventListener('participant-completed-days-updated', () => {
    loadTodaysChallenges()
    calculateStreak()
  })
  
  // Initial checklist loading state update
  nextTick(() => {
    updateChecklistLoading()
  })
})

// Recalculate streak when component is activated (navigated to)
onActivated(() => {
  calculateStreak()
  loadTodaysChallenges()
})

// Watch route changes to recalculate streak when navigating to home
watch(() => route.path, (newPath) => {
  if (newPath === '/') {
    calculateStreak()
    loadTodaysChallenges()
  }
})

async function generateCompletionImage() {
  generatingImage.value = true
  try {
    // Wait for DOM to be ready
    await nextTick()
    // Create a temporary container for the image
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '800px'
    container.style.padding = '40px'
    container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    container.style.color = '#ffffff'
    container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    
    // Get today's date
    const todayDate = new Date()
    const dateStr = todayDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    // Create header
    const header = document.createElement('div')
    header.style.textAlign = 'center'
    header.style.marginBottom = '30px'
    
    const title = document.createElement('h1')
    title.textContent = t('home.loggedIn.completionImage.title', { name: userName.value })
    title.style.fontSize = '36px'
    title.style.fontWeight = 'bold'
    title.style.marginBottom = '10px'
    title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)'
    
    const date = document.createElement('p')
    date.textContent = dateStr
    date.style.fontSize = '18px'
    date.style.opacity = '0.9'
    date.style.margin = '0 0 15px 0'
    
    // Add motivational text - select based on date for consistency (same message for the same day)
    const dayOfYear = Math.floor((todayDate - new Date(todayDate.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
    const messages = locale.value === 'ru' ? motivationalMessagesRu : motivationalMessagesEn
    const messageIndex = dayOfYear % messages.length
    const selectedMessage = messages[messageIndex]
    
    const motivationalText = document.createElement('p')
    motivationalText.textContent = selectedMessage
    motivationalText.style.fontSize = '20px'
    motivationalText.style.fontWeight = '500'
    motivationalText.style.fontStyle = 'italic'
    motivationalText.style.opacity = '0.95'
    motivationalText.style.margin = '0'
    motivationalText.style.padding = '15px 20px'
    motivationalText.style.background = 'rgba(255,255,255,0.15)'
    motivationalText.style.borderRadius = '12px'
    motivationalText.style.borderLeft = '4px solid rgba(255,255,255,0.5)'
    
    header.appendChild(title)
    header.appendChild(date)
    header.appendChild(motivationalText)
    container.appendChild(header)
    
    // Create completed challenges section
    if (todaysChallenges.value.length > 0) {
      const challengesSection = document.createElement('div')
      challengesSection.style.marginBottom = '30px'
      
      const challengesTitle = document.createElement('h2')
      challengesTitle.textContent = t('home.loggedIn.todaysChallenges')
      // Set explicit letter-spacing to prevent space collapse
      challengesTitle.style.letterSpacing = 'normal'
      challengesTitle.style.fontSize = '24px'
      challengesTitle.style.fontWeight = '600'
      challengesTitle.style.marginBottom = '15px'
      challengesTitle.style.borderBottom = '2px solid rgba(255,255,255,0.3)'
      challengesTitle.style.paddingBottom = '10px'
      
      challengesSection.appendChild(challengesTitle)
      
      todaysChallenges.value.forEach(challenge => {
        const item = document.createElement('div')
        item.style.display = 'flex'
        item.style.alignItems = 'center'
        item.style.padding = '12px'
        item.style.marginBottom = '8px'
        item.style.background = 'rgba(255,255,255,0.1)'
        item.style.borderRadius = '8px'
        
        const checkmark = document.createElement('span')
        checkmark.textContent = '✓'
        checkmark.style.fontSize = '24px'
        checkmark.style.color = '#4caf50'
        checkmark.style.marginRight = '12px'
        checkmark.style.fontWeight = 'bold'
        
        const text = document.createElement('span')
        text.textContent = challenge.title
        text.style.fontSize = '18px'
        text.style.flex = '1'
        
        item.appendChild(checkmark)
        item.appendChild(text)
        challengesSection.appendChild(item)
      })
      
      container.appendChild(challengesSection)
    }
    
    // Create completed checklist section
    if (checklistRef.value && checklistRef.value.totalSteps > 0) {
      const checklistSection = document.createElement('div')
      
      const checklistTitle = document.createElement('h2')
      checklistTitle.textContent = t('home.loggedIn.dailyChecklist.title')
      // Set explicit letter-spacing to prevent space collapse
      checklistTitle.style.letterSpacing = 'normal'
      checklistTitle.style.fontSize = '24px'
      checklistTitle.style.fontWeight = '600'
      checklistTitle.style.marginBottom = '15px'
      checklistTitle.style.borderBottom = '2px solid rgba(255,255,255,0.3)'
      checklistTitle.style.paddingBottom = '10px'
      
      checklistSection.appendChild(checklistTitle)
      
      // Get checklist items from the component's DOM
      if (checklistRef.value && checklistRef.value.$el) {
        const checklistItems = checklistRef.value.$el.querySelectorAll('.step-item') || []
        checklistItems.forEach((item) => {
          const stepText = item.querySelector('.step-text')
          const checkbox = item.querySelector('input[type="checkbox"]')
          // Only include completed items
          if (stepText && checkbox && checkbox.checked) {
            const div = document.createElement('div')
            div.style.display = 'flex'
            div.style.alignItems = 'center'
            div.style.padding = '12px'
            div.style.marginBottom = '8px'
            div.style.background = 'rgba(255,255,255,0.1)'
            div.style.borderRadius = '8px'
            
            const checkmark = document.createElement('span')
            checkmark.textContent = '✓'
            checkmark.style.fontSize = '24px'
            checkmark.style.color = '#4caf50'
            checkmark.style.marginRight = '12px'
            checkmark.style.fontWeight = 'bold'
            
            const text = document.createElement('span')
            text.textContent = stepText.textContent.trim()
            text.style.fontSize = '18px'
            text.style.flex = '1'
            
            div.appendChild(checkmark)
            div.appendChild(text)
            checklistSection.appendChild(div)
          }
        })
      }
      
      container.appendChild(checklistSection)
    }
    
    // Add footer with streak
    if (streakDays.value > 0) {
      const footer = document.createElement('div')
      footer.style.textAlign = 'center'
      footer.style.marginTop = '30px'
      footer.style.paddingTop = '20px'
      footer.style.borderTop = '2px solid rgba(255,255,255,0.3)'
      
      const streakText = document.createElement('p')
      streakText.innerHTML = `🔥 ${streakDays.value} ${t('navigation.streakDays')}`
      streakText.style.fontSize = '20px'
      streakText.style.fontWeight = '600'
      streakText.style.margin = '0'
      
      footer.appendChild(streakText)
      container.appendChild(footer)
    }
    
    // Append to body temporarily
    document.body.appendChild(container)
    
    // Generate image
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true
    })
    
    // Remove temporary container
    document.body.removeChild(container)
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `daily-completion-${formatDateString(new Date())}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (error) {
    console.error('Error generating completion image:', error)
  } finally {
    generatingImage.value = false
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', updateUser)
  window.removeEventListener('checklist-updated', calculateStreak)
  window.removeEventListener('challenge-updated', loadTodaysChallenges)
  window.removeEventListener('challenge-completed', loadTodaysChallenges)
  window.removeEventListener('participant-completed-days-updated', loadTodaysChallenges)
})
</script>

<style scoped>
.home-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  width: 100%;
}

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
  margin-bottom: 2rem;
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: center;
}

.greeting-content {
  flex: 1;
  text-align: left;
  padding-left: 20px;
  border-left: 4px solid;
  border-image: linear-gradient(to bottom, #7048E8, rgba(112, 72, 232, 0)) 1;
}

.greeting-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rocket-img {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

@media (max-width: 959px) {
  .greeting-section {
    margin-bottom: 0;
    flex-direction: column;
    gap: 1rem;
  }
  
  .greeting-content {
    width: 100%;
  }
  
  .greeting-image {
    width: 100%;
  }
  
  .rocket-img {
    max-width: 200px;
  }
}

.greeting-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
  line-height: 1.3;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5em;
}

.greeting-text {
  font-family: 'Outfit', sans-serif;
  font-style: italic;
  /* Магия градиента */
  background: linear-gradient(90deg, #1A1A2E 0%, #7048E8 100%);
  -webkit-background-clip: text; /* Обрезает фон по форме букв */
  background-clip: text; /* Стандартное свойство для совместимости */
  -webkit-text-fill-color: transparent; /* Делает сами буквы прозрачными, чтобы был виден фон-градиент */
  display: inline-block; /* Необходимо для корректной работы градиента */
  padding-right: 0.15em; /* Добавляем немного пространства после имени */
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
  font-size: 0.95rem;
  font-weight: 300;
  color: #636E72;
  line-height: 1.4;
  font-style: italic;
  margin: 0;
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

.inspiration-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-top: 12px;
  
  /* Цвета и шрифт */
  background: rgba(112, 72, 232, 0.05);
  color: #7048E8;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  
  /* Пунктирная граница создает ощущение "скрытого" или "нового" контента */
  border: 1.5px dashed rgba(112, 72, 232, 0.3);
  border-radius: 12px;
  
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.inspiration-btn:hover {
  background: rgba(112, 72, 232, 0.1);
  border-color: #7048E8;
  transform: translateY(-2px);
  
  /* Мягкое фиолетовое свечение */
  box-shadow: 0 4px 12px rgba(112, 72, 232, 0.15);
}

/* Иконка внутри (если используешь Lucide Sparkles) */
.inspiration-btn-icon {
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.inspiration-btn:hover .inspiration-btn-icon {
  transform: rotate(15deg) scale(1.1);
  opacity: 1;
}

.streak-display-mobile {
  width: 100%;
  max-width: 600px;
  background: linear-gradient(135deg, #FFF5F0 0%, #FFEDE3 100%);
  color: #FF8C42;
  border: 1px solid rgba(255, 140, 66, 0.3);
  padding: 8px 16px;
  border-radius: 14px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  box-shadow: none;
}

.streak-display-mobile.streak-yesterday {
  background: linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%);
  color: #757575;
  border: 1px solid rgba(117, 117, 117, 0.3);
  box-shadow: none;
}

.streak-display-mobile span {
  color: inherit;
}

.streak-display-mobile i {
  color: inherit;
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
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1A1A2E;
  margin-bottom: 16px;
  padding-left: 4px;
}

.todays-cards-wrapper {
  width: 100%;
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 1em;
  flex-wrap: nowrap;
}

.todays-challenges-card {
  width: 65%;
  flex: 0 0 65%;
  max-width: 65%;
  background: transparent !important; /* Убираем стандартный фон v-card, если нужно */
  box-shadow: none !important;
  border: none !important;
}

.todays-checklist-card {
  width: 35%;
  flex: 0 0 35%;
  max-width: 35%;
}

.checklist-card {
  background: #ffffff !important;
  border-radius: 24px !important;
  border: 1px solid rgba(0, 163, 255, 0.08) !important; /* Легкий голубой оттенок для отличия */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
}

.checklist-card-empty {
  background: #ffffff !important;
  border: 2px dashed rgba(112, 72, 232, 0.2) !important; /* Светло-фиолетовый пунктир */
  border-radius: 24px !important;
  padding: 24px !important;
  width: 100% !important;
  max-width: 400px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  position: relative !important;
  transition: all 0.3s ease !important;
  box-shadow: none !important;
}

.checklist-card-empty:hover {
  border-color: rgba(112, 72, 232, 0.4) !important;
  background: rgba(112, 72, 232, 0.01) !important;
}

@media (max-width: 959px) {
  .todays-cards-wrapper {
    flex-direction: column;
  }
  
  .todays-challenges-card,
  .todays-checklist-card {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.todays-challenges-section {
  margin-bottom: 0;
}

.todays-checklist-section {
  margin-top: 0;
}

.hero-progress-light {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(112, 72, 232, 0.1); /* Тонкий контур */
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03); /* Очень мягкая тень */
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.level-badge {
  font-weight: 800;
  color: #1A1A2E;
  font-size: 1.2rem;
}

.progress-track-soft {
  width: 100%;
  height: 10px;
  background: #F1F3F5; /* Светлая «канавка» */
  border-radius: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); /* Эффект глубины */
}

.progress-fill-vibrant {
  height: 100%;
  /* Градиент от фиолетового к розовому — выглядит энергично */
  background: linear-gradient(90deg, #7048E8 0%, #BE4BDB 100%);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(112, 72, 232, 0.3);
  transition: width 0.5s ease-in-out;
}

/* Сетка для списка карточек */
.todays-challenges-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Базовое состояние карточки челленджа */
.challenge-card {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(112, 72, 232, 0.05); /* Очень тонкая граница для четкости */
  cursor: pointer;
  
  /* Глубокая и мягкая тень */
  box-shadow: 0 10px 20px rgba(112, 72, 232, 0.03), 
              0 6px 6px rgba(0, 0, 0, 0.02); 
              
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

/* Эффект при наведении — еще больше объема */
.challenge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(112, 72, 232, 0.06);
  border-color: rgba(112, 72, 232, 0.1);
}

/* Стили для иконки */
.challenge-icon {
  width: 36px;
  height: 36px;
  background: #F3F0FF; /* Светло-фиолетовый фон иконки */
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  transition: background 0.3s ease;
}

/* Текст челленджа */
.challenge-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: #2D3436;
  transition: color 0.3s ease;
  flex: 1;
}

/* Стили для выполненного челленджа (состояние completed) */
.challenge-card.completed {
  background: #F8F9FA;
  border-color: transparent;
  box-shadow: none;
  opacity: 0.7;
}

/* Состояние иконки внутри выполненной карточки */
.challenge-card.completed .challenge-icon {
  /* Меняем фон подложки на более нейтральный */
  background: rgba(148, 163, 184, 0.1) !important;
}

.challenge-card.completed .v-icon {
  /* Серо-голубой цвет (Slate 400), как у текста */
  color: #94A3B8 !important;
  
  /* Убираем лишнюю яркость/свечение, если оно было */
  filter: none !important;
  opacity: 0.8;
}

.challenge-text.completed {
  text-decoration: line-through;
  color: #94A3B8; /* Приглушенный серый */
}

.empty-missions-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 140px; /* Размер сундука */
  margin-bottom: 20px;
  filter: drop-shadow(0 10px 15px rgba(112, 72, 232, 0.1));
}

.empty-text-sub {
  color: #94A3B8; /* Мягкий серый цвет */
  font-size: 0.85rem;
  max-width: 250px;
  line-height: 1.5;
}

.empty-text-sub strong {
  color: #7048E8; /* Выделяем название кнопки твоим фирменным цветом */
}

.completion-celebration {
  text-align: center;
  padding: 1em;
  background-color: rgba(76, 175, 80, 0.1);
  border-radius: 8px;
  border: 2px solid rgba(76, 175, 80, 0.3);
}

.celebration-button {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
}
</style>
