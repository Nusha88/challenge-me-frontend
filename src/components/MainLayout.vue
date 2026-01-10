<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'
import NotificationsComponent from './NotificationsComponent.vue'
import { notificationService, userService, challengeService } from '../services/api'
import { initializePushNotifications, syncPushSubscriptionToServer } from '../utils/pushNotifications'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.name)
const isLoggedIn = ref(!!localStorage.getItem('token'))
const notificationsDrawerOpen = ref(false)
const unreadNotificationCount = ref(0)
const streakDays = ref(0)

function readStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

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

async function calculateStreak() {
  const userId = getCurrentUserId()
  if (!userId || !isLoggedIn.value) {
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
  }
})
</script>

<template>
  <v-app>
    <v-app-bar class="app-bar-custom" elevation="0" :fixed="false">
      <v-app-bar-nav-icon
        v-if="isLoggedIn"
        @click="toggleDrawer"
        class="d-md-none"
      ></v-app-bar-nav-icon>
      <router-link 
        to="/" 
        class="brand-link"
        :class="{ 'hide-on-mobile-logged-in': isLoggedIn }"
      >{{ t('app.name') }}</router-link>
      <div class="add-button-mobile-wrapper d-md-none">
        <v-btn
          v-if="isLoggedIn"
          to="/"
          size="default"
          class="today-button-mobile mr-2"
          prepend-icon="mdi-calendar-today"
        >
          {{ t('navigation.today') }}
        </v-btn>
        <v-btn
          v-if="isLoggedIn"
          to="/challenges/add"
          variant="elevated"
          size="large"
          class="cta-button"
          prepend-icon="mdi-plus-circle"
        >
          {{ t('navigation.addChallenge') }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        v-if="!isLoggedIn && route.path !== '/register'"
        to="/register"
        variant="elevated"
        class="mr-2 sign-up-button"
        style="color: white;"
      >
        {{ t('navigation.register') }}
      </v-btn>
      <v-btn
        v-if="!isLoggedIn && route.path !== '/login'"
        to="/login"
        variant="outlined"
        class="mr-2 login-button"
        style="border-color: #3C60E8; color: #3C60E8; border-width: 2px;"
      >
        {{ t('navigation.login') }}
      </v-btn>
      <div
        v-if="isLoggedIn && streakDays > 0"
        class="mr-4 streak-button d-none d-md-inline-flex"
      >
        <i class="mdi mdi-fire"></i>
        <span>{{ streakDays }} {{ t('navigation.streakDays') }}</span>
      </div>
      <div
        v-if="isLoggedIn && streakDays > 0"
        class="streak-divider mr-4 d-none d-md-inline-flex"
      ></div>
      <v-btn
        v-if="isLoggedIn"
        to="/challenges/add"
        variant="elevated"
        size="large"
        class="mr-2 cta-button d-none d-md-inline-flex"
        prepend-icon="mdi-plus-circle"
      >
        {{ t('navigation.addChallenge') }}
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        to="/"
        size="default"
        class="mr-2 today-button d-none d-md-inline-flex"
        prepend-icon="mdi-calendar-today"
      >
        {{ t('navigation.today') }}
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        variant="text"
        class="mr-2 d-none d-md-inline-flex notification-button"
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
      <v-menu location="bottom" open-on-hover class="d-none d-md-block">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="mr-2 language-button d-none d-md-inline-flex"
            prepend-icon="mdi-translate"
        style="color: rgba(0, 0, 0, 0.87);"
      >
            {{ currentLocaleLabel }}
      </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="language in availableLocales"
            :key="language.code"
            :active="language.code === locale.value"
            @click="changeLanguage(language.code)"
          >
            <v-list-item-title>{{ language.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn
        v-if="isLoggedIn"
        variant="text"
        class="mr-2 logout-button"
        prepend-icon="mdi-logout"
        color="error"
        @click="logout"
      >
        <span class="d-none d-md-inline">{{ t('navigation.logout') }}</span>
      </v-btn>
    </v-app-bar>

    <v-main :class="['main-content', { 'public-view': !isLoggedIn, 'with-sidebar': isLoggedIn }]">
      <div class="main-content-wrapper">
        <!-- Desktop Permanent Sidebar -->
        <v-navigation-drawer
          v-if="isLoggedIn"
          permanent
          class="d-none d-md-block desktop-sidebar sidebar-column"
        >
          <v-list>
            <v-list-item
              to="/profile"
              :active="currentRoute === 'profile'"
              color="primary"
            >
              <template v-slot:prepend>
                <v-avatar size="32" class="sidebar-avatar">
                  <v-img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="userName || ''" cover></v-img>
                  <span v-else class="sidebar-avatar-initials">{{ getUserInitials(userName) }}</span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ userName || t('navigation.profile') }}</v-list-item-title>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <v-list-item
              to="/"
              :active="currentRoute === 'home'"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-calendar-today"></v-icon>
              </template>
              <v-list-item-title>{{ t('navigation.today') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'my-challenges'"
              to="/challenges/my"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-account-star"></v-icon>
              </template>
              <v-list-item-title>{{ t('navigation.myChallenges') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'challenges'"
              to="/challenges"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-flag-checkered"></v-icon>
              </template>
              <v-list-item-title>{{ t('navigation.allChallenges') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'users'"
              to="/users"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-account-group"></v-icon>
              </template>
              <v-list-item-title>{{ t('navigation.allUsers') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'watched-challenges'"
              to="/challenges/watched"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-eye"></v-icon>
              </template>
              <v-list-item-title>{{ t('navigation.watchedChallenges') }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'checklists-history'"
              to="/checklists/history"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-history"></v-icon>
              </template>
              <v-list-item-title>{{ t('navigation.checklistHistory') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>

        <div :class="['main-content-inner', { 'content-column': isLoggedIn, 'full-column': !isLoggedIn }]">
          <router-view></router-view>
        </div>
      </div>
    </v-main>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-if="isLoggedIn"
      :model-value="drawerOpen"
      @update:model-value="drawerOpen = $event"
      temporary
      location="start"
      class="d-md-none mobile-drawer"
    >
      <v-list>
        <v-list-item
          to="/"
          :active="currentRoute === 'home'"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-home"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.home') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          to="/profile"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-avatar size="32" class="sidebar-avatar">
              <v-img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="userName || ''" cover></v-img>
              <span v-else class="sidebar-avatar-initials">{{ getUserInitials(userName) }}</span>
            </v-avatar>
          </template>
          <v-list-item-title>{{ userName || t('navigation.profile') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          to="/"
          :active="currentRoute === 'home'"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-calendar-today"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.today') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'my-challenges'"
          to="/challenges/my"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-account-star"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.myChallenges') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'challenges'"
          to="/challenges"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-flag-checkered"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.allChallenges') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'users'"
          to="/users"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-account-group"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.allUsers') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'watched-challenges'"
          to="/challenges/watched"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-eye"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.watchedChallenges') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'checklists-history'"
          to="/checklists/history"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-history"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.checklistHistory') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          color="primary"
          @click="openNotifications(); drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-bell"></v-icon>
          </template>
          <v-list-item-title>{{ t('notifications.title') }}</v-list-item-title>
          <template v-slot:append>
            <v-chip
              v-if="unreadNotificationCount > 0"
              color="error"
              size="small"
            >
              {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
            </v-chip>
          </template>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-subheader>{{ t('navigation.language') }}</v-list-subheader>
        <v-list-item
          v-for="language in availableLocales"
          :key="language.code"
          :active="language.code === locale.value"
          @click="changeLanguage(language.code); drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-translate"></v-icon>
          </template>
          <v-list-item-title>{{ language.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
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

.desktop-sidebar {
  position: relative;
  flex-shrink: 0;
  height: auto;
  z-index: 1;
  margin-top: 0;
  padding-top: 0;
  top: 0;
  width: auto;
  background-color: #F4F0FF !important;
  border: none !important;
  color: #2E2A47;
}

.desktop-sidebar :deep(.v-list) {
  padding-top: 0;
}

.desktop-sidebar :deep(.v-navigation-drawer__content) {
  padding-top: 0;
  background-color: #F4F0FF !important;
  color: #2E2A47;
}

.desktop-sidebar :deep(.v-navigation-drawer__prepend),
.desktop-sidebar :deep(.v-navigation-drawer__append) {
  background-color: #F4F0FF !important;
}

.desktop-sidebar :deep(.v-navigation-drawer__border) {
  display: none !important;
}

.mobile-drawer {
  z-index: 2000;
  background-color: #F4F0FF !important;
  color: #2E2A47;
}

.mobile-drawer :deep(.v-navigation-drawer__content) {
  background-color: #F4F0FF !important;
  color: #2E2A47;
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
    left: -256px !important;
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

.v-list-item:hover::before {
  transform: scaleY(1);
}

.v-list-item:hover {
  background-color: rgba(124, 77, 255, 0.1) !important;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(124, 77, 255, 0.2);
}

.v-list-item :deep(.v-list-item__prepend) {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-list-item:hover :deep(.v-list-item__prepend) {
  transform: scale(1.1);
}

.v-list-item :deep(.v-icon) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #2E2A47;
}

.v-list-item:hover :deep(.v-icon) {
  transform: scale(1.15) rotate(5deg);
  color: #7C4DFF;
}

.v-list-item :deep(.v-list-item-title) {
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  color: #2E2A47;
}

.v-list-item:hover :deep(.v-list-item-title) {
  color: #7C4DFF;
  transform: translateX(2px);
}

.v-list-item.active {
  background: linear-gradient(90deg, #7C4DFF, #536DFE) !important;
  color: white !important;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(124, 77, 255, 0.3);
}

.v-list-item.active::before {
  transform: scaleY(1);
  background: linear-gradient(90deg, #7C4DFF, #536DFE);
}

.v-list-item.active :deep(.v-icon) {
  transform: scale(1.1);
  color: white !important;
}

.v-list-item.active :deep(.v-list-item-title) {
  color: white !important;
}

.v-application {
  background-color: transparent !important;
}

.main-content {
  padding: 1em;
  min-height: auto;
  width: 100%;
  margin: 0;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 0 0 12px 12px;
}

@media (min-width: 600px) {
  .main-content {
    padding: 1.5em;
    margin: 0 1em 1.5em 1em;
    border-radius: 0 0 16px 16px;
  }
}

@media (min-width: 960px) {
  .main-content {
    padding: 2em;
    margin: 0 1em 2em 1em;
  }
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
    margin-top: 64px;
    padding-top: 1em;
  }
}

.cta-button {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-left: 24px;
  padding-right: 24px;
  box-shadow: 0 6px 18px rgba(31, 160, 246, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
  color: white !important;
  position: relative;
  overflow: hidden;
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.cta-button:hover::before {
  left: 100%;
}

.cta-button :deep(.v-btn__overlay) {
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
  transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-button :deep(.v-btn__content) {
  color: white !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-button :deep(.v-icon) {
  color: white !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 959px) {
  .cta-button {
    padding: 12px 28px;
    font-size: 1rem;
    height: 48px;
    min-width: 180px;
  }
}

.cta-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 28px rgba(31, 160, 246, 0.5);
  background: linear-gradient(135deg, #A62EE8 0%, #1FA0F6 100%) !important;
}

.cta-button:hover :deep(.v-btn__content) {
  transform: translateX(2px);
}

.cta-button:hover :deep(.v-icon) {
  transform: rotate(90deg) scale(1.1);
}

.cta-button:active {
  transform: translateY(-1px) scale(0.98);
  box-shadow: 0 4px 12px rgba(31, 160, 246, 0.4);
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

.language-button {
  text-transform: none;
  font-weight: 500;
}

.sidebar-avatar {
  border: 2px solid rgba(31, 160, 246, 0.2);
  transition: border-color 0.2s ease;
}

.sidebar-avatar-initials {
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

.app-bar-custom {
  position: relative !important;
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin: 1em 1em 0 1em;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-bar-custom :deep(.v-toolbar__content) {
  background-color: transparent !important;
  padding: 0 1.5em;
  overflow-x: auto;
  overflow-y: hidden;
}

.app-bar-custom :deep(.v-toolbar__content)::-webkit-scrollbar {
  display: none;
}

.app-bar-custom :deep(.v-toolbar__content) {
  -ms-overflow-style: none;
  scrollbar-width: none;
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
  }
  
  .brand-link {
    font-size: 0.875rem !important;
    padding-left: 4px;
    white-space: nowrap;
    flex-shrink: 0;
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
  }
  
  .brand-link {
    font-size: 0.75rem !important;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .language-button {
    font-size: 0.875rem;
    padding-left: 8px;
    padding-right: 8px;
  }

  .notification-button {
    padding: 0 8px;
  }

  .profile-button {
    padding: 0 4px;
  }
}

.streak-button {
  background: #FEF3E1 !important;
  color: #FF6D00 !important;
  border: none !important;
  border-radius: 4px !important;
  padding: 8px 16px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  box-shadow: 0 4px 12px rgba(255, 109, 0, 0.3) !important;
  cursor: default !important;
  text-transform: uppercase !important;
  min-width: auto !important;
}

@media (max-width: 959px) {
  .streak-button {
    display: none !important;
  }
  
  .streak-divider {
    display: none !important;
  }
}

.streak-button span {
  color: #FF6D00 !important;
  text-transform: uppercase !important;
}

.streak-button i {
  color: #FF6D00 !important;
  font-size: 18px;
}

.streak-divider {
  width: 1px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.12);
  align-self: center;
}

.app-bar-custom :deep(.v-toolbar__content) {
  background-color: transparent !important;
}

.app-bar-custom :deep(.v-app-bar-title) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.app-bar-custom :deep(.v-btn:not(.sign-up-button)) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.app-bar-custom :deep(.brand-link) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.app-bar-custom :deep(.v-app-bar-nav-icon) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.sign-up-button {
  border-radius: 24px !important;
  background: linear-gradient(135deg, #4161E1 0%, #4869DB 100%) !important;
}

.login-button {
  border-radius: 24px !important;
  background-color: transparent !important;
  color: #3C60E8 !important;
  border-color: #3C60E8 !important;
}

.login-button :deep(.v-btn__content) {
  color: #3C60E8 !important;
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

.notification-button {
  min-width: auto;
  padding: 0 8px;
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

@media (max-width: 1279px) {
  .language-button :deep(.v-btn__content) {
    gap: 4px;
  }

  .language-button {
    font-size: 0.875rem;
  }
}
</style> 