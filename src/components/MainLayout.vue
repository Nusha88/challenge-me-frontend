<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'
import NotificationsComponent from './NotificationsComponent.vue'
import { notificationService, userService, challengeService } from '../services/api'
import { initializePushNotifications, syncPushSubscriptionToServer } from '../utils/pushNotifications'
import { getLevelFromXp, getXpForLevel, getXpForNextLevel, getLevelName, getRank, getXpPerLevel } from '../utils/levelSystem'
import { Sparkles, Mountain, BookOpen, Compass, Eye, Trophy, Star, Globe2, Coins, LogOut } from 'lucide-vue-next'
import awaImage from '../assets/awa.png'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.name)
const isLoggedIn = ref(!!localStorage.getItem('token'))
const notificationsDrawerOpen = ref(false)
const unreadNotificationCount = ref(0)
const streakDays = ref(0)
const yesterdayStreakDays = ref(0)
const hasTodayCompletedTasks = ref(false)

function readStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}
const isAuthPage = computed(() => {
  return ['login', 'register', 'forgot-password'].includes(route.name) || 
         route.path === '/login' || 
         route.path === '/register'
})

const currentUser = ref(readStoredUser())
const { t, locale } = useI18n()
const { mobile, mdAndUp } = useDisplay()
const availableLocales = SUPPORTED_LOCALES

function updateAuthState() {
  const wasLoggedIn = isLoggedIn.value
  isLoggedIn.value = !!localStorage.getItem('token')
  currentUser.value = readStoredUser()
  
  // Initialize push notifications when user logs in
  // Wait a bit to ensure token is stored and axios interceptors are ready
  if (isLoggedIn.value && !wasLoggedIn) {
    setTimeout(() => {
      const token = localStorage.getItem('token')
      if (token) {
        initializePushNotifications()
      }
    }, 1000)
  }
}

const userName = computed(() => currentUser.value?.name || null)
const userAvatarUrl = computed(() => currentUser.value?.avatarUrl || null)
const userXp = computed(() => Number(currentUser.value?.xp || 0))
const userLevel = computed(() => getLevelFromXp(userXp.value))
const userRank = computed(() => getRank(userLevel.value))
const userLevelName = computed(() => getLevelName(userLevel.value, locale.value))
const xpForCurrentLevel = computed(() => getXpForLevel(userLevel.value))
const xpForNextLevel = computed(() => getXpForNextLevel(userLevel.value))
const xpProgress = computed(() => Math.max(0, userXp.value - xpForCurrentLevel.value))
const xpNeeded = computed(() => Math.max(0, xpForNextLevel.value - userXp.value))
const xpDisplayCurrent = computed(() => userXp.value)
const xpDisplayNeeded = computed(() => xpForNextLevel.value)
const levelProgressPercentage = computed(() => {
  const range = xpForNextLevel.value - xpForCurrentLevel.value
  if (range <= 0) return 100
  return Math.min(100, Math.max(0, (xpProgress.value / range) * 100))
})

// Get current XP (XP progress within current level)
const getCurrentXp = () => {
  return userXp.value - xpForCurrentLevel.value
}

// Get level info (rank, color, xpPerLvl, rankName)
const getLevelInfo = (level) => {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  const rank = getRank(lvl)
  const xpPerLvl = getXpPerLevel(lvl)
  
  // Get rank name based on level
  let rankName = 'Explorer'
  if (lvl >= 100) rankName = 'Legend'
  else if (lvl >= 41) rankName = 'Grandmaster'
  else if (lvl >= 21) rankName = 'Master'
  else if (lvl >= 11) rankName = 'Warrior'
  else if (lvl >= 6) rankName = 'Adept'
  
  // Get color based on rank
  let color = '#2196F3' // Explorer - blue
  if (rank === 'VI') color = '#FF4500' // Legend - orange red
  else if (rank === 'V') color = '#9400D3' // Grandmaster - purple
  else if (rank === 'IV') color = '#FFD700' // Master - gold
  else if (rank === 'III') color = '#C0C0C0' // Warrior - silver
  else if (rank === 'II') color = '#4CAF50' // Adept - green
  else color = '#2196F3' // Explorer - blue
  
  return {
    rank,
    color,
    xpPerLvl,
    rankName
  }
}

const getUserInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

const currentLocaleLabel = computed(() => {
  return availableLocales.find(lang => lang.code === locale.value)?.label || locale.value
})

const drawerOpen = ref(false)

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

// Ensure drawer is closed when route changes on mobile
watch(currentRoute, () => {
  if (mobile.value) {
    drawerOpen.value = false
  }
})

onMounted(() => {
  window.addEventListener('auth-changed', updateAuthState)
  window.addEventListener('checklist-updated', calculateStreak)
  window.addEventListener('challenge-completed', calculateStreak)
  window.addEventListener('participant-completed-days-updated', calculateStreak)
  updateAuthState()
  if (isLoggedIn.value) {
    loadUnreadNotificationCount()
    calculateStreak()
    initializePushNotifications()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', updateAuthState)
  window.removeEventListener('checklist-updated', calculateStreak)
  window.removeEventListener('challenge-completed', calculateStreak)
  window.removeEventListener('participant-completed-days-updated', calculateStreak)
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('auth-changed'))
  router.push('/login')
}

function changeLanguage(code) {
  setLocale(code)
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

async function loadUnreadNotificationCount() {
  const userId = getCurrentUserId()
  if (!userId || !isLoggedIn.value) return

  try {
    const { data } = await notificationService.getUnreadCount(userId)
    unreadNotificationCount.value = data.count || 0
    
    // If this API call succeeds, token is valid - try to sync push subscription
    // Delay significantly to ensure we're fully logged in and token is stable
    setTimeout(() => {
      // Double-check we're still logged in before syncing
      if (localStorage.getItem('token') && isLoggedIn.value) {
        syncPushSubscriptionIfNeeded()
      }
    }, 3000)
  } catch (error) {
    console.error('Error loading unread notification count:', error)
  }
}

async function syncPushSubscriptionIfNeeded() {
  // Use the exported function
  await syncPushSubscriptionToServer()
}

function openNotifications() {
  notificationsDrawerOpen.value = !notificationsDrawerOpen.value
}

function closeNotifications() {
  notificationsDrawerOpen.value = false
}

function handleUnreadCountChanged(newCount) {
  unreadNotificationCount.value = newCount
}

function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  if (!userId || !isLoggedIn.value) {
    streakDays.value = 0
    yesterdayStreakDays.value = 0
    hasTodayCompletedTasks.value = false
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
  } catch (error) {
    console.error('Error calculating streak:', error)
    streakDays.value = 0
    yesterdayStreakDays.value = 0
    hasTodayCompletedTasks.value = false
  }
}

// Display streak: show yesterday's streak in grey if today isn't completed, otherwise show today's streak
const displayStreakDays = computed(() => {
  if (hasTodayCompletedTasks.value) {
    return streakDays.value
  } else if (yesterdayStreakDays.value > 0) {
    return yesterdayStreakDays.value
  }
  return streakDays.value
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

watch(() => isLoggedIn.value, (loggedIn) => {
  if (loggedIn) {
    loadUnreadNotificationCount()
    calculateStreak()
    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
      if (isLoggedIn.value) {
        loadUnreadNotificationCount()
        calculateStreak()
      } else {
        clearInterval(pollInterval)
      }
    }, 30000)
  } else {
    unreadNotificationCount.value = 0
    streakDays.value = 0
    yesterdayStreakDays.value = 0
    hasTodayCompletedTasks.value = false
  }
})

// Watch route changes to recalculate streak when navigating
watch(() => route.path, () => {
  if (isLoggedIn.value) {
    calculateStreak()
  }
})
</script>

<template>
  <v-app>
    <v-app-bar v-if="!isAuthPage" class="app-bar-custom" elevation="0" :fixed="false">
      <div class="header-content-wrapper">
        <!-- Left Section: Streak Button -->
        <div class="header-section header-left">
      <v-app-bar-nav-icon
        v-if="isLoggedIn"
        @click="toggleDrawer"
        class="d-md-none"
      ></v-app-bar-nav-icon>
          <div
            v-if="isLoggedIn && (displayStreakDays > 0 || (!hasTodayCompletedTasks && yesterdayStreakDays > 0))"
            class="streak-button d-none d-md-inline-flex"
            :class="{ 'streak-yesterday': !hasTodayCompletedTasks && yesterdayStreakDays > 0 }"
          >
            <i class="mdi mdi-fire"></i>
            <span>{{ (!hasTodayCompletedTasks && yesterdayStreakDays > 0) ? yesterdayStreakDays : displayStreakDays }} {{ streakDaysText }}</span>
          </div>
        </div>
        
        <!-- Center Section: Logo / Buttons (mobile) -->
        <div class="header-section header-center">
      <router-link 
        v-if="isLoggedIn || route.path !== '/'"
        to="/" 
        class="brand-link"
          >
            <img :src="awaImage" alt="Awa" class="brand-logo" />
          </router-link>
          <!-- Mobile: Buttons in center when not logged in and on index page -->
          <div v-if="!isLoggedIn && route.path === '/' && mobile" class="d-flex align-center gap-2">
            <v-btn
              v-if="route.path !== '/register'"
              to="/register"
              variant="elevated"
              class="sign-up-button"
              style="color: white;"
            >
              {{ t('navigation.register') }}
            </v-btn>
            <v-btn
              v-if="route.path !== '/login'"
              to="/login"
              variant="outlined"
              class="login-button"
              style="border-color: #3C60E8; color: #3C60E8; border-width: 2px;"
            >
              {{ t('navigation.login') }}
            </v-btn>
          </div>
      </div>
        
        <!-- Right Section: Buttons (desktop or logged in) -->
        <div class="header-section header-right">
      <v-btn
        v-if="!isLoggedIn && route.path !== '/register' && (!mobile || route.path !== '/')"
        to="/register"
        variant="elevated"
        class="mr-2 sign-up-button"
        style="color: white;"
      >
        {{ t('navigation.register') }}
      </v-btn>
      <v-btn
        v-if="!isLoggedIn && route.path !== '/login' && (!mobile || route.path !== '/')"
        to="/login"
        variant="outlined"
        class="mr-2 login-button"
        style="border-color: #3C60E8; color: #3C60E8; border-width: 2px;"
      >
        {{ t('navigation.login') }}
      </v-btn>
      <v-btn
  v-if="isLoggedIn"
  to="/missions/add"
  variant="elevated"
  size="large"
  class="mr-2 cta-button-cyber d-none d-md-inline-flex"
>
  <template v-slot:prepend>
    <v-icon class="icon-pulse">mdi-flare</v-icon>
  </template>
  {{ t('navigation.addChallenge') }}
</v-btn>
      <v-btn
        v-if="isLoggedIn"
        variant="text"
            class="mr-2 notification-button"
            style="color: rgba(0, 0, 0, 0.87); position: relative;"
            @click="openNotifications"
      >
            <v-icon>mdi-bell</v-icon>
            <v-badge
              v-if="unreadNotificationCount > 0"
              :content="unreadNotificationCount > 99 ? '99+' : unreadNotificationCount"
              color="error"
              overlap
              class="notification-badge"
            >
            </v-badge>
      </v-btn>
        </div>
      </div>
    </v-app-bar>

    <!-- FAB Button for Mobile -->
      <v-btn
       v-if="isLoggedIn && !isAuthPage"
      to="/missions/add"
      class="fab-button d-md-none"
      color="primary"
      icon="mdi-plus"
      size="large"
      location="bottom end"
      app
    >
      </v-btn>

    <v-main :class="['main-content', { 'public-view': !isLoggedIn, 
        'with-sidebar': isLoggedIn && !isAuthPage,
        'auth-layout': isAuthPage }]">
      <div class="main-content-wrapper">
        <!-- Desktop Permanent Sidebar -->
        <v-navigation-drawer
          v-if="isLoggedIn && !isAuthPage"
          permanent
          class="d-none d-md-block desktop-sidebar sidebar-column"
        >
          <div class="sidebar-content-wrapper">
          <v-list>
              <!-- User Section -->
              <div class="sidebar-user-section pa-3">
                <div class="d-flex align-center mb-3 sidebar-user-clickable" @click="router.push('/profile')">
                  <v-avatar size="40" class="sidebar-avatar mr-3">
                    <v-img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="userName || ''" cover></v-img>
                    <span v-else class="sidebar-avatar-initials">{{ getUserInitials(userName) }}</span>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-body-1 font-weight-medium">{{ userName || t('navigation.profile') }}</div>
                    <div class="text-caption text-medium-emphasis">{{ userLevelName }} ({{ t('navigation.rank') }} {{ userRank }})</div>
                  </div>
                </div>

                <!-- Level Progress Bar -->
                <div class="pa-2">
                  <div class="xp-sidebar-card">
                    <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
                      <span :style="{ color: getLevelInfo(userLevel).color }">
                        {{ getLevelInfo(userLevel).rank }} (Lvl {{ userLevel }})
                      </span>
                      <span class="text-grey-darken-1">{{ getCurrentXp() }} / {{ getLevelInfo(userLevel).xpPerLvl }} XP</span>
                    </div>
                    
                    <v-progress-linear 
                      :model-value="(getCurrentXp() / getLevelInfo(userLevel).xpPerLvl) * 100" 
                      :color="getLevelInfo(userLevel).color" 
                      height="8" 
                      rounded
                      striped
                    ></v-progress-linear>
                  </div>
                </div>
              </div>

              <v-divider class="my-2"></v-divider>

              <!-- YOUR JOURNEY Section -->
              <div class="sidebar-menu-card mb-4">
  <v-list-subheader class="sidebar-section-header">
    <Star :size="14" class="sidebar-section-icon ml-8" />
    {{ t('navigation.yourJourney') }}
  </v-list-subheader>

  <v-list-item to="/" :active="currentRoute === 'home'" color="primary">
    <template v-slot:prepend>
      <Sparkles :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.today') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/missions/my" :active="currentRoute === 'my-challenges'" color="primary">
    <template v-slot:prepend>
      <Mountain :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.myChallenges') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/checklists/history" :active="currentRoute === 'checklists-history'" color="primary">
    <template v-slot:prepend>
      <BookOpen :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.checklistHistory') }}</v-list-item-title>
  </v-list-item>
</div>

<div class="sidebar-menu-card mb-4">
  <v-list-subheader class="sidebar-section-header">
    <Globe2 :size="14" class="sidebar-section-icon ml-8" />
    {{ t('navigation.world') }}
  </v-list-subheader>

  <v-list-item to="/missions" :active="currentRoute === 'challenges'" color="primary">
    <template v-slot:prepend>
      <Compass :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.allChallenges') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/missions/watched" :active="currentRoute === 'watched-challenges'" color="primary">
    <template v-slot:prepend>
      <Eye :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.interested') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/heroes" :active="currentRoute === 'users'" color="primary">
    <template v-slot:prepend>
      <Trophy :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.allUsers') }}</v-list-item-title>
  </v-list-item>
</div>

<div class="sidebar-menu-card logout-card mt-auto mb-4">
  <v-list-item class="logout-item" @click="logout(); if(drawerOpen) drawerOpen = false">
    <template v-slot:prepend>
      <LogOut :size="20" class="logout-icon sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title class="logout-text">{{ t('navigation.logout') }}</v-list-item-title>
  </v-list-item>
</div>

          </v-list>
          </div>
        </v-navigation-drawer>

        <div :class="['main-content-inner', { 'content-column': isLoggedIn && !isAuthPage, 
            'full-column': !isLoggedIn || isAuthPage}]">
          <router-view></router-view>
        </div>
      </div>
    </v-main>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-if="!isAuthPage"
      :model-value="drawerOpen"
      @update:model-value="drawerOpen = $event"
      temporary
      location="start"
      class="d-md-none mobile-drawer"
    >
      <div class="sidebar-content-wrapper">
      <v-list>
        <!-- User Section -->
        <div class="sidebar-user-section pa-3">
          <div class="d-flex align-center mb-3 sidebar-user-clickable" @click="router.push('/profile'); drawerOpen = false">
            <v-avatar size="40" class="sidebar-avatar mr-3">
              <v-img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="userName || ''" cover></v-img>
              <span v-else class="sidebar-avatar-initials">{{ getUserInitials(userName) }}</span>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-body-1 font-weight-medium">{{ userName || t('navigation.profile') }}</div>
              <div class="text-caption text-medium-emphasis">{{ userLevelName }} ({{ t('navigation.rank') }} {{ userRank }})</div>
            </div>
          </div>

          <!-- Level Progress Bar -->
          <div class="pa-2">
            <div class="xp-sidebar-card">
              <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
                <span :style="{ color: getLevelInfo(userLevel).color }">
                  {{ getLevelInfo(userLevel).rank }} (Lvl {{ userLevel }})
                </span>
                <span class="text-grey-darken-1">{{ getCurrentXp() }} / {{ getLevelInfo(userLevel).xpPerLvl }} XP</span>
              </div>
              
              <v-progress-linear 
                :model-value="(getCurrentXp() / getLevelInfo(userLevel).xpPerLvl) * 100" 
                :color="getLevelInfo(userLevel).color" 
                height="8" 
                rounded
                striped
              ></v-progress-linear>
            </div>
          </div>
        </div>

        <v-divider class="my-2"></v-divider>

        <!-- YOUR JOURNEY Section -->
        <div class="sidebar-menu-card mb-4">
  <v-list-subheader class="sidebar-section-header">
    <Star :size="14" class="sidebar-section-icon ml-8" />
    {{ t('navigation.yourJourney') }}
  </v-list-subheader>

  <v-list-item to="/" :active="currentRoute === 'home'" color="primary">
    <template v-slot:prepend>
      <Sparkles :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.today') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/missions/my" :active="currentRoute === 'my-challenges'" color="primary">
    <template v-slot:prepend>
      <Mountain :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.myChallenges') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/checklists/history" :active="currentRoute === 'checklists-history'" color="primary">
    <template v-slot:prepend>
      <BookOpen :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.checklistHistory') }}</v-list-item-title>
  </v-list-item>
</div>

<div class="sidebar-menu-card mb-4">
  <v-list-subheader class="sidebar-section-header">
    <Globe2 :size="14" class="sidebar-section-icon ml-8" />
    {{ t('navigation.world') }}
  </v-list-subheader>

  <v-list-item to="/missions" :active="currentRoute === 'challenges'" color="primary">
    <template v-slot:prepend>
      <Compass :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.allChallenges') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/missions/watched" :active="currentRoute === 'watched-challenges'" color="primary">
    <template v-slot:prepend>
      <Eye :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.interested') }}</v-list-item-title>
  </v-list-item>

  <v-list-item to="/heroes" :active="currentRoute === 'users'" color="primary">
    <template v-slot:prepend>
      <Trophy :size="20" class="sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title>{{ t('navigation.allUsers') }}</v-list-item-title>
  </v-list-item>
</div>

<div class="sidebar-menu-card logout-card mt-auto mb-4">
  <v-list-item class="logout-item" @click="logout(); if(drawerOpen) drawerOpen = false">
    <template v-slot:prepend>
      <LogOut :size="20" class="logout-icon sidebar-lucide-icon mr-2" />
    </template>
    <v-list-item-title class="logout-text">{{ t('navigation.logout') }}</v-list-item-title>
  </v-list-item>
</div>

      </v-list>
      </div>
    </v-navigation-drawer>

    <!-- Notifications Sidebar -->
    <NotificationsComponent
      v-model="notificationsDrawerOpen"
      :current-user-id="getCurrentUserId()"
      @unread-count-changed="handleUnreadCountChanged"
      @close="closeNotifications"
    />
  </v-app>
</template>

<style scoped>

.v-navigation-drawer {
  width: auto;
}

.main-content-wrapper {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  width: 100%;
  height: 100%;
  gap: 1em;
}

.main-content-inner.full-column {
  grid-column: 1 / -1;
}

.main-content-inner.content-column {
  grid-column: 3 / -1;
}

.sidebar-column {
  grid-column: 1 / 3;
}

@media (max-width: 959px) {
  .main-content-wrapper {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .main-content-inner.content-column {
    grid-column: 1 / -1;
  }
}


.desktop-sidebar :deep(.v-navigation-drawer) {
  top: 0 !important;
}

.desktop-sidebar :deep(.v-list) {
  padding-top: 0;
}

.desktop-sidebar :deep(.v-navigation-drawer__content) {
  padding-top: 0;
  background-color: transparent;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.desktop-sidebar :deep(.v-navigation-drawer__border) {
  display: none !important;
}

.mobile-drawer {
  z-index: 2000;
  background-color: #131323;
}

.mobile-drawer :deep(.v-list-item-title) {
  font-size: 0.95rem;
}

@media (max-width: 600px) {
  .mobile-drawer {
    width: 280px !important;
  }

  .mobile-drawer :deep(.v-list-item-title) {
    font-size: 0.9rem;
  }

  .mobile-drawer :deep(.v-icon) {
    font-size: 20px;
  }

  .mobile-drawer :deep(.v-avatar) {
    width: 28px !important;
    height: 28px !important;
  }

  .mobile-drawer .sidebar-avatar-initials {
    font-size: 12px;
  }
}

.desktop-sidebar :deep(.v-list-item-title) {
  font-size: 0.95rem;
}

@media (min-width: 960px) and (max-width: 1279px) {
  .desktop-sidebar {
    width: 220px !important;
  }

  .desktop-sidebar :deep(.v-list-item-title) {
    font-size: 0.9rem;
  }

  .desktop-sidebar :deep(.v-icon) {
    font-size: 20px;
  }
}

@media (min-width: 1280px) {
  .desktop-sidebar {
    width: 256px !important;
  }
}

@media (max-width: 959px) {
  .desktop-sidebar {
    display: none !important;
    visibility: hidden !important;
  }
  
  .main-content.with-sidebar {
    margin-left: 0 !important;
  }
  
  /* Control mobile drawer position */
  .mobile-drawer:not(.v-navigation-drawer--active) {
    left: -280px !important;
    transform: translateX(0) !important;
  }
  
  .mobile-drawer.v-navigation-drawer--active {
    left: 0 !important;
  }
  
  /* Control scrim position on mobile */
  .mobile-drawer ~ .v-navigation-drawer__scrim,
  .v-navigation-drawer__scrim {
    left: 2em !important;
  }
}

.v-list-item {
  margin: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.v-list-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(90deg, #7C4DFF, #536DFE);
  transform: scaleY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-list-item :deep(.v-list-item__prepend) {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-list-item:not(.v-list-item--active):not(.active):hover :deep(.v-list-item__prepend) {
  transform: scale(1.1);
}

.v-list-item :deep(.v-icon) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #ffffff;
}

.v-list-item:not(.v-list-item--active):not(.active):hover :deep(.v-icon) {
  transform: scale(1.15) rotate(5deg);
  color: #7C4DFF;
}

.v-list-item :deep(.v-list-item-title) {
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  color: #ffffff;
}


.v-application {
  background-color: transparent !important;
}

.main-content {
  padding: 1em;
  min-height: auto;
  width: 100%;
  margin: 0;
  background-color: transparent;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 0 0 12px 12px;
}

.main-content.with-sidebar .main-content-wrapper {
  gap: 1em;
}

.main-content.public-view .main-content-wrapper {
  gap: 0;
}


@media (max-width: 959px) {
  .main-content {
    border-radius: 0;
    padding-top: 1em;
  }
}


.today-button {
  font-weight: 600;
  border-radius: 10px;
  padding-left: 16px;
  padding-right: 16px;
  background: transparent !important;
  border: 1px solid rgba(31, 160, 246, 0.2);
  color: #1565C0 !important;
  transition: all 0.2s ease;
}

.today-button :deep(.v-btn__content) {
  color: #1565C0 !important;
}

.today-button :deep(.v-icon) {
  color: #1565C0 !important;
}

.today-button:hover {
  background: transparent !important;
  border-color: rgba(31, 160, 246, 0.3);
  transform: translateY(-1px);
}

.today-button-mobile {
  font-weight: 600;
  border-radius: 10px;
  padding-left: 12px;
  padding-right: 12px;
  background: linear-gradient(135deg, rgba(31, 160, 246, 0.1) 0%, rgba(166, 46, 232, 0.1) 100%) !important;
  border: 1px solid rgba(31, 160, 246, 0.2);
  color: #1565C0 !important;
  transition: all 0.2s ease;
}

.today-button-mobile :deep(.v-btn__content) {
  color: #1565C0 !important;
}

.today-button-mobile :deep(.v-icon) {
  color: #1565C0 !important;
}

.today-button-mobile:hover {
  background: linear-gradient(135deg, rgba(31, 160, 246, 0.15) 0%, rgba(166, 46, 232, 0.15) 100%) !important;
  border-color: rgba(31, 160, 246, 0.3);
}

.brand-link {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  letter-spacing: 0.04em;
  padding-left: 8px;
  display: inline-flex;
  align-items: center;
  background-color: transparent;
  height: 100%;
}

@media (min-width: 600px) {
  .brand-link {
    font-size: 1.25rem;
    padding-left: 16px;
  }
}

.brand-link:hover,
.brand-link:focus,
.brand-link:active {
  text-decoration: none;
  background-color: transparent;
}


.brand-link-centered {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.sidebar-avatar {
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  background: #7048E8; /* Цвет фона для инициалов */
  color: white;
}

.sidebar-avatar-initials {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
}

.level-progress-section {
  margin: 8px 16px;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
}

.level-progress-title {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 600;
  text-align: center;
}

.level-progress-header {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
}

.level-badge {
  background: #C0C0C0;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.level-number {
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.xp-sidebar-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 8px;
}

.level-progress-bar {
  background-color: rgba(0, 0, 0, 0.05) !important; /* Цвет дорожки */
}

/* Стилизация внутренней части v-progress-linear (Vuetify) */
.level-progress-bar :deep(.v-progress-linear__determinate) {
  background: linear-gradient(90deg, #7048E8 0%, #BE4BDB 100%) !important;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(112, 72, 232, 0.4);
}

.level-progress-bar :deep(.v-progress-linear__background) {
  background-color: rgba(0, 0, 0, 0.05) !important;
}


@media (max-width: 959px) {
  .app-bar-custom {
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: 0;
    z-index: 1000;
    width: 100%;
  }
  
  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0.5em;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 0.25em;
    min-height: 56px;
    align-items: center;
  }
  
  .header-content-wrapper {
    gap: 12px;
  }
  
  .header-left {
    min-width: auto;
    flex: 0 0 auto;
  }
  
  .header-center {
    flex: 1;
    justify-content: center;
  }
  
  .header-center .d-flex {
    justify-content: center;
    gap: 8px;
  }
  
  .header-right {
    min-width: auto;
    flex: 0 0 auto;
    gap: 6px;
  }
  
  .brand-link {
    font-size: 0.875rem !important;
    padding-left: 4px;
    white-space: nowrap;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .brand-logo {
    height: 32px;
  }
  
  .brand-link.hide-on-mobile-logged-in {
    display: none !important;
  }
  
  .v-spacer {
    min-width: 8px;
    flex-shrink: 1;
  }
  
  .sign-up-button,
  .login-button {
    font-size: 0.75rem;
    padding: 6px 12px;
    min-width: auto;
    height: 32px;
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  .sign-up-button :deep(.v-btn__content),
  .login-button :deep(.v-btn__content) {
    padding: 0 4px;
  }

  .today-button-mobile {
    font-size: 0.75rem;
    padding: 6px 10px;
    height: 36px;
    min-width: auto;
  }

  .today-button-mobile :deep(.v-btn__content) {
    padding: 0 4px;
    gap: 4px;
  }

  .cta-button {
    font-size: 0.875rem;
    padding: 8px 16px;
    height: 40px;
    min-width: 140px;
  }

  .cta-button :deep(.v-btn__content) {
    padding: 0 4px;
    gap: 6px;
  }

  .add-button-mobile-wrapper {
    gap: 0.5em;
    display: flex;
    align-items: center;
  }
}

@media (max-width: 600px) {
  .app-bar-custom {
    margin: 0;
  }
  
  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0.5em 0.5em;
    gap: 0.25em;
    align-items: center;
  }
  
  .header-content-wrapper {
    gap: 8px;
  }
  
  .header-left {
    min-width: auto;
    flex: 0 0 auto;
  }
  
  .header-center {
    flex: 1;
    justify-content: center;
  }
  
  .header-center .d-flex {
    justify-content: center;
    gap: 6px;
  }
  
  .header-right {
    min-width: auto;
    flex: 0 0 auto;
    gap: 4px;
  }
  
  .brand-link {
    font-size: 0.75rem !important;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .brand-logo {
    height: 28px;
  }
  
  .sign-up-button,
  .login-button {
    font-size: 0.7rem;
    padding: 4px 8px;
    height: 28px;
  }

  .today-button-mobile {
    font-size: 0.7rem;
    padding: 4px 8px;
    height: 32px;
  }

  .today-button-mobile :deep(.v-btn__content) {
    gap: 3px;
  }

  .today-button-mobile :deep(.v-icon) {
    font-size: 18px;
  }

  .cta-button {
    font-size: 0.8rem;
    padding: 6px 12px;
    height: 36px;
    min-width: 120px;
  }

  .cta-button :deep(.v-btn__content) {
    gap: 4px;
  }

  .cta-button :deep(.v-icon) {
    font-size: 20px;
  }
}

@media (min-width: 960px) and (max-width: 1279px) {
  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0 1em;
  }

  .today-button {
    padding-left: 12px;
    padding-right: 12px;
    font-size: 0.875rem;
  }

  .cta-button {
    padding-left: 20px;
    padding-right: 20px;
    font-size: 0.875rem;
  }

  .notification-button {
    padding: 0 8px;
  }

  .profile-button {
    padding: 0 4px;
  }
}

@media (max-width: 959px) {
  .streak-button {
    display: none !important;
  }
  
  .streak-divider {
    display: none !important;
  }
}

.streak-divider {
  width: 1px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.12);
  align-self: center;
}

.app-bar-custom :deep(.v-app-bar-title) {
  color: #ffffff;
}

.app-bar-custom :deep(.v-btn:not(.sign-up-button)) {
  color: #ffffff;
}

.app-bar-custom :deep(.brand-link) {
  color: #ffffff;
}

.app-bar-custom :deep(.v-app-bar-nav-icon) {
  color: #ffffff;
}

.add-button-mobile-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

@media (min-width: 960px) {
  .add-button-mobile-wrapper {
    display: none !important;
  }
}

.profile-button {
  padding: 0 4px;
  min-width: auto;
}

.profile-avatar {
  transition: transform 0.2s ease;
}

.profile-button:hover .profile-avatar {
  transform: scale(1.1);
}

.profile-avatar-initials {
  font-size: 14px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}


.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.language-button {
  min-width: auto;
  white-space: nowrap;
}

/* Sidebar Logo */
.sidebar-logo {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.sidebar-logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2E2A47;
  letter-spacing: 0.02em;
}


.sidebar-section-icon {
  color: #BDBDBD;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

/* Sidebar Icons (Emoji) */
.sidebar-icon {
  font-size: 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.sidebar-icon-small {
  font-size: 1rem;
}


/* Основной контейнер в сайдбаре */
.sidebar-user-section {
  background: rgba(112, 72, 232, 0.04); /* Легкий фиолетовый фон */
  border-radius: 16px;
  margin: 12px;
  border: 1px solid rgba(112, 72, 232, 0.08);
  transition: background 0.3s ease;
}

/* Интерактивная часть (аватар + имя) */
.sidebar-user-clickable {
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.sidebar-user-clickable:hover {
  background: rgba(112, 72, 232, 0.05);
}
/* Текст: Имя и Уровень */
.sidebar-user-section .text-body-1 {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 0.95rem !important;
  color: #94A3B8;
  line-height: 1.2;
}

.sidebar-user-section .text-caption {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 600;
  color: #94A3B8 !important;
}

/* Контейнер для монет и XP */
.sidebar-user-section .justify-space-between {
  margin-top: 4px;
}

.sidebar-user-section .v-icon {
  opacity: 0.8;
}

.full-width-progress {
  width: calc(100% + 24px);
  margin-left: -12px;
  margin-right: -12px;
}

.settings-button {
  color: #2E2A47 !important;
  opacity: 0.7;
}

.settings-button:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.sidebar-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.desktop-sidebar .sidebar-content-wrapper > .v-list {
  flex: 1;
  overflow-y: visible;
}

.sidebar-logout-section {
  margin-top: auto;
  padding: 8px 0;
  background-color: #F9F9FB;
}

.logout-item {
  cursor: pointer;
}

.logout-text {
  color: rgba(0, 0, 0, 0.5) !important;
  font-weight: 400;
}

.logout-icon {
  color: rgba(0, 0, 0, 0.5) !important;
}

.logout-item:hover .logout-text,
.logout-item:hover .logout-icon {
  color: rgba(0, 0, 0, 0.7) !important;
}

.mobile-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-drawer .sidebar-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
}

.mobile-drawer .sidebar-content-wrapper > .v-list {
  flex: 1;
  overflow-y: visible;
}

/* Стили для заголовков групп (YOUR JOURNEY, WORLD и т.д.) */
.v-list-subheader,
.desktop-sidebar :deep(.v-list-subheader),
.mobile-drawer :deep(.v-list-subheader) {
  /* Jakarta Sans для единства стиля */
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  
  /* Делаем текст заглавными буквами */
  text-transform: uppercase !important;
  
  /* Увеличиваем межсимвольное расстояние для премиального вида */
  letter-spacing: 1.2px !important;
  
  /* Размер шрифта делаем чуть меньше основного, чтобы не перегружать */
  font-size: 11px !important;
  
  /* Увеличиваем жирность, чтобы текст был читаемым при малом размере */
  font-weight: 800 !important;
  
  /* Цвет: приглушенный, но достаточно контрастный */
  color: #94A3B8 !important;
  
  /* Отступы, чтобы заголовки "дышали" */
  margin-top: 24px !important;
  margin-bottom: 8px !important;
  padding-left: 20px !important;
  
  /* Убираем лишнюю высоту по умолчанию */
  min-height: auto !important;
  height: auto !important;
}

/* Дополнительный акцент: точка перед заголовком (опционально) */
.v-list-subheader::before,
.desktop-sidebar :deep(.v-list-subheader)::before,
.mobile-drawer :deep(.v-list-subheader)::before {
  content: "•";
  margin-right: 8px;
  color: rgba(112, 72, 232, 0.4); /* Полупрозрачный фиолетовый */
}


/* FAB Button for Mobile */
.fab-button {
  background: linear-gradient(135deg, #7E46C4, #6A11CB) !important;
  box-shadow: 0 4px 15px rgba(126, 70, 196, 0.4), 
              0 0 20px rgba(126, 70, 196, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 1000;
  transition: transform 0.1s ease !important;
}

.fab-button:active {
  transform: scale(0.92) !important;
  filter: brightness(1.2) !important;
}
/* Убираем отступы v-main, когда шапки нет */
.auth-layout {
  padding: 0 !important;
  margin: 0 !important;
  height: 100vh !important;
  width: 100vw !important;
  overflow: hidden !important; /* Главный секрет отсутствия скролла */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Растягиваем внутренний контейнер на весь экран */
.auth-layout .main-content-wrapper,
.auth-layout .main-content-inner {
  height: 100% !important;
  width: 100% !important;
  display: flex;
}

/* Глобальное исправление для v-application, чтобы фон не скроллился */
:deep(.v-application__wrap) {
  min-height: 100vh !important;
  backface-visibility: hidden;
}

/* Если на маленьких экранах (ноутбуках) форма не влезает по высоте */
@media (max-height: 750px) {
  .auth-layout {
    overflow-y: auto !important; /* Разрешаем скролл только если экран совсем крошечный */
  }
}
/* 1. Основной контейнер сайдбара */
.desktop-sidebar {
  position: relative;
  flex-shrink: 0;
  height: 100vh;
  z-index: 1;
  margin-top: 0;
  padding-top: 0;
  top: 0 !important;
  width: auto;
  background: rgba(15, 15, 26, 0.7) !important; /* Прозрачный фон */
  backdrop-filter: blur(20px);
  border: none !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #ffffff;
}

/* 2. Секция пользователя */
.sidebar-user-section {
  padding: 20px 16px !important;
}

.sidebar-user-clickable:hover {
  cursor: pointer;
  filter: brightness(1.2);
}

/* 3. Карточка опыта (XP Card) */
.xp-sidebar-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 12px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

/* Прокачанный прогресс-бар */
:deep(.v-progress-linear) {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  overflow: visible !important;
}

:deep(.v-progress-linear__determinate) {
  /* Добавляем неоновое свечение самой полоске */
  box-shadow: 0 0 15px currentColor;
  border-radius: 20px;
}

/* 4. Навигационные ссылки */
.v-list-item {
  margin: 4px 12px !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.6) !important;
}

/* Эффект при наведении */
.v-list-item:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
}

.v-list-item:hover :deep(.v-list-item__prepend) {
  transform: scale(1.1);
}

.v-list-item:hover :deep(.v-icon) {
  transform: scale(1.15) rotate(5deg);
  color: #7C4DFF;
}

/* Активный пункт меню */
.v-list-item--active {
  background: linear-gradient(90deg, rgba(112, 72, 232, 0.15) 0%, transparent 100%) !important;
  color: #fff !important;
  border-left: 3px solid #7048E8 !important; /* "Световой меч" */
}

.v-list-item--active .sidebar-lucide-icon {
  color: #7048E8 !important;
  filter: drop-shadow(0 0 5px rgba(112, 72, 232, 0.8));
}

.v-list-item--active :deep(.v-list-item-title) {
  color: #fff !important;
  font-weight: 700 !important;
}

/* Заголовки разделов (World, Your Journey) */
.sidebar-section-header {
  height: 32px !important;
  min-height: 32px !important;
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1.2px !important;
  color: rgba(255, 255, 255, 0.4) !important;
  display: flex !important;
  align-items: center !important;
  margin-top: 15px;
}

/* Специальная карточка для логаута */
.logout-card {
  margin-top: auto !important; /* Прижимает кнопку к низу, если контента мало */
  border: 1px solid rgba(255, 82, 82, 0.1) !important; /* Еле заметный красный контур */
  background: rgba(255, 82, 82, 0.02) !important;
  transition: all 0.3s ease;
}

.logout-card:hover {
  background: rgba(255, 82, 82, 0.08) !important;
  border-color: rgba(255, 82, 82, 0.3) !important;
  box-shadow: 0 0 20px rgba(255, 82, 82, 0.1);
}

/* Стили текста и иконки внутри */
.logout-item .logout-text,
.logout-item .logout-icon {
  color: rgba(255, 255, 255, 0.5) !important;
  transition: color 0.3s ease;
}

.logout-card:hover .logout-text,
.logout-card:hover .logout-icon {
  color: #ff5252 !important; /* Яркий красный при наведении */
}

/* Чтобы иконка LogOut тоже светилась как остальные при наведении */
.logout-card:hover .sidebar-lucide-icon {
  filter: drop-shadow(0 0 8px rgba(255, 82, 82, 0.5));
  transform: translateX(3px); /* Небольшой сдвиг вправо для динамики */
}
/* Основной контейнер группы меню */
.sidebar-menu-card {
  background: rgba(255, 255, 255, 0.03) !important; /* Тот же Glass-эффект */
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 20px !important;
  margin: 0 12px 16px 12px !important;
  padding: 8px 0 !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.3s ease;
}

/* Настройка отступов для мобильного сайдбара, чтобы карточки не липли к краям */
.mobile-drawer .sidebar-menu-card {
  margin: 0 16px 16px 16px !important;
}


/* Основной контейнер хедера */
.app-bar-custom {
  background: rgba(13, 13, 23, 0.7) !important; /* Очень темное стекло */
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: white !important;
}

.header-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 16px;
  gap: 16px;
}

.header-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header-left {
  justify-content: flex-start;
  min-width: 120px;
}

.header-center {
  justify-content: center;
  flex: 1;
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
  min-width: 120px;
  gap: 8px;
}

.brand-link {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 1. Стрик (Огонь) — делаем его сочным */
.streak-button {
  background: rgba(255, 165, 0, 0.1) !important;
  border: 1px solid rgba(255, 165, 0, 0.3) !important;
  border-radius: 12px;
  padding: 6px 14px;
  color: #FFA500 !important;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0 15px rgba(255, 165, 0, 0.1);
}

.streak-button i {
  font-size: 20px;
  filter: drop-shadow(0 0 5px #FFA500);
}

.streak-yesterday {
  filter: grayscale(0.8); /* Если сегодня еще не выполнил — огонек тусклый */
  opacity: 0.7;
}

/* 2. Логотип — добавляем мягкое свечение сзади */
.brand-logo {
  height: 40px;
  filter: drop-shadow(0 0 10px rgba(112, 72, 232, 0.4));
  transition: transform 0.3s ease;
  display: block;
  object-fit: contain;
}
.brand-logo:hover {
  transform: scale(1.05);
}

/* 3. Кнопка Start Mission (Add Challenge) */
.cta-button {
  background: linear-gradient(135deg, #7048E8 0%, #F4A782 100%) !important;
  color: white !important;
  border-radius: 14px !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(112, 72, 232, 0.3) !important;
}

/* 4. Колокольчик уведомлений */
.notification-button {
  color: rgba(255, 255, 255, 0.7) !important; /* Исправляем черный цвет */
}

.notification-button:hover {
  color: white !important;
}

:deep(.v-badge__badge) {
  background-color: #ff5252 !important;
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.5);
}

/* 5. Кнопки Login/Register для гостей */
.login-button {
  border: 2px solid rgba(112, 72, 232, 0.5) !important;
  color: white !important;
  border-radius: 12px !important;
}

.sign-up-button {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sign-up-button :deep(.v-btn__content),
.login-button :deep(.v-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
}
.cta-button-cyber {
  /* Твой фирменный бирюзовый градиент */
  background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%) !important;
  color: #0F172A !important; /* Темный текст для контраста */
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 12px !important;
  
  /* Эффект свечения */
  box-shadow: 0 0 15px rgba(79, 209, 197, 0.4) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.cta-button-cyber:hover {
  /* Усиливаем неон при наведении */
  box-shadow: 0 0 25px rgba(79, 209, 197, 0.8) !important;
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.cta-button-cyber:active {
  transform: translateY(0);
}

/* Анимация иконки */
.icon-pulse {
  animation: star-pulse 2s infinite ease-in-out;
}

@keyframes star-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}
</style> 
