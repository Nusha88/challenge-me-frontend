<template>
  <div class="users-container pb-10">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="page-title mb-0">{{ t('users.title') }}</h1>
      <v-chip color="primary" variant="tonal" class="font-weight-bold">
        {{ users.length }} Heroes
      </v-chip>
    </div>

    <div v-if="!loading" class="search-wrapper mb-8">
      <v-text-field
        v-model="searchQuery"
        :placeholder="t('users.searchPlaceholder')"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        class="hero-search-input"
        rounded="xl"
        hide-details
        @keyup.enter="handleSearch"
      >
        <template #append-inner>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="pill"
            class="px-6"
          :loading="loading"
            @click="handleSearch"
        >
            {{ t('users.search') }}
          </v-btn>
          </template>
      </v-text-field>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 rounded-pill"></v-progress-linear>

    <template v-if="!loading">
      <div v-if="filteredUsers.length === 0" class="text-center py-10">
        <v-icon size="64" color="grey-lighten-2">mdi-account-search-outline</v-icon>
        <p class="text-grey-darken-1 mt-2">{{ searchQuery ? t('users.noUsersFound') : t('users.noUsers') }}</p>
      </div>

      <div v-else class="hall-of-fame">
        <v-row v-if="topThreeUsers.length > 0" class="mb-8">
          <v-col 
            v-for="(user, index) in topThreeUsers" 
            :key="user._id || user.id" 
            :class="['user-card', 'top-user-card', `rank-${index + 1}`, 'reveal-animation']"
  :style="{ '--i': index }"
            cols="12" md="4"
          >
            <v-card 
              :class="['hero-card-premium', `rank-${index + 1}`]"
              @click="handleUserClick(user)"
            >
              <div class="rank-crown">
                <v-icon :color="index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'">
                  mdi-crown
                </v-icon>
              </div>
              
              <v-card-text class="text-center pt-8">
                <v-badge
                  bordered
                  :color="index === 0 ? 'amber' : 'blue-grey-lighten-2'"
                  icon="mdi-check-decagram"
                  overlap
                  location="bottom right"
                >
                  <v-avatar size="100" class="hero-avatar-border">
                    <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover></v-img>
                    <div v-else class="avatar-gen">{{ getUserInitials(user.name) }}</div>
                  </v-avatar>
                </v-badge>

                <h3 class="hero-name mt-4">{{ user.name }}</h3>
                <p class="hero-rank-title">{{ getLevelInfo(getUserLevel(user)).rankName }}</p>

                <div class="pa-4">
                  <div class="xp-sidebar-card">
                    <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
                      <span :style="{ color: getLevelInfo(getUserLevel(user)).color }">
                        {{ getLevelInfo(getUserLevel(user)).rank }} (Lvl {{ getUserLevel(user) }})
                      </span>
                      <span class="text-grey-darken-1">{{ getUserCurrentXp(user) }} / {{ getLevelInfo(getUserLevel(user)).xpPerLvl }} XP</span>
                    </div>
                    
                    <v-progress-linear 
                      :model-value="(getUserCurrentXp(user) / getLevelInfo(getUserLevel(user)).xpPerLvl) * 100" 
                      :color="getLevelInfo(getUserLevel(user)).color" 
                      height="8" 
                      rounded
                      striped
                    ></v-progress-linear>
                  </div>
                </div>

                <div class="d-flex justify-center gap-4 mt-6">
                  <div class="mini-stat mr-2">
                    <v-icon size="16" color="primary">mdi-sword</v-icon>
                    <span>{{ user.challengeCount || 0 }}</span>
                  </div>
                  <div class="mini-stat">
                    <v-icon size="16" color="primary">mdi-calendar-multiselect</v-icon>
                    <span>{{ user.daysOnSite || 0 }}d</span>
                  </div>
                </div>
      </v-card-text>
    </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col 
            v-for="user in remainingUsers" 
            :key="user._id || user.id" 
            cols="12" sm="6" lg="4"
            class="user-card reveal-animation"
  :style="{ '--i': index + 3 }"
          >
            <v-card class="hero-card-standard" @click="handleUserClick(user)">
              <div class="d-flex align-center pa-4">
                <v-avatar size="64" color="grey-lighten-4">
                  <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover></v-img>
                  <span v-else>{{ getUserInitials(user.name) }}</span>
                </v-avatar>
                
                <div class="ml-4 flex-grow-1">
                  <h4 class="hero-name-small">{{ user.name }}</h4>
                  <div class="d-flex gap-3 mt-1">
                    <span class="text-caption text-grey mr-2">
                      <v-icon size="12">mdi-trophy-outline</v-icon> {{ user.challengeCount }}
                    </span>
                    <span class="text-caption text-grey">
                      <v-icon size="12">mdi-clock-outline</v-icon> {{ user.daysOnSite }}d
                    </span>
                  </div>
                </div>
                <v-btn icon="mdi-chevron-right" variant="text" color="grey-lighten-1"></v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </template>

    <div v-if="loadingMore" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { getLevelFromXp, getXpForLevel, getRank, getXpPerLevel } from '../utils/levelSystem'

const router = useRouter()

const users = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const hasMore = ref(true)
const { t, locale } = useI18n()

const getUserInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  const initials = parts.length === 1
    ? parts[0].slice(0, 2)
    : `${parts[0][0] || ''}${parts[1][0] || ''}`
  return initials.toUpperCase()
}

const getDaysOnSite = (dateString) => {
  if (!dateString) return '0'
  try {
    const registrationDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    registrationDate.setHours(0, 0, 0, 0)
    
    const diffTime = today - registrationDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays.toString()
  } catch (err) {
    return '0'
  }
}

const fetchUsers = async (page = 1, append = false) => {
  if (append) {
    loadingMore.value = true
  } else {
  loading.value = true
    if (!append) {
      currentPage.value = 1
    }
  }
  error.value = ''
  
  try {
    const limit = 21 // Always load 21 users per page
    const params = {
      page,
      limit
    }
    
    // Add search query if present
    if (searchQuery.value && searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }
    
    const response = await userService.getAllUsers(params)
    
    // Add daysOnSite to each user
    const usersWithDays = response.data.users.map(user => ({
      ...user,
      daysOnSite: getDaysOnSiteNumber(user.createdAt)
    }))
    
    if (append) {
      // Append new users to existing list
      users.value = [...users.value, ...usersWithDays]
    } else {
      // Replace users list (first page or search reset)
      users.value = usersWithDays
    }
    
    // Update pagination state
    hasMore.value = response.data.pagination?.hasMore || false
    currentPage.value = page
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.usersError')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreUsers = async () => {
  if (loadingMore.value || !hasMore.value) {
    return // Don't load more if already loading or no more pages
  }
  
  await fetchUsers(currentPage.value + 1, true)
}

const handleScroll = () => {
  if (loadingMore.value || !hasMore.value) {
    return
  }
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // Load more when user is within 200px of the bottom
  if (scrollTop + windowHeight >= documentHeight - 200) {
    loadMoreUsers()
  }
}

// Handle search button click
const handleSearch = () => {
  // Reset to first page and fetch with search query
  fetchUsers(1, false)
}

// Handle clear search
const handleClearSearch = () => {
  searchQuery.value = ''
  // Reset to first page and fetch all users
  fetchUsers(1, false)
}

// Users are already filtered server-side, so use them directly
const filteredUsers = computed(() => {
  return users.value
})

// Top 3 users (gold, silver, bronze) from filtered results
const topThreeUsers = computed(() => {
  return filteredUsers.value.slice(0, 3)
})

// Remaining users from filtered results
const remainingUsers = computed(() => {
  return filteredUsers.value.slice(3)
})

const getDaysOnSiteNumber = (dateString) => {
  if (!dateString) return 0
  try {
    const registrationDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    registrationDate.setHours(0, 0, 0, 0)
    
    const diffTime = today - registrationDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (err) {
    return 0
  }
}

// Get level for a user
const getUserLevel = (user) => {
  const xp = Number(user?.xp || 0)
  return getLevelFromXp(xp)
}

// Get current XP (XP progress within current level)
const getUserCurrentXp = (user) => {
  const xp = Number(user?.xp || 0)
  const level = getUserLevel(user)
  const xpForCurrentLevel = getXpForLevel(level)
  return xp - xpForCurrentLevel
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

const handleUserClick = (user) => {
  const userId = user._id || user.id
  if (userId) {
    router.push(`/heroes/${userId}`)
  }
}

onMounted(() => {
  fetchUsers(1, false)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Главный контейнер */
.users-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  padding-top: 0;
}
/* Базовое состояние для анимации */
.reveal-animation {
  opacity: 0;
  transform: translateY(30px);
  animation: revealHero 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  /* Задержка: 0.1s умножаем на порядковый номер пользователя */
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes revealHero {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Улучшим визуальное разделение секций */
.users-container-grid::before {
  content: "Top Contributors";
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 1.5px;
  margin-bottom: -16px;
}

.page-title {
  font-size: 2rem;
  letter-spacing: -0.5px;
  color: #1a1a1a;
  text-align: left;
}

/* Современный поиск */
.search-container {
  max-width: 600px;
  margin-bottom: 32px;
}

.search-input :deep(.v-field) {
  border-radius: 16px !important;
  background: white !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
  border: 1px solid #edf2f7 !important;
}

.search-button {
  border-radius: 12px !important;
  text-transform: none;
  font-weight: 600;
  padding: 0 20px !important;
}

/* Сетки */
.users-container-grid {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.top-three-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* Базовая карточка */
.user-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.user-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: #3b82f6;
}

/* Стили для ТОП-3 */
.top-user-card {
  position: relative;
  z-index: 1;
}

.top-user-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 6px;
  z-index: 2;
}

.rank-1::before { background: #FFD700; }
.rank-2::before { background: #C0C0C0; }
.rank-3::before { background: #CD7F32; }

/* Мягкие подложки для топа вместо ярких градиентов */
.rank-1 { background: linear-gradient(180deg, #fffcf0 0%, #ffffff 100%); }
.rank-2 { background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%); }
.rank-3 { background: linear-gradient(180deg, #fdf8f3 0%, #ffffff 100%); }

.rank-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

/* Контент карточки */
.user-card-content {
  padding: 32px 24px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-avatar-container {
  position: relative;
  margin-bottom: 16px;
}

.user-avatar {
  border: 4px solid white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.rank-1 .user-avatar { border-color: #FFD700; }

/* Инфо и Имя */
.user-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

/* Статистика в виде "таблеток" */
.user-stats {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.stat-item {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  transition: background 0.2s;
}

.user-card:hover .stat-item {
  background: #e2e8f0;
}

.stat-item i {
  color: #3b82f6;
  margin-right: 6px;
}

/* Аватар-инициалы */
.avatar-initials {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
}

/* Адаптивность для мобилок */
@media (max-width: 600px) {
  .users-container {
    padding: 16px;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .user-stats {
    flex-wrap: wrap;
  }
  
  .stat-item {
    flex: 1 1 calc(50% - 12px);
    font-size: 0.75rem;
  }
}
</style> 