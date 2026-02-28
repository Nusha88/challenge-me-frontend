<template>
  <div class="users-container pb-10">
    <div class="header-section text-left mb-10 reveal-animation">
  <div class="d-flex align-center justify-space-between flex-wrap">
    <div>
      <div class="d-flex align-center mb-1">
        <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-shield-crown</v-icon>
        <h1 class="page-title-dark">{{ t('users.title') }}</h1>
      </div>
      <div class="text-overline text-teal-accent-4 tracking-widest ml-13">{{ t('users.subtitle') }}</div>
      <p class="journal-subtitle-dark mt-2">{{ t('users.description') }}</p>
    </div>
    
    <div class="hero-counter-block d-none d-sm-flex">
      <div class="text-right">
        <div class="text-overline grey-text">{{ t('users.totalStrength') }}</div>
        <div class="hero-count">{{ users.length }} {{ t('users.active') }}</div>
      </div>
      <v-icon color="teal-accent-4" size="32" class="ml-4 opacity-50">mdi-account-group</v-icon>
    </div>
  </div>
</div>
<div v-if="loading" class="heroes-skeleton-wrapper">
  <v-skeleton-loader
    type="heading"
    class="search-bar-skeleton mb-10 rounded-pill"
  ></v-skeleton-loader>

  <v-row class="mb-10">
    <v-col v-for="n in 3" :key="'top-'+n" cols="12" md="4">
      <v-card class="skeleton-card-dark rounded-xl pt-6">
        <div class="d-flex flex-column align-center">
          <v-skeleton-loader type="avatar" class="mb-4" theme="dark"></v-skeleton-loader>
          <v-skeleton-loader type="text, subtitle" class="w-75 mb-4" theme="dark"></v-skeleton-loader>
          <v-skeleton-loader type="actions" class="w-100" theme="dark"></v-skeleton-loader>
        </div>
      </v-card>
    </v-col>
  </v-row>

  <v-row>
    <v-col v-for="n in 6" :key="'list-'+n" cols="12" md="4">
      <v-card class="skeleton-card-dark rounded-lg pa-2">
        <v-skeleton-loader type="list-item-avatar" theme="dark"></v-skeleton-loader>
      </v-card>
    </v-col>
  </v-row>
</div>
    <div v-if="!loading" class="search-wrapper mb-12">
      <v-text-field
        v-model="searchQuery"
        :placeholder="t('users.searchPlaceholder')"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        class="hero-search-input-dark"
        rounded="xl"
        hide-details
        @keyup.enter="handleSearch"
      >
        <template #append-inner>
          <v-btn
            color="teal-accent-4"
            rounded="pill"
            class="px-6 font-weight-black"
            @click="handleSearch"
          >
            {{ t('users.search') }}
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="teal-accent-4" class="mb-4 rounded-pill shadow-neon"></v-progress-linear>

    <template v-if="!loading">
      <div v-if="filteredUsers.length === 0" class="text-center py-10">
        <v-icon size="84" color="grey-darken-3">mdi-account-off-outline</v-icon>
        <p class="text-grey-darken-1 mt-4 text-h6">{{ searchQuery ? t('users.noUsersFound') : t('users.noUsers') }}</p>
      </div>

      <div v-else class="hall-of-fame">
        <v-row v-if="topThreeUsers.length > 0" class="mb-12">
          <v-col 
            v-for="(user, index) in topThreeUsers" 
            :key="user._id || user.id" 
            cols="12" md="4"
            class="reveal-animation"
            :style="{ '--i': index }"
          >
            <v-card 
              :class="['hero-card-premium', `rank-${index + 1}`]"
              @click="handleUserClick(user)"
            >
              <div class="card-glass-overlay"></div>
              
              <v-card-text class="text-center pt-8">
                <div class="avatar-wrapper mb-4">
                  <div :class="['rank-crown-badge', `rank-color-${index + 1}`]">
                    <v-icon size="16">mdi-crown</v-icon>
                    <span>#{{ index + 1 }}</span>
                  </div>
                  <v-badge
                    bordered
                    :color="index === 0 ? 'amber-accent-4' : index === 1 ? 'blue-grey-lighten-4' : 'orange-darken-4'"
                    icon="mdi-check-decagram"
                    location="bottom right"
                    offset-x="10"
                    offset-y="10"
                  >
                    <v-avatar size="110" class="hero-avatar-main shadow-glow">
                      <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover></v-img>
                      <div v-else class="avatar-gen-dark">{{ getUserInitials(user.name) }}</div>
                    </v-avatar>
                  </v-badge>
                </div>

                <h3 class="hero-name-premium mt-4">{{ user.name }}</h3>
                <div class="hero-rank-tag text-overline" :style="{ color: getLevelInfoLocal(getUserLevel(user)).color }">
                  {{ getLevelInfoLocal(getUserLevel(user)).rankName }}
                </div>

                <div class="px-6 py-4">
                  <div class="xp-container-dark">
                    <div class="d-flex justify-space-between text-overline mb-1">
                      <span class="grey-text">Lvl {{ getUserLevel(user) }}</span>
                      <span class="white--text font-weight-bold">{{ getUserCurrentXp(user) }} XP</span>
                    </div>
                    <v-progress-linear 
                      :model-value="(getUserCurrentXp(user) / getLevelInfoLocal(getUserLevel(user)).xpPerLvl) * 100" 
                      :color="getLevelInfoLocal(getUserLevel(user)).color" 
                      height="8" 
                      rounded
                      class="hero-xp-bar"
                    ></v-progress-linear>
                  </div>
                </div>

                <div class="d-flex justify-center gap-4 mt-2">
                  <div class="hero-mini-stat">
                    <v-icon size="14" color="teal-accent-4">mdi-sword</v-icon>
                    <span>{{ user.challengeCount || 0 }}</span>
                  </div>
                  <div class="hero-mini-stat">
                    <v-icon size="14" color="teal-accent-4">mdi-calendar-check</v-icon>
                    <span>{{ user.daysOnSite || 0 }}D</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="remaining-heroes-grid">
          <v-col 
            v-for="(user, index) in remainingUsers" 
            :key="user._id || user.id" 
            cols="12" sm="6" lg="4"
            class="reveal-animation"
            :style="{ '--i': index + 3 }"
          >
          <v-card class="hero-card-standard-dark pa-4" @click="handleUserClick(user)">
  <div class="d-flex align-center">
    <v-badge
      color="teal-accent-4"
      :content="'Lvl ' + getUserLevel(user)"
      location="bottom right"
      offset-x="5"
      offset-y="5"
      overlap
    >
      <v-avatar size="50" class="border-neon-dim">
        <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover />
        <span v-else class="white--text font-weight-bold">{{ getUserInitials(user.name) }}</span>
      </v-avatar>
    </v-badge>

    <div class="ml-4 flex-grow-1 min-width-0">
      <div class="d-flex justify-space-between align-center">
        <h4 class="hero-name-small text-truncate">{{ user.name }}</h4>
        <v-icon size="18" color="grey-darken-2">mdi-chevron-right</v-icon>
      </div>
      
      <div class="d-flex mt-1 gap-4">
        <span class="text-caption grey-text">
          <v-icon size="12" class="stat-icon-dim">mdi-sword</v-icon>
          {{ user.challengeCount }}
        </span>
        <span class="text-caption grey-text">
          <v-icon size="12" class="stat-icon-dim">mdi-fire</v-icon>
          {{ user.daysOnSite }}d
        </span>
      </div>
      
      <v-progress-linear
        :model-value="45" 
        height="2"
        color="teal-accent-4"
        class="mt-2 opacity-50"
        rounded
      ></v-progress-linear>
    </div>
  </div>
</v-card>
          </v-col>
        </v-row>
      </div>
    </template>
  </div>
</template>

<style scoped>
.users-container {
  max-width: 1300px;
  margin: 0 auto;
}

/* Typography */
.white--text { color: #FFFFFF !important; }
.grey-text { color: rgba(255, 255, 255, 0.5) !important; }

/* Анимация появления */
.reveal-animation {
  opacity: 0;
  transform: translateY(20px);
  animation: revealHero 0.5s ease forwards;
  animation-delay: calc(var(--i) * 0.08s);
}

@keyframes revealHero {
  to { opacity: 1; transform: translateY(0); }
}

/* Поиск */
.hero-search-input-dark :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  color: white !important;
}

/* КАРТОЧКИ ТОП-3 */
.hero-card-premium {
  position: relative;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  cursor: pointer;
}

.hero-card-premium:hover {
  transform: translateY(-8px) scale(1.02);
  background: rgba(255, 255, 255, 0.06) !important;
}

.rank-1 { border-color: rgba(255, 215, 0, 0.3) !important; box-shadow: 0 0 30px rgba(255, 215, 0, 0.1) !important; }
.rank-2 { border-color: rgba(192, 192, 192, 0.3) !important; box-shadow: 0 0 30px rgba(192, 192, 192, 0.1) !important; }
.rank-3 { border-color: rgba(205, 127, 50, 0.3) !important; box-shadow: 0 0 30px rgba(205, 127, 50, 0.1) !important; }

/* Бейджи ранга */
.rank-crown-badge {
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  padding: 2px 12px;
  border-radius: 0 0 12px 12px;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}
.rank-color-1 { background: #FFD700; color: #000; }
.rank-color-2 { background: #C0C0C0; color: #000; }
.rank-color-3 { background: #CD7F32; color: #fff; }

.hero-name-premium {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

/* XP Bar */
.hero-xp-bar {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

/* Подсветка карточек в общем списке */
.hero-card-standard-dark {
  background: rgba(30, 30, 45, 0.4) !important; /* Чуть больше синевы в фоне */
  border: 1px solid rgba(79, 209, 197, 0.1) !important;
}

/* Эффект "сканирования" при наведении */
.hero-card-standard-dark:hover {
  background: rgba(79, 209, 197, 0.08) !important;
  border-color: rgba(79, 209, 197, 0.5) !important;
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.1) !important;
}

/* Сделаем иконку шеврона (стрелочки) более неоновой */
.hero-card-standard-dark .v-icon[icon="mdi-chevron-right"] {
  color: rgba(79, 209, 197, 0.3) !important;
}

.hero-card-standard-dark:hover .v-icon[icon="mdi-chevron-right"] {
  color: #4FD1C5 !important;
  transform: translateX(3px);
}

/* Имя героя (исправляем читаемость) */
.hero-name-small {
  color: #FFFFFF !important;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}

/* Иконки статов */
.stat-icon-dim {
  color: rgba(79, 209, 197, 0.6);
  margin-right: 4px;
}

/* Аватар с неоновым ободком */
.border-neon-dim {
  border: 2px solid rgba(79, 209, 197, 0.2);
  background: #0f172a !important;
}

/* Декоративный элемент - номер в углу (опционально) */
.hero-card-standard-dark::after {
  content: "USER";
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 8px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.1);
  letter-spacing: 2px;
}
/* Аватары */
.avatar-gen-dark {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: 900; color: #4FD1C5;
}

.hero-avatar-main {
  border: 4px solid rgba(255, 255, 255, 0.05);
}

.shadow-glow { box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); }

/* Мини-статы */
.hero-mini-stat {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

.border-neon-dim {
  border: 1px solid rgba(79, 209, 197, 0.2);
}

/* Utils */
.tracking-widest { letter-spacing: 4px !important; }
.shadow-neon { box-shadow: 0 0 15px rgba(79, 209, 197, 0.2) !important; }
/* --- Media Queries для мобильных устройств --- */
@media (max-width: 600px) {
  /* Уменьшаем высоту премиум-карточки (ТОП-3) */
  .hero-card-premium {
    padding-top: 20px !important;
  }

  .hero-avatar-main {
    width: 80px !important; /* Уменьшаем огромный круг */
    height: 80px !important;
    margin-top: 10px;
  }

  /* На мобилках выстраиваем имя и статус плотнее */
  .hero-name-premium {
    font-size: 1.2rem !important;
    margin-top: 8px !important;
  }

  .hero-rank-tag {
    font-size: 10px !important;
    margin-bottom: 0 !important;
  }

  /* XP Bar делаем тоньше, чтобы не съедал место */
  .hero-xp-bar {
    height: 4px !important;
  }

  .xp-container-dark {
    padding: 0 10px !important;
  }

  /* Статы в одну строку */
  .hero-mini-stat {
    scale: 0.9;
    margin: 0 2px !important;
  }
}
@media (max-width: 480px) {
  /* 1. Контейнер и заголовки */
  .users-container {
    padding: 8px !important;
  }
  
  .page-title {
    font-size: 1.25rem !important;
    margin-bottom: 4px !important;
  }

  /* 2. Поиск - делаем ниже, чтобы не занимал много места */
  .search-wrapper {
    margin-bottom: 16px !important;
  }
  
  .hero-search-input-dark :deep(.v-field) {
    height: 48px !important;
  }

  /* 3. ТОП-3 (Podium) - Самые большие изменения тут */
  .hero-card-premium {
    border-radius: 16px !important;
  }

  .hero-card-premium .pt-8 {
    padding-top: 16px !important; /* Уменьшаем верхний отступ */
  }

  .avatar-wrapper {
    margin-bottom: 8px !important;
  }

  /* Nina и другие лидеры: аватар меньше */
  .hero-avatar-main {
    width: 72px !important; 
    height: 72px !important;
  }

  .hero-name-premium {
    font-size: 1.1rem !important;
    margin-top: 4px !important;
  }

  .hero-rank-tag {
    font-size: 9px !important;
    margin-top: -2px;
  }

  /* XP Bar - делаем очень тонким */
  .hero-xp-bar {
    height: 4px !important;
    margin-top: 4px;
  }

  .xp-container-dark {
    padding: 0 4px !important;
  }

  .xp-container-dark .text-overline {
    font-size: 8px !important;
    line-height: 1;
  }

  /* 4. Мини-статы - в одну линию, очень мелко */
  .hero-mini-stat {
    padding: 2px 6px !important;
    font-size: 10px !important;
    gap: 4px !important;
  }

  /* 5. Остальные герои (Список) */
  .hero-card-standard-dark {
    padding: 8px 12px !important;
    margin-bottom: 6px !important;
  }

  .hero-card-standard-dark .v-avatar {
    width: 40px !important;
    height: 40px !important;
  }

  .hero-name-small {
    font-size: 0.9rem !important;
  }
}
/* Специальный блок счетчика для страницы героев */
.hero-counter-block {
  background: rgba(79, 209, 197, 0.05);
  border-left: 1px solid rgba(79, 209, 197, 0.3);
  padding: 8px 20px;
  border-radius: 0 12px 12px 0;
}

.hero-count {
  font-family: 'monospace';
  font-size: 1.5rem;
  font-weight: 900;
  color: #4FD1C5;
  text-transform: uppercase;
  line-height: 1;
}

/* Фикс для мобилок (430px) */
@media (max-width: 480px) {
  .hero-counter-block {
    margin-top: 16px;
    width: 100%;
    justify-content: flex-start;
    border-left: 2px solid #4FD1C5;
    border-radius: 0;
    padding: 4px 12px;
  }
  
  .hero-count {
    font-size: 1.2rem !important;
  }
}
.heroes-skeleton-wrapper {
  opacity: 0.8;
}

/* Стилизация "поисковой строки" под твой дизайн */
.search-bar-skeleton {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(79, 209, 197, 0.1);
  max-width: 100%;
  height: 56px;
}

/* Карточки лидеров */
.skeleton-card-dark {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(79, 209, 197, 0.1) !important;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Специфичные правки для аватаров и текста */
:deep(.v-skeleton-loader__avatar) {
  width: 120px !important;
  height: 120px !important;
  margin: 0 auto;
}

:deep(.v-skeleton-loader__text), 
:deep(.v-skeleton-loader__subtitle) {
  background: rgba(255, 255, 255, 0.05) !important;
  margin-left: auto;
  margin-right: auto;
}

/* Тонкий неоновый блик */
:deep(.v-skeleton-loader__bone::after) {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(79, 209, 197, 0.08), 
    transparent
  ) !important;
}
</style>
<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { getLevelFromXp, getXpForLevel, getRank, getXpPerLevel, getLevelInfo } from '../utils/levelSystem'

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

// Get level info using helper from levelSystem
const getLevelInfoLocal = (level) => {
  const levelInfo = getLevelInfo(level)
  return {
    ...levelInfo,
    rankName: t(`profile.ranks.${levelInfo.rankKey}`)
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