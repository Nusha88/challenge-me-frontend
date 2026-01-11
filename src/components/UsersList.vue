<template>
  <div class="users-container">
    <h1 class="mb-4 mb-md-6 page-title">{{ t('users.title') }}</h1>

    <v-card>
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

        <v-alert v-if="error" type="error" class="mb-4">
          {{ error }}
        </v-alert>

        <!-- Search Input -->
        <div v-if="!loading && users.length > 0" class="search-container mb-4">
          <v-text-field
            v-model="searchQuery"
            :label="t('users.searchPlaceholder')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            clearable
            density="comfortable"
            class="search-input"
            @keyup.enter="handleSearch"
            @click:clear="handleClearSearch"
          >
            <template #append-inner>
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                class="search-button"
                :loading="loading"
                @click.stop="handleSearch"
              >
                {{ t('users.search') }}
              </v-btn>
            </template>
          </v-text-field>
        </div>

        <template v-if="!loading">
          <v-alert v-if="users.length === 0" type="info">
            {{ t('users.noUsers') }}
          </v-alert>

          <v-alert v-else-if="filteredUsers.length === 0 && searchQuery" type="info">
            {{ t('users.noUsersFound') }}
          </v-alert>

          <div v-else class="users-container-grid">
          <!-- Top 3 users in one row -->
          <div v-if="topThreeUsers.length > 0" class="top-three-row">
            <v-card
              v-for="(user, index) in topThreeUsers"
              :key="user._id || user.id"
              :class="['user-card', 'top-user-card', `rank-${index + 1}`]"
              @click="handleUserClick(user)"
            >
              <v-card-text class="user-card-content">
                <div class="rank-badge">
                  <v-icon v-if="index === 0" size="32" color="#FFD700">mdi-trophy</v-icon>
                  <v-icon v-else-if="index === 1" size="32" color="#C0C0C0">mdi-trophy</v-icon>
                  <v-icon v-else-if="index === 2" size="32" color="#CD7F32">mdi-trophy</v-icon>
                </div>
                
                <div class="user-avatar-container">
                  <v-avatar size="80" class="user-avatar">
                    <v-img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.name" cover></v-img>
                    <span v-else class="avatar-initials">{{ getUserInitials(user.name) }}</span>
                  </v-avatar>
                </div>
                
                <div class="user-info">
                  <h3 class="user-name">{{ user.name }}</h3>
                  
                  <div class="user-stats">
                    <div class="stat-item">
                      <v-icon size="small" class="mr-1">mdi-trophy</v-icon>
                      <span>{{ user.challengeCount || 0 }} {{ t('users.challenges') }}</span>
                    </div>
                    <div class="stat-item">
                      <v-icon size="small" class="mr-1">mdi-calendar-check</v-icon>
                      <span>{{ user.daysOnSite || 0 }} {{ t('users.daysOnSite') }}</span>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <!-- Rest of users in rows of 2 -->
          <div v-if="remainingUsers.length > 0" class="users-grid">
            <v-card
              v-for="user in remainingUsers"
              :key="user._id || user.id"
              class="user-card"
              @click="handleUserClick(user)"
            >
              <v-card-text class="user-card-content">
                <div class="user-avatar-container">
                  <v-avatar size="80" class="user-avatar">
                    <v-img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.name" cover></v-img>
                    <span v-else class="avatar-initials">{{ getUserInitials(user.name) }}</span>
                  </v-avatar>
                </div>
                
                <div class="user-info">
                  <h3 class="user-name">{{ user.name }}</h3>
                  
                  <div class="user-stats">
                    <div class="stat-item">
                      <v-icon size="small" class="mr-1">mdi-trophy</v-icon>
                      <span>{{ user.challengeCount || 0 }} {{ t('users.challenges') }}</span>
                    </div>
                    <div class="stat-item">
                      <v-icon size="small" class="mr-1">mdi-calendar-check</v-icon>
                      <span>{{ user.daysOnSite || 0 }} {{ t('users.daysOnSite') }}</span>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
        
        <!-- Loading More Indicator -->
        <div v-if="loadingMore" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
        </div>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '../services/api'
import { useI18n } from 'vue-i18n'

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

const handleUserClick = (user) => {
  const userId = user._id || user.id
  if (userId) {
    router.push(`/users/${userId}`)
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
.users-container {
  width: 100%;
  padding: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 500px;
}

.search-button {
  margin-left: 8px;
}

@media (max-width: 600px) {
  .search-input {
    max-width: 100%;
  }
}

.users-container-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.top-three-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 8px 0;
}

@media (min-width: 960px) {
  .top-three-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}

.users-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 8px 0;
}

@media (min-width: 600px) {
  .users-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 16px 0;
  }
}

.user-card {
  background-color: #ffffff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.top-user-card {
  border: 3px solid transparent;
}

.top-user-card.rank-1 {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFF4D6 100%);
  border-color: #FFD700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.top-user-card.rank-1:hover {
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
}

.top-user-card.rank-2 {
  background: linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%);
  border-color: #C0C0C0;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.3);
}

.top-user-card.rank-2:hover {
  box-shadow: 0 6px 16px rgba(192, 192, 192, 0.4);
}

.top-user-card.rank-3 {
  background: linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%);
  border-color: #CD7F32;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.3);
}

.top-user-card.rank-3:hover {
  box-shadow: 0 6px 16px rgba(205, 127, 50, 0.4);
}

.rank-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}

.user-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px !important;
}

.user-avatar-container {
  margin-bottom: 16px;
}

.user-avatar {
  border: 3px solid #f5f5f5;
}

.user-info {
  width: 100%;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.87);
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.avatar-initials {
  font-size: 32px;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
}
</style> 