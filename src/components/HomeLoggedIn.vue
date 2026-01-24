<template>
  <div v-if="initialDataLoading" class="home-loading-container">
    <IgniteLoader :loading-text="t('home.loggedIn.loading.initial', 'Channelling Power...')" />
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
        <button v-if="todaysChallenges.length === 0" class="inspiration-btn" @click="showInspiration">
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
    
    <!-- Tabs: Today / Tomorrow -->
    <v-tabs v-model="activeTab" class="home-tabs" bg-color="transparent">
      <v-tab value="today">{{ t('home.loggedIn.tabs.today') }}</v-tab>
      <v-tab value="tomorrow">{{ t('home.loggedIn.tabs.tomorrow') }}</v-tab>
    </v-tabs>
    
    <!-- Today Tab Content -->
    <v-window v-model="activeTab">
      <v-window-item value="today">
        <!-- Combined Progress Card -->
        <div v-if="!checklistLoading && totalItems > 0" class="hero-progress-light">
          <div class="progress-header">
            <span class="level-badge">{{ completedItems }} / {{ totalItems }} {{ t('home.loggedIn.dailyChecklist.completed') }}</span>
            <span class="level-badge">{{ combinedProgressPercentage }}%</span>
          </div>
          <div class="progress-track-soft">
            <div 
              class="progress-fill-vibrant" 
              :class="{ 'has-progress': combinedProgressPercentage > 0 }"
              :style="{ width: combinedProgressPercentage + '%' }"
            ></div>
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
                <div 
                  class="challenge-icon" 
                  :class="{ 'has-hover': !isTodayCompleted(challenge) }"
                  @click.stop="toggleTodayCompletion(challenge, !isTodayCompleted(challenge))"
                >
                  <v-icon 
                    v-if="isTodayCompleted(challenge)"
                    size="small"
                    color="#7048e8"
                  >mdi-check-circle</v-icon>
                  <template v-else>
                    <v-icon 
                      size="small"
                      color="#7048e8"
                      class="flag-icon"
                    >mdi-flag</v-icon>
                    <v-icon 
                      size="small"
                      color="#7048e8"
                      class="check-icon-hover"
                    >mdi-check-circle</v-icon>
                  </template>
                </div>
                <span class="challenge-text" :class="{ completed: isTodayCompleted(challenge) }">
                  {{ challenge.title }}
                </span>
                <span class="challenge-progress" :class="{ completed: isTodayCompleted(challenge) }">
                  {{ getChallengeCompletedDays(challenge) }} / {{ getChallengeTotalDays(challenge) }}
                </span>
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
            <div class="d-flex align-center justify-space-between mb-2">
              <h3 class="section-subtitle mb-0">{{ t('home.loggedIn.dailyChecklist.title') }}</h3>
              <v-btn
                v-if="unfinishedStepsCount > 0"
                size="small"
                variant="text"
                class="copy-to-tomorrow-btn"
                @click="copyUnfinishedStepsToTomorrow"
              >
                {{ t('home.loggedIn.dailyChecklist.copyToTomorrow') }} | {{ unfinishedStepsCount }}
              </v-btn>
            </div>
            <DailyChecklist ref="checklistRef" :hide-add-step="isAllCompleted && !checklistLoading && totalItems > 0" />
          </div>
          
        </v-card-text>
      </v-card>
    </div>
      </v-window-item>
      
      <!-- Tomorrow Tab Content -->
      <v-window-item value="tomorrow">
        <!-- Combined Progress Card for Tomorrow -->
        <div v-if="tomorrowTotalItems > 0" class="hero-progress-light">
          <div class="progress-header">
            <span class="level-badge">{{ tomorrowCompletedItems }} / {{ tomorrowTotalItems }} {{ t('home.loggedIn.dailyChecklist.completed') }}</span>
            <span class="level-badge">{{ tomorrowProgressPercentage }}%</span>
          </div>
          <div class="progress-track-soft">
            <div class="progress-fill-vibrant" :style="{ width: tomorrowProgressPercentage + '%' }"></div>
          </div>
        </div>
        
        <!-- Tomorrow's Cards: Challenges and Steps -->
        <div class="todays-cards-wrapper">
          <!-- Tomorrow's Challenges Card -->
          <v-card v-if="tomorrowsChallenges.length > 0" class="todays-card todays-challenges-card">
            <v-card-text>
              <div class="todays-challenges-section">
                <h3 class="section-subtitle">{{ t('home.loggedIn.todaysChallenges') }}</h3>
                <div class="todays-challenges-list">
                  <div
                    v-for="challenge in tomorrowsChallenges"
                    :key="challenge._id"
                    class="challenge-card challenge-card-disabled"
                  >
                    <div class="challenge-icon">
                      <v-icon 
                        size="small"
                        color="#94A3B8"
                      >mdi-flag</v-icon>
                    </div>
                    <span class="challenge-text challenge-text-disabled">{{ challenge.title }}</span>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Empty State for Tomorrow's Missions -->
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
          
          <!-- Tomorrow's Steps Card -->
          <v-card class="todays-card todays-checklist-card checklist-card checklist-card-tomorrow">
            <v-card-text>
              <div class="todays-checklist-section">
                <h3 class="section-subtitle">{{ t('home.loggedIn.tomorrowSteps.title') }}</h3>
                
                <!-- Empty State -->
                <div v-if="tomorrowSteps.length === 0" class="tomorrow-steps-empty">
                  <img :src="tomorrowImage" class="tomorrow-empty-icon" alt="Tomorrow">
                  <p class="tomorrow-empty-text">{{ t('home.loggedIn.tomorrowSteps.empty.text') }}</p>
                  <v-btn
                    v-if="!showTomorrowStepsInput"
                    class="plan-step-btn"
                    @click="planNewStep"
                  >
                    {{ t('home.loggedIn.tomorrowSteps.empty.button') }}
                  </v-btn>
                </div>
                
                <!-- Steps List -->
                <div v-if="tomorrowSteps.length > 0 || showTomorrowStepsInput" class="tomorrow-steps-content">
                  <div v-if="tomorrowSteps.length > 0" class="checklist-list">
                    <div
                      v-for="(step, index) in tomorrowSteps"
                      :key="index"
                      class="checklist-item"
                    >
                      <input
                        v-if="editingTomorrowStepIndex === index"
                        v-model="editingTomorrowStepText"
                        type="text"
                        class="step-edit-input"
                        @keyup.enter="saveTomorrowStepEdit(index)"
                        @keyup.esc="cancelTomorrowStepEdit"
                        @blur="saveTomorrowStepEdit(index)"
                        ref="tomorrowStepInputRef"
                      />
                      <span v-else class="step-text" @dblclick="startEditingTomorrowStep(index, step.title)">{{ step.title }}</span>
                      <div
                        class="delete-action"
                        :title="t('home.loggedIn.dailyChecklist.deleteStep')"
                        @click="removeTomorrowStep(index)"
                      >
                        <Trash2 :size="16" />
                      </div>
                    </div>
                  </div>
                  
                  <!-- Add Step Input -->
                  <div class="add-step-wrapper">
                    <input
                      v-model="tomorrowStepText"
                      type="text"
                      :placeholder="t('home.loggedIn.dailyChecklist.addStepPlaceholder')"
                      class="step-input"
                      @keyup.enter="addTomorrowStep"
                    />
                    <v-btn
                      :disabled="!tomorrowStepText.trim()"
                      class="add-step-btn"
                      icon
                      @click="addTomorrowStep"
                    >
                      <Plus :size="18" color="white" />
                    </v-btn>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-window-item>
    </v-window>
    
    <!-- Completion Celebration Dialog -->
    <v-dialog 
  v-model="showCompletionDialog" 
  max-width="450" 
  persistent
  overlay-color="#1A1A2E"
  overlay-opacity="0.8"
  transition="dialog-bottom-transition"
>
  <v-card class="completion-dialog-card overflow-visible">
    <div class="glow-bg"></div>
    
    <!-- Close button (X) -->
    <v-btn
      icon
      variant="text"
      @click="closeCompletionDialog"
      class="dialog-close-btn"
      size="small"
    >
      <v-icon color="white">mdi-close</v-icon>
    </v-btn>

    <v-card-text class="text-center pa-8 pt-12">
      <div class="completion-icon-wrapper mb-6">
        <div class="icon-circle">
          <v-icon size="60" color="white">mdi-rocket-launch</v-icon>
        </div>
      </div>

      <h2 class="completion-title mb-3 leading-tight">
        {{ t('home.loggedIn.completionDialog.title') }}
      </h2>
      
      <p class="completion-message mb-8 px-4">
        {{ t('home.loggedIn.completionDialog.message') }}
      </p>

      <v-btn
        block
        height="64"
        class="celebration-button mb-4 text-none"
        elevation="0"
        @click="generateCompletionImage"
        :loading="generatingImage"
      >
        <v-icon left class="mr-2">mdi-share-variant</v-icon>
        {{ t('home.loggedIn.generateCompletionImage') }}
      </v-btn>
    </v-card-text>
  </v-card>
</v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onActivated, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { Sparkles, Plus, Trash2 } from 'lucide-vue-next'
import DailyChecklist from './DailyChecklist.vue'
import IgniteLoader from './IgniteLoader.vue'
import { userService, challengeService } from '../services/api'
import motivationalMessagesEn from '../data/motivationalMessages.en.json'
import motivationalMessagesRu from '../data/motivationalMessages.ru.json'
import motivationalMessagesCompletedEn from '../data/motivationalMessagesCompleted.en.json'
import motivationalMessagesCompletedRu from '../data/motivationalMessagesCompleted.ru.json'
import tomorrowImage from '../assets/tomorrow.png'
import { generateCompletionImage as generateImage } from '../utils/imageGenerator'

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
const showCompletionDialog = ref(false)
const hasShownCompletionDialog = ref(false)
const activeTab = ref('today')
const showTomorrowStepsInput = ref(false)
const tomorrowStepText = ref('')
const tomorrowSteps = ref([])
const editingTomorrowStepIndex = ref(-1)
const editingTomorrowStepText = ref('')

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

function isTomorrowValidForChallenge(challenge) {
  // If frequency is not "everyOtherDay", tomorrow is always valid
  if (challenge.frequency !== 'everyOtherDay') {
    return true
  }
  
  // For "everyOtherDay" frequency, check if tomorrow is a valid completion day
  if (!challenge.startDate) {
    return false
  }
  
  const startDate = new Date(challenge.startDate)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  startDate.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  
  // If tomorrow is before start date, it's not valid
  if (tomorrow < startDate) {
    return false
  }
  
  // Calculate dayIndex: days from start date
  // Day 0 (start date) is enabled, day 1 is disabled, day 2 is enabled, etc.
  const diffTime = tomorrow - startDate
  const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Tomorrow is valid only if dayIndex is even (dayIndex % 2 === 0)
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

function getChallengeCompletedDays(challenge) {
  const userId = getCurrentUserId()
  if (!userId || !challenge.participants) return 0
  
  // Find current user's participant entry
  const participant = challenge.participants.find(p => {
    const pUserId = p.userId?._id || p.userId || p._id
    return pUserId && pUserId.toString() === userId.toString()
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) {
    return 0
  }
  
  return participant.completedDays.length
}

function getChallengeTotalDays(challenge) {
  if (!challenge.startDate || !challenge.endDate) return 0
  
  try {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
    
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    // For "every other day" frequency, only count every other day
    if (challenge.frequency === 'everyOtherDay') {
      let count = 0
      const current = new Date(start)
      let dayIndex = 0
      
      while (current <= end) {
        // Only count enabled days (day 0, 2, 4, 6, etc.)
        if (dayIndex % 2 === 0) {
          count++
        }
        current.setDate(current.getDate() + 1)
        dayIndex++
      }
      
      return count
    }
    
    // For other frequencies, count all days
    const diffTime = end - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    
    return diffDays
  } catch {
    return 0
  }
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
    router.push(`/missions/edit/${challenge._id}`)
  } else {
    // Navigate to My Missions page and open dialog with this challenge
    router.push({
      path: '/missions/my',
      query: { challengeId: challenge._id }
    })
  }
}

async function toggleTodayCompletion(challenge, checked) {
  const userId = getCurrentUserId()
  if (!userId || !challenge.participants) return
  
  // Find current user's participant entry
  const participant = challenge.participants.find(p => {
    const pUserId = p.userId?._id || p.userId || p._id
    return pUserId && pUserId.toString() === userId.toString()
  })
  
  if (!participant) return
  
  // Get current completedDays array
  const currentCompletedDays = Array.isArray(participant.completedDays) 
    ? [...participant.completedDays] 
    : []
  
  // Format today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)
  
  // Create new completedDays array
  let newCompletedDays = [...currentCompletedDays]
  
  if (checked) {
    // Add today if not already present
    const hasToday = newCompletedDays.some(date => {
      if (!date) return false
      let dateStr = String(date)
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]
      }
      dateStr = dateStr.substring(0, 10)
      return dateStr === todayStr
    })
    
    if (!hasToday) {
      newCompletedDays.push(todayStr)
    }
  } else {
    // Remove today if present
    newCompletedDays = newCompletedDays.filter(date => {
      if (!date) return true
      let dateStr = String(date)
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]
      }
      dateStr = dateStr.substring(0, 10)
      return dateStr !== todayStr
    })
  }
  
  try {
    // Update via API
    await challengeService.updateParticipantCompletedDays(challenge._id, userId, newCompletedDays)
    
    // Update local challenge data
    if (participant) {
      participant.completedDays = newCompletedDays
    }
    
    // Reload challenges to get updated data
    await loadTodaysChallenges()
    await calculateStreak()
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('participant-completed-days-updated'))
    window.dispatchEvent(new Event('challenge-updated'))
  } catch (error) {
    console.error('Error toggling completion:', error)
  }
}

function showInspiration() {
  // Navigate to explore page to see all challenges
  router.push('/missions')
}

async function loadTomorrowSteps() {
  try {
    const response = await userService.getTomorrowChecklist()
    if (response.data?.checklist?.tasks) {
      tomorrowSteps.value = response.data.checklist.tasks.map(task => ({
        title: task.title,
        done: false // Tomorrow's steps should always start as not done
      }))
      if (tomorrowSteps.value.length > 0) {
        showTomorrowStepsInput.value = true
      }
    } else {
      tomorrowSteps.value = []
    }
  } catch (err) {
    console.error('Error loading tomorrow\'s checklist:', err)
    tomorrowSteps.value = []
  }
}

async function saveTomorrowSteps() {
  try {
    const tasks = tomorrowSteps.value.map(step => ({
      title: step.title,
      done: false // Tomorrow's steps are always not done
    }))
    await userService.updateTomorrowChecklist(tasks)
  } catch (err) {
    console.error('Error saving tomorrow\'s checklist:', err)
  }
}

function planNewStep() {
  showTomorrowStepsInput.value = true
}

async function addTomorrowStep() {
  if (!tomorrowStepText.value.trim()) return
  
  tomorrowSteps.value.push({
    title: tomorrowStepText.value.trim(),
    done: false
  })
  
  tomorrowStepText.value = ''
  await saveTomorrowSteps()
}

async function removeTomorrowStep(index) {
  tomorrowSteps.value.splice(index, 1)
  await saveTomorrowSteps()
}

function startEditingTomorrowStep(index, currentText) {
  editingTomorrowStepIndex.value = index
  editingTomorrowStepText.value = currentText
  nextTick(() => {
    // Focus the input when it appears
    const input = document.querySelector(`.tomorrow-steps-content .step-edit-input`)
    if (input) {
      input.focus()
      input.select()
    }
  })
}

async function saveTomorrowStepEdit(index) {
  if (editingTomorrowStepIndex.value === index && editingTomorrowStepText.value.trim()) {
    tomorrowSteps.value[index].title = editingTomorrowStepText.value.trim()
    editingTomorrowStepIndex.value = -1
    editingTomorrowStepText.value = ''
    await saveTomorrowSteps()
  } else {
    cancelTomorrowStepEdit()
  }
}

function cancelTomorrowStepEdit() {
  editingTomorrowStepIndex.value = -1
  editingTomorrowStepText.value = ''
}

async function copyUnfinishedStepsToTomorrow() {
  if (!checklistRef.value || !checklistRef.value.todaySteps) return
  
  // Get unfinished steps (only steps, not missions)
  const unfinishedSteps = checklistRef.value.todaySteps.filter(step => !step.done)
  
  if (unfinishedSteps.length === 0) return
  
  // Load tomorrow's steps first if not already loaded
  if (tomorrowSteps.value.length === 0) {
    await loadTomorrowSteps()
  }
  
  // Add unfinished steps to tomorrow's checklist
  for (const step of unfinishedSteps) {
    // Check if step already exists in tomorrow's list
    const exists = tomorrowSteps.value.some(tomorrowStep => tomorrowStep.title === step.title)
    if (!exists) {
      tomorrowSteps.value.push({
        title: step.title,
        done: false
      })
    }
  }
  
  // Save tomorrow's steps
  await saveTomorrowSteps()
  
  // Show tomorrow tab if not already visible
  if (activeTab.value !== 'tomorrow') {
    activeTab.value = 'tomorrow'
  }
}

const todaysChallenges = computed(() => {
  return challenges.value
})

// Tomorrow's challenges - same logic as today but for tomorrow
const tomorrowsChallenges = computed(() => {
  const userId = getCurrentUserId()
  const isLoggedIn = !!localStorage.getItem('token')
  
  if (!userId || !isLoggedIn) {
    return []
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  return challenges.value.filter(challenge => {
    // Must be active (not finished)
    if (isChallengeFinished(challenge)) return false
    
    // Must be a habit challenge (only habit challenges have daily completion)
    if (challenge.challengeType !== 'habit') return false
    
    // Must have started or start tomorrow (startDate <= tomorrow)
    if (challenge.startDate) {
      const startDate = new Date(challenge.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (startDate > tomorrow) return false
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
    
    // For "everyOtherDay" frequency, check if tomorrow is a valid completion day
    if (!isTomorrowValidForChallenge(challenge)) {
      return false
    }
    
    return true
  })
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

// Tomorrow's progress (challenges + steps)
const tomorrowTotalItems = computed(() => {
  return tomorrowsChallenges.value.length + tomorrowSteps.value.length
})

const tomorrowCompletedItems = computed(() => {
  // Tomorrow's items can't be completed yet, so always 0
  return 0
})

const tomorrowProgressPercentage = computed(() => {
  if (tomorrowTotalItems.value === 0) return 0
  return Math.round((tomorrowCompletedItems.value / tomorrowTotalItems.value) * 100)
})

const isAllCompleted = computed(() => {
  if (totalItems.value === 0) return false
  return completedItems.value === totalItems.value
})

// Count unfinished steps (not missions)
const unfinishedStepsCount = computed(() => {
  if (!checklistRef.value || !checklistRef.value.todaySteps) return 0
  return checklistRef.value.todaySteps.filter(step => !step.done).length
})

// Computed property to control dialog visibility - only show if actually completed
const shouldShowCompletionDialog = computed(() => {
  return showCompletionDialog.value && 
         isAllCompleted.value && 
         completedItems.value === totalItems.value && 
         totalItems.value > 0
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

// Check if dialog was dismissed today
function getDismissalKey() {
  const todayStr = new Date().toISOString().slice(0, 10) // UTC YYYY-MM-DD
  return `completion_dialog_dismissed_${todayStr}`
}

function hasDismissedToday() {
  try {
    return localStorage.getItem(getDismissalKey()) === 'true'
  } catch {
    return false
  }
}

function dismissDialogToday() {
  try {
    localStorage.setItem(getDismissalKey(), 'true')
  } catch {
    // ignore storage errors
  }
}

function closeCompletionDialog() {
  dismissDialogToday()
  showCompletionDialog.value = false
  hasShownCompletionDialog.value = true
}

// Function to check and show completion dialog
function checkAndShowCompletionDialog() {
  // Don't show if dismissed today
  if (hasDismissedToday()) {
    return
  }
  // Strict verification: all items must be completed
  const completed = completedItems.value
  const total = totalItems.value
  const allCompleted = total > 0 && completed === total
  
  console.log('checkAndShowCompletionDialog:', {
    completed,
    total,
    allCompleted,
    isAllCompleted: isAllCompleted.value,
    initialDataLoading: initialDataLoading.value,
    checklistLoading: checklistLoading.value,
    hasShownCompletionDialog: hasShownCompletionDialog.value,
    dismissedToday: hasDismissedToday()
  })
  
  // Additional checks
  if (
    !initialDataLoading.value &&
    !checklistLoading.value &&
    allCompleted &&
    isAllCompleted.value &&
    total > 0 &&
    !hasShownCompletionDialog.value &&
    !hasDismissedToday()
  ) {
    setTimeout(() => {
      // Final check before showing
      const finalCompleted = completedItems.value
      const finalTotal = totalItems.value
      if (finalTotal > 0 && finalCompleted === finalTotal && isAllCompleted.value && !hasDismissedToday()) {
        console.log('Showing completion dialog!')
        showCompletionDialog.value = true
        hasShownCompletionDialog.value = true
      }
    }, 300)
  }
}

watch(isAllCompleted, (val, oldVal) => {
  if (val) {
    tryAwardDailyBonusXp()
    // Show completion dialog when all tasks are completed (only once per completion)
    // Only show if transitioning from incomplete to complete and not dismissed today
    if (oldVal === false && !hasDismissedToday()) {
      // Wait for next tick to ensure all computed values are updated
      nextTick(() => {
        const completed = completedItems.value
        const total = totalItems.value
        // Strict check: completed must equal total and both must be > 0
        if (total > 0 && completed === total && completed === totalItems.value && !hasDismissedToday()) {
          checkAndShowCompletionDialog()
        }
      })
    }
  } else {
    // Close dialog and reset flags when tasks become incomplete
    if (showCompletionDialog.value) {
      showCompletionDialog.value = false
    }
    // Reset the shown flag so dialog can appear again when tasks are completed again
    hasShownCompletionDialog.value = false
    // Clear dismissal so dialog can show again if user completes tasks again
    try {
      localStorage.removeItem(getDismissalKey())
    } catch {
      // ignore storage errors
    }
  }
}, { immediate: false })

// Watch completion state and close dialog if tasks become incomplete
watch([completedItems, totalItems], ([completed, total], [oldCompleted, oldTotal]) => {
  // If dialog is open but tasks are no longer all completed, close it immediately
  if (showCompletionDialog.value) {
    if (total === 0 || completed !== total) {
      showCompletionDialog.value = false
      hasShownCompletionDialog.value = false
      // Clear dismissal so dialog can show again when tasks are completed again
      try {
        localStorage.removeItem(getDismissalKey())
      } catch {
        // ignore storage errors
      }
    }
  }
  
  // Check if we just completed all tasks (transition from incomplete to complete)
  const wasCompleted = oldTotal > 0 && oldCompleted === oldTotal
  const isNowCompleted = total > 0 && completed === total
  
  if (!wasCompleted && isNowCompleted && !initialDataLoading.value && !checklistLoading.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
    // User just completed all tasks - show dialog
    setTimeout(() => {
      checkAndShowCompletionDialog()
    }, 500)
  }
  
  // Reset flag and clear dismissal when tasks become incomplete so dialog can show again
  if (wasCompleted && !isNowCompleted) {
    hasShownCompletionDialog.value = false
    try {
      localStorage.removeItem(getDismissalKey())
    } catch {
      // ignore storage errors
    }
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
  // Check if we should show completion dialog after checklist update
  nextTick(() => {
    if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
      checkAndShowCompletionDialog()
    }
  })
})

watch(() => checklistRef.value?.loading, (newVal) => {
  if (newVal !== undefined) {
    checklistLoading.value = newVal
  }
})

onMounted(async () => {
  updateUser()
  await calculateStreak()
  await loadTodaysChallenges()
  window.addEventListener('auth-changed', updateUser)
  window.addEventListener('checklist-updated', () => {
    calculateStreak()
    nextTick(() => {
      updateChecklistLoading()
      // Check if we should show completion dialog after checklist update
      if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
        setTimeout(() => {
          checkAndShowCompletionDialog()
        }, 500)
      }
    })
  })
  window.addEventListener('challenge-updated', () => {
    loadTodaysChallenges()
    calculateStreak()
  })
  window.addEventListener('challenge-completed', () => {
    loadTodaysChallenges()
    calculateStreak()
    // Check if we should show completion dialog after challenge completion
    nextTick(() => {
      if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
        setTimeout(() => {
          checkAndShowCompletionDialog()
        }, 500)
      }
    })
  })
  window.addEventListener('participant-completed-days-updated', () => {
    loadTodaysChallenges()
    calculateStreak()
  })
  
  // Initial checklist loading state update
  await nextTick()
  updateChecklistLoading()
  
  // Wait for checklist to finish loading
  let attempts = 0
  const maxAttempts = 10
  while ((checklistLoading.value || initialDataLoading.value) && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  await nextTick()
  
  // Check if all tasks are completed after initial load
  setTimeout(() => {
    if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
      checkAndShowCompletionDialog()
    }
  }, 500)
})

// Recalculate streak when component is activated (navigated to)
onActivated(async () => {
  await calculateStreak()
  await loadTodaysChallenges()
  loadTomorrowSteps()
  // Wait for checklist to finish loading
  let attempts = 0
  const maxAttempts = 15
  while ((checklistLoading.value || initialDataLoading.value) && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  await nextTick()
  // Wait a bit more to ensure all computed values are updated
  setTimeout(() => {
    console.log('Component activated, checking completion:', {
      completed: completedItems.value,
      total: totalItems.value,
      isAllCompleted: isAllCompleted.value,
      hasShown: hasShownCompletionDialog.value,
      dismissed: hasDismissedToday(),
      checklistLoading: checklistLoading.value,
      initialLoading: initialDataLoading.value
    })
    if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
      checkAndShowCompletionDialog()
    }
  }, 1000)
})

// Watch route changes to recalculate streak when navigating to home
watch(() => route.path, async (newPath) => {
  if (newPath === '/') {
    await calculateStreak()
    await loadTodaysChallenges()
    loadTomorrowSteps()
    // Wait for checklist to finish loading
    let attempts = 0
    const maxAttempts = 15
    while ((checklistLoading.value || initialDataLoading.value) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    await nextTick()
    // Wait a bit more to ensure all computed values are updated
    setTimeout(() => {
      console.log('Route changed to /, checking completion:', {
        completed: completedItems.value,
        total: totalItems.value,
        isAllCompleted: isAllCompleted.value,
        hasShown: hasShownCompletionDialog.value,
        dismissed: hasDismissedToday(),
        checklistLoading: checklistLoading.value,
        initialLoading: initialDataLoading.value
      })
      if (isAllCompleted.value && !hasShownCompletionDialog.value && !hasDismissedToday()) {
        checkAndShowCompletionDialog()
      }
    }, 1000)
  }
})

// Watch activeTab to load tomorrow's steps when switching to tomorrow tab
watch(activeTab, (newTab) => {
  if (newTab === 'tomorrow') {
    loadTomorrowSteps()
  }
})

async function generateCompletionImage() {
  // Dismiss dialog for today when user generates image
  dismissDialogToday()
  showCompletionDialog.value = false
  hasShownCompletionDialog.value = true
  generatingImage.value = true
  try {
    await nextTick()
    
    const challenges = todaysChallenges.value.map(c => ({ 
      title: c.title,
      completedDays: getChallengeCompletedDays(c),
      totalDays: getChallengeTotalDays(c)
    }))
    const checklistTasks = (checklistRef.value?.todaySteps?.filter(s => s.done) || []).map(s => ({ title: s.title, done: true }))
    
    await generateImage({
      userName: userName.value,
      date: new Date(),
      challenges: challenges,
      checklistTasks: checklistTasks,
      streakDays: streakDays.value,
      locale: locale.value,
      t: t,
      includeMotivationalMessage: true,
      filenamePrefix: 'victory'
    })
  } catch (error) {
    console.error('Generation failed', error)
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
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 1.5em 1em;
  gap: 2em;
  box-sizing: border-box;
  overflow: visible !important;
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
  margin: 0;
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

.copy-to-tomorrow-btn {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  color: #7048E8 !important;
  text-transform: none !important;
  padding: 4px 12px !important;
  min-width: auto !important;
}

.copy-to-tomorrow-btn:hover {
  background: rgba(112, 72, 232, 0.08) !important;
}

.todays-cards-wrapper {
  width: 100%;
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 1em;
  flex-wrap: nowrap;
  box-sizing: border-box;
  overflow: visible !important;
  padding-right: 0;
}

.todays-cards-wrapper :deep(*) {
  overflow: visible !important;
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
  box-sizing: border-box;
  overflow: visible !important;
  min-width: 0;
  padding-right: 0 !important;
  margin-right: 0 !important;
}

.todays-checklist-card :deep(.v-card) {
  overflow: visible !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
}

.todays-checklist-card :deep(.v-card-text) {
  overflow: visible !important;
  padding: 16px !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  margin: 0 !important;
}

.checklist-card {
  background: #ffffff !important;
  border-radius: 24px !important;
  border: 1px solid rgba(0, 163, 255, 0.08) !important; /* Легкий голубой оттенок для отличия */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
}

.checklist-card :deep(.v-card) {
  overflow: visible !important;
  width: 100% !important;
  max-width: 100% !important;
  border: 1px solid rgba(0, 163, 255, 0.08) !important;
}

.checklist-card :deep(.v-card-text) {
  overflow: visible !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.checklist-card :deep(.daily-checklist-content) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.checklist-card-empty {
  background: #ffffff !important;
  border: 2px dashed rgba(112, 72, 232, 0.2) !important; /* Светло-фиолетовый пунктир */
  border-radius: 24px !important;
  padding: 24px !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  position: relative !important;
  transition: all 0.3s ease !important;
  box-shadow: none !important;
}

.checklist-card-tomorrow {
  border: 2px dashed rgba(112, 72, 232, 0.2) !important; /* Светло-фиолетовый пунктир */
}

.checklist-card-empty:hover {
  border-color: rgba(112, 72, 232, 0.4) !important;
  background: rgba(112, 72, 232, 0.01) !important;
}

@media (max-width: 959px) {
  .hero-progress-light {
    margin-bottom: 1.5em;
  }
  
  .todays-cards-wrapper {
    flex-direction: column;
  }
  
  .todays-challenges-card,
  .todays-checklist-card {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .challenge-card {
    padding: 10px 14px !important;
  }
}

.todays-challenges-section {
  margin-bottom: 0;
}

.todays-checklist-section {
  margin-top: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
  padding-right: 0;
}

.todays-checklist-section :deep(*) {
  max-width: 100%;
  box-sizing: border-box;
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
  max-width: 100%;
  margin-bottom: 3em;
  box-sizing: border-box;
}

/* Reduce margin on mobile */
@media (max-width: 959px) {
  .hero-progress-light {
    margin-bottom: 1.5em;
  }
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
  overflow: visible; /* Allow glow effect to be visible */
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); /* Эффект глубины */
  position: relative;
}

.progress-fill-vibrant {
  height: 100%;
  /* Градиент от фиолетового к розовому — выглядит энергично */
  background: linear-gradient(90deg, #7048E8 0%, #BE4BDB 100%);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(112, 72, 232, 0.3);
  transition: width 0.5s ease-in-out;
  position: relative;
}

/* Тот самый "эффект зажигания" на кончике */
/* Тот самый "эффект зажигания" на кончике - только когда есть прогресс */
.progress-fill-vibrant.has-progress::after {
  content: '';
  position: absolute;
  right: -5px; /* Выносим чуть вперед за край полосы */
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #F4A782; /* Твой оранжевый Ignite */
  border-radius: 50%;
  
  /* Создаем эффект свечения */
  box-shadow: 
    0 0 10px #F4A782, 
    0 0 20px #F4A782, 
    0 0 5px #FFFFFF;
    
  /* Добавим легкую пульсацию, чтобы "огонек" казался живым */
  animation: ignite-pulse 1.5s infinite alternate;
}

@keyframes ignite-pulse {
  from {
    transform: translateY(-50%) scale(1);
    opacity: 0.8;
  }
  to {
    transform: translateY(-50%) scale(1.3);
    opacity: 1;
    box-shadow: 0 0 15px #F4A782, 0 0 25px #F4A782;
  }
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
  cursor: pointer;
  position: relative;
}

.challenge-icon:hover {
  background: #E8E0FF; /* Более яркий фиолетовый при наведении */
  transform: scale(1.1);
}

/* Hover effect: transform flag to check icon */
.challenge-icon.has-hover {
  position: relative;
}

.challenge-icon.has-hover .flag-icon {
  opacity: 1;
  transition: opacity 0.2s ease;
}

.challenge-icon.has-hover .check-icon-hover {
  position: absolute;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.challenge-icon.has-hover:hover .flag-icon {
  opacity: 0;
}

.challenge-icon.has-hover:hover .check-icon-hover {
  opacity: 1;
}

/* Текст челленджа */
.challenge-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: #2D3436;
  transition: color 0.3s ease;
  flex: 1;
  cursor: pointer;
}

/* Прогресс челленджа (completedDays/total) */
.challenge-progress {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: #7E46C4;
  opacity: 0.8;
  transition: color 0.3s ease, opacity 0.3s ease;
  margin-left: auto;
  white-space: nowrap;
  cursor: pointer;
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

.challenge-progress.completed {
  color: #94A3B8;
  opacity: 0.6;
}

/* Disabled challenge card for tomorrow tab */
.challenge-card-disabled {
  opacity: 0.6;
  cursor: not-allowed !important;
  pointer-events: none;
}

.challenge-card-disabled .challenge-icon {
  background: rgba(148, 163, 184, 0.1) !important;
}

.challenge-text-disabled {
  color: #94A3B8 !important;
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

/* Карта в стиле "Космическое стекло" */
.completion-dialog-card {
  /* Темный фон для контраста с яркой кнопкой */
  background: rgba(26, 26, 46, 0.95) !important; 
  backdrop-filter: blur(20px);
  /* Мягкая фиолетовая граница */
  border: 2px solid rgba(126, 70, 196, 0.3) !important;
  border-radius: 32px !important;
  position: relative;
  overflow: visible !important;
}

/* Фоновое свечение (Туманность) в новых цветах */
.glow-bg {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(244, 167, 130, 0.15) 0%, rgba(126, 70, 196, 0.1) 50%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

/* Обертка иконки (Градиент от фиолетового к персику) */
.icon-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #7E46C4 0%, #F4A782 100%);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 15px 35px rgba(126, 70, 196, 0.4);
  animation: float 3s ease-in-out infinite;
}

/* Заголовок */
.completion-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 900;
  font-size: 1.85rem;
  color: #FFFFFF;
  /* Легкое свечение текста в тон персика */
  text-shadow: 0 0 15px rgba(244, 167, 130, 0.2);
}

/* Сообщение */
.completion-message {
  font-size: 1rem;
  color: #D1D5DB; 
  line-height: 1.6;
}

/* ОБНОВЛЕННАЯ КНОПКА (Твой градиент) */
.celebration-button {
  /* Градиент от #7E46C4 к #F4A782 */
  background: linear-gradient(90deg, #7E46C4 0%, #F4A782 100%) !important;
  color: white !important;
  border-radius: 18px !important;
  font-weight: 800 !important;
  font-size: 1.1rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  box-shadow: 0 10px 25px rgba(126, 70, 196, 0.3) !important;
  border: none !important;
}

.celebration-button:hover {
  transform: scale(1.03) translateY(-3px);
  /* Усиливаем свечение при наведении */
  box-shadow: 0 15px 35px rgba(244, 167, 130, 0.4) !important;
  filter: brightness(1.1);
}

/* Кнопка закрытия (X) в правом верхнем углу */
.dialog-close-btn {
  position: absolute !important;
  top: 16px !important;
  right: 16px !important;
  z-index: 10 !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s ease !important;
}

.dialog-close-btn:hover {
  color: #FFFFFF !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: scale(1.1);
}

/* Анимация парения */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* Tomorrow Steps Empty State */
.tomorrow-steps-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  min-height: 200px;
}

.tomorrow-empty-icon {
  width: 140px;
  margin-bottom: 20px;
  filter: drop-shadow(0 10px 15px rgba(112, 72, 232, 0.1));
}

.tomorrow-empty-text {
  color: #94A3B8;
  font-size: 0.95rem;
  max-width: 300px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.plan-step-btn {
  background: linear-gradient(135deg, #FF8C42 0%, #7048E8 100%) !important;
  color: white !important;
  border-radius: 14px !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  padding: 6px 32px !important;
  text-transform: none !important;
  box-shadow: 0 4px 15px rgba(255, 140, 66, 0.25) !important;
  transition: all 0.3s ease !important;
}

.plan-step-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(112, 72, 232, 0.35) !important;
  filter: brightness(1.05);
}

/* Tomorrow Steps Content */
.tomorrow-steps-content {
  width: 100%;
}

.tomorrow-steps-content .checklist-list {
  margin-top: 16px;
  min-height: 50px;
}

.tomorrow-steps-content .checklist-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid #F8F9FA;
  transition: all 0.2s ease;
}

.tomorrow-steps-content .step-text {
  font-size: 0.9rem;
  color: #4A5568;
  font-family: 'Plus Jakarta Sans', sans-serif;
  flex: 1;
  word-wrap: break-word;
  cursor: text;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.tomorrow-steps-content .step-text:hover {
  background: rgba(112, 72, 232, 0.05);
}

.tomorrow-steps-content .step-edit-input {
  flex: 1;
  border: 2px solid #7048E8;
  background: #ffffff;
  padding: 4px 8px;
  font-size: 0.9rem;
  color: #1A1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
  border-radius: 4px;
  outline: none;
}

.tomorrow-steps-content .delete-action {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  color: #94A3B8;
  transition: all 0.2s ease;
}

.tomorrow-steps-content .delete-action:hover {
  color: #EF4444;
  background: #FEF2F2;
  transform: scale(1.1);
}

.tomorrow-steps-content .add-step-wrapper {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  background: #F8FAFC;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
}

.tomorrow-steps-content .step-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  font-size: 0.85rem;
  outline: none;
  color: #1A1A2E;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.tomorrow-steps-content .step-input::placeholder {
  color: #A0AEC0;
}

.tomorrow-steps-content .add-step-btn {
  background: #7048E8 !important;
  color: white !important;
  border-radius: 10px !important;
  height: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  padding: 0 !important;
}

/* Tabs styling - align left */
.home-tabs {
  width: 100%;
  align-self: flex-start;
}

.home-tabs :deep(.v-tabs) {
  justify-content: flex-start;
}

.home-tabs :deep(.v-tab) {
  text-align: left;
  color: #7048E8 !important;
  border-radius: 12px !important;
}

/* Ensure v-window uses full width */
.home-logged-in-container :deep(.v-window) {
  width: 100%;
  max-width: 100%;
  overflow: visible !important;
}

.home-logged-in-container :deep(.v-window-item) {
  width: 100%;
  max-width: 100%;
  overflow: visible !important;
}

.home-logged-in-container :deep(.v-window-item__wrapper) {
  width: 100%;
  max-width: 100%;
  overflow: visible !important;
  padding-right: 0 !important;
  margin-right: 0 !important;
}

/* Ensure v-cards use full width */
.home-logged-in-container :deep(.v-card) {
  width: 100%;
  max-width: 100%;
  overflow: visible !important;
}

.home-logged-in-container :deep(.v-card-text) {
  width: 100%;
  box-sizing: border-box;
  overflow: visible !important;
  padding: 16px !important;
}
</style>
