<template>
  <div class="watched-challenges-page pa-4">
    <div class="header-section text-left mb-10 reveal-animation">
  <div class="d-flex align-center mb-1">
    <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-radar</v-icon>
    <h1 class="page-title-dark">Strategic Surveillance</h1>
  </div>
  <div class="text-overline text-teal-accent-4 tracking-widest ml-13">Active Monitoring Ops</div>
  <p class="journal-subtitle-dark mt-2">Tracking high-priority targets and progress across the global network.</p>
</div>

    <v-progress-linear v-if="loading" indeterminate color="teal-accent-4" class="mb-4 shadow-neon"></v-progress-linear>

    <v-row v-if="challenges.length" class="watched-layout">
      <v-col cols="12" md="8">
        <v-card
          v-for="challenge in challenges"
          :key="challenge._id"
          class="watched-mission-card mb-6"
          variant="flat"
          @click="openDetails(challenge)"
        >
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-start mb-4">
              <div>
                <h3 class="mission-title text-h5 font-weight-bold white--text">{{ challenge.title }}</h3>
                <div class="author-tag d-flex align-center mt-1">
                  <v-icon size="14" color="teal-accent-4" class="mr-1">mdi-shield-check</v-icon>
                  <span class="text-caption grey-text mr-1">{{ t('challenges.createdBy').split('{name}')[0] }}</span>
                  <span class="author-name text-caption font-weight-bold" @click.stop="navigateToUser(challenge.owner)">
                    {{ challenge.owner?.name || t('common.unknown') }}
                  </span>
                </div>
              </div>
              <v-chip
                :color="challenge.challengeType === 'habit' ? 'teal-accent-4' : 'deep-purple-accent-2'"
                size="small"
                variant="flat"
                class="font-weight-black"
              >
                {{ challenge.challengeType === 'habit' ? 'RITUAL' : 'QUEST' }}
              </v-chip>
            </div>

            <div v-if="challenge.owner" class="author-progress-block mb-6">
              <div class="d-flex justify-space-between mb-2 align-center">
                <span class="text-overline grey-text">Hero's Progress</span>
                <span class="progress-val font-weight-black text-teal-accent-4">
                  {{ getOwnerProgressPercentage(challenge) }}%
                </span>
              </div>
              <v-progress-linear
                :model-value="getOwnerProgressPercentage(challenge)"
                color="teal-accent-4"
                height="10"
                rounded
                class="mission-bar"
              >
                <div class="bar-glow"></div>
              </v-progress-linear>
            </div>

            <div class="card-actions d-flex justify-space-between">
              <v-btn
                variant="text"
                color="grey-lighten-1"
                size="small"
                class="unwatch-btn"
                @click.stop="unwatchChallenge(challenge)"
              >
                <v-icon start size="16">mdi-eye-off-outline</v-icon>
                Stop Monitoring
              </v-btn>
              
              <v-btn
                v-if="canJoin(challenge)"
                color="teal-accent-4"
                variant="flat"
                size="small"
                rounded="lg"
                class="join-btn font-weight-black px-6"
                @click.stop="joinChallenge(challenge)"
              >
                JOIN MISSION
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="sidebar-widget mb-6" variant="flat">
          <div class="widget-header pa-4 d-flex align-center">
            <v-icon color="amber" class="mr-2">mdi-trophy-variant</v-icon>
            <span class="text-overline font-weight-black">Elite Performers</span>
          </div>
          <v-card-text class="pa-4 pt-0">
            <div v-for="(p, i) in topPerformers" :key="i" class="performer-row d-flex align-center mb-4">
              <div class="rank-badge">{{ i + 1 }}</div>
              <v-avatar size="36" class="mx-3 border-neon">
                <v-img v-if="getParticipantAvatar(p)" :src="getParticipantAvatar(p)" />
                <span v-else class="text-caption">{{ getParticipantInitial(p) }}</span>
              </v-avatar>
              <div class="flex-grow-1 min-width-0">
                <div class="text-body-2 font-weight-bold white--text text-truncate">{{ getParticipantName(p) }}</div>
                <v-progress-linear :model-value="getParticipantProgressPercentage(p)" height="3" color="teal-accent-4" rounded></v-progress-linear>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="sidebar-widget" variant="flat">
          <div class="widget-header pa-4 d-flex align-center">
            <v-icon color="teal-accent-4" class="mr-2">mdi-broadcast</v-icon>
            <span class="text-overline font-weight-black">Surveillance Feed</span>
          </div>
          <div class="feed-scroll no-scrollbar px-2">
            <div v-for="act in feedActivities" :key="act.id" class="activity-entry pa-3">
              <div class="d-flex align-start gap-3">
                <v-avatar size="24" class="mt-1">
                  <v-img :src="act.userAvatar" />
                </v-avatar>
                <div>
                  <div class="text-caption white--text">
                    <b class="text-teal-accent-3">{{ act.userName }}</b> {{ act.text }}
                  </div>
                  <div class="text-time">{{ formatActivityTime(act.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* Фоновые настройки страницы */
.watched-challenges-page {
  background: transparent;
  color: #fff;
}

/* Карточка Миссии (Glassmorphism) */
.watched-mission-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  transition: all 0.3s ease;
}

.watched-mission-card:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(79, 209, 197, 0.4) !important;
  transform: translateY(-4px);
}

/* Заголовок миссии */
.mission-title {
  color: #FFFFFF !important; /* Чистый белый для контраста */
  font-size: 1.25rem;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* Немного объема */
}

/* Имя автора и доп. информация */
.author-name, .text-caption, .grey-text {
  color: rgba(255, 255, 255, 0.7) !important; /* Светло-серый */
}

/* Наведение на имя автора */
.author-name:hover {
  color: #4FD1C5 !important; /* Бирюзовый при наведении */
  text-decoration: underline;
}

/* Текст "Hero's Progress" и проценты */
.text-overline, .progress-val {
  color: rgba(255, 255, 255, 0.9) !important;
}
.grey-text {
  color: rgba(255, 255, 255, 0.5);
}

/* Кастомный прогресс-бар */
.mission-bar {
  background: rgba(255, 255, 255, 0.05) !important;
  overflow: visible;
}

.bar-glow {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  box-shadow: 0 0 15px rgba(79, 209, 197, 0.3);
  pointer-events: none;
}

/* Боковые виджеты */
.sidebar-widget {
  background: rgba(15, 15, 25, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 24px !important;
  /* Сетчатый фон */
  background-image: radial-gradient(rgba(79, 209, 197, 0.1) 1px, transparent 1px) !important;
  background-size: 20px 20px !important;
}

.rank-badge {
  width: 20px;
  font-family: 'Monaco', monospace;
  font-weight: 900;
  color: rgba(79, 209, 197, 0.4);
}

.border-neon {
  border: 1px solid rgba(79, 209, 197, 0.3);
}

/* Лента новостей */
.feed-scroll {
  max-height: 450px;
  overflow-y: auto;
}

.activity-entry {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.text-time {
  font-size: 10px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
}
.unwatch-btn {
  color: rgba(255, 255, 255, 0.5) !important; /* Неяркий текст для второстепенной кнопки */
  text-transform: none !important;
  font-weight: 600 !important;
}

.unwatch-btn:hover {
  color: #FF5252 !important; /* Красный при наведении (опасное действие) */
  background: rgba(255, 82, 82, 0.1) !important;
}

.no-scrollbar::-webkit-scrollbar { display: none; }

/* Кнопки */
.join-btn {
  box-shadow: 0 4px 15px rgba(79, 209, 197, 0.3) !important;
}

.tracking-widest {
  letter-spacing: 4px !important;
}
/* Имена в списке лидеров */
.performer-row .text-body-2 {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

/* Индикатор прогресса в сайдбаре */
.performer-row .text-caption {
  color: #4FD1C5 !important; /* Бирюзовый для процентов */
  font-family: 'monospace';
}

/* Ранг (номер места) */
.rank-badge {
  color: #4FD1C5 !important;
  opacity: 0.8;
  font-weight: 900;
  text-shadow: 0 0 5px rgba(79, 209, 197, 0.3);
}
/* Имя пользователя в ленте */
.activity-entry b.text-teal-accent-3 {
  color: #4FD1C5 !important;
  font-weight: 800;
}

/* Сам текст события (например, "commented in...") */
.activity-entry .text-caption.white--text {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* Ссылка на миссию внутри ленты (если есть) */
.activity-entry .grey--text {
  color: rgba(255, 255, 255, 0.6) !important;
}

/* Время события */
.text-time {
  color: rgba(255, 255, 255, 0.4) !important;
  font-size: 10px;
  letter-spacing: 0.5px;
}
.sidebar-widget {
  background: rgba(20, 20, 35, 0.7) !important;
  border: 1px solid rgba(79, 209, 197, 0.15) !important;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05);
}

.widget-header span.text-overline {
  color: #FFFFFF !important;
  letter-spacing: 2px !important;
}
@media (max-width: 480px) {
  /* 1. Контейнер и заголовок секции */
  .watched-challenges-page {
    padding: 8px !important;
  }

  .header-section {
    margin-bottom: 16px !important;
    margin-left: 8px !important;
  }

  .page-title {
    font-size: 1.5rem !important; /* Уменьшаем "Following" */
  }

  .header-section .text-overline {
    font-size: 7px !important; /* "STRATEGIC SURVEILLANCE" совсем мелко */
    letter-spacing: 2px !important;
  }

  /* 2. Карточка миссии */
  .watched-mission-card {
    margin-bottom: 12px !important;
    border-radius: 16px !important; /* Более аккуратные углы */
  }

  .watched-mission-card :deep(.v-card-text) {
    padding: 12px !important; /* Сжимаем внутренние отступы */
  }

  .mission-title {
    font-size: 1.1rem !important; /* Компактные названия */
    line-height: 1.2;
    margin-bottom: 4px !important;
  }

  /* 3. Инфо об авторе и чипы */
  .author-tag {
    margin-top: 0 !important;
  }

  .author-name, .grey-text {
    font-size: 10px !important;
  }

  .v-chip.v-chip--size-small {
    font-size: 9px !important;
    height: 18px !important;
    padding: 0 6px !important;
  }

  /* 4. Прогресс-бар (самый важный фикс) */
  .author-progress-block {
    margin-bottom: 12px !important;
  }

  .author-progress-block .text-overline {
    font-size: 8px !important;
    margin-bottom: 2px !important;
  }

  .progress-val {
    font-size: 11px !important;
  }

  .mission-bar {
    height: 6px !important; /* Тонкая изящная линия */
  }

  /* 5. Кнопки действий */
  .card-actions {
    margin-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 8px;
  }

  .unwatch-btn {
    font-size: 10px !important;
    letter-spacing: 0 !important;
    height: 28px !important;
  }

  .join-btn {
    height: 32px !important;
    font-size: 10px !important;
    padding: 0 12px !important;
  }

  /* 6. Боковые виджеты (если они рендерятся под списком) */
  .sidebar-widget {
    border-radius: 16px !important;
    margin-bottom: 12px !important;
  }

  .widget-header {
    padding: 10px 12px !important;
  }

  .performer-row {
    margin-bottom: 8px !important;
  }
  /* Анимация вращения радара для страницы Following */
.mdi-radar {
  animation: radar-pulse 4s infinite linear;
}

@keyframes radar-pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

/* На мобильных устройствах 430px */
@media (max-width: 480px) {
  .page-title-dark {
    font-size: 1.5rem !important; /* "Strategic Surveillance" длинное слово, чуть уменьшим */
  }
  
  .ml-13 {
    margin-left: 42px !important;
  }
}
}
</style>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t, locale } = useI18n()

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))
const currentUserId = ref(getCurrentUserId())
const joiningId = ref(null)
const leavingId = ref(null)
const watchingId = ref(null)
const feedLoading = ref(false)
const feedActivities = ref([])

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
const saveLoading = ref(false)
const saveError = ref('')
const deleteLoading = ref(false)

const selectedIsOwner = computed(() => {
  if (!selectedChallenge.value) return false
  return isChallengeOwner(selectedChallenge.value.owner)
})

const selectedIsParticipant = computed(() => {
  if (!selectedChallenge.value) return false
  return isParticipant(selectedChallenge.value)
})

const selectedJoinLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return joiningId.value === selectedChallenge.value._id
})

const showDialogJoinButton = computed(() => {
  if (!selectedChallenge.value) return false
  
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    !selectedIsParticipant.value
  )
})

const showDialogLeaveButton = computed(() => {
  if (!selectedChallenge.value) return false
  
  // Cannot leave if challenge has ended
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  // Can only leave habit challenges
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    selectedIsParticipant.value
  )
})

const selectedLeaveLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return leavingId.value === selectedChallenge.value._id
})

function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return user.id || user._id || null
  } catch {
    return null
  }
}

function isChallengeOwner(owner) {
  if (!owner || !currentUserId.value) return false
  const ownerId = owner._id || owner
  return ownerId.toString() === currentUserId.value.toString()
}

function isParticipant(challenge) {
  if (!challenge.participants || !currentUserId.value) return false
  return challenge.participants.some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === currentUserId.value.toString()
  })
}

function isChallengeEnded(challenge) {
  if (!challenge.endDate) return false
  try {
    const endDate = new Date(challenge.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today
  } catch {
    return false
  }
}

async function loadWatchedChallenges() {
  if (!currentUserId.value) {
    errorMessage.value = t('challenges.loginPrompt')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await challengeService.getWatchedChallenges(currentUserId.value)
    challenges.value = data.challenges || []
    // Load feed activities after challenges are loaded
    await loadFeedActivities()
  } catch (error) {
    console.error('Error loading watched challenges:', error)
    errorMessage.value = error.response?.data?.message || t('challenges.loadError')
  } finally {
    loading.value = false
  }
}

async function loadFeedActivities() {
  if (!currentUserId.value || challenges.value.length === 0) {
    feedActivities.value = []
    return
  }

  feedLoading.value = true
  
  try {
    const activities = []
    
    // Process each watched challenge
    for (const challenge of challenges.value) {
      // 1. Get comments (challenge diary entries)
      if (challenge.allowComments !== false) {
        try {
          const { data } = await challengeService.getComments(challenge._id)
          const comments = data.comments || []
          
          comments.forEach(comment => {
            const user = comment.userId
            const userName = user?.name || t('common.unknown')
            const userAvatar = user?.avatarUrl || null
            const userInitial = userName.charAt(0).toUpperCase()
            const userId = user?._id || user
            
            activities.push({
              id: `comment-${challenge._id}-${comment._id}`,
              type: 'comment',
              timestamp: new Date(comment.createdAt),
              userName,
              userAvatar,
              userInitial,
              userId,
              text: t('challenges.feed.commented', { challenge: challenge.title }),
              challengeId: challenge._id,
              challengeTitle: challenge.title
            })
          })
        } catch (error) {
          console.error(`Error loading comments for challenge ${challenge._id}:`, error)
        }
      }
      
      // 2. Get participants and their progress (joins and progress updates)
      if (challenge.participants && Array.isArray(challenge.participants)) {
        challenge.participants.forEach(participant => {
          const user = participant.userId
          const userName = user?.name || t('common.unknown')
          const userAvatar = user?.avatarUrl || null
          const userInitial = userName.charAt(0).toUpperCase()
          const userId = user?._id || user || participant.userId
          
          // Check if challenge was just finished
          const isFinished = checkChallengeFinished(challenge)
          const completedDays = participant.completedDays || []
          
          if (isFinished && completedDays.length > 0) {
            // Check if this is a recent completion (within last 7 days)
            const lastCompleted = completedDays[completedDays.length - 1]
            if (lastCompleted) {
              const lastDate = new Date(lastCompleted)
              const daysAgo = (new Date() - lastDate) / (1000 * 60 * 60 * 24)
              if (daysAgo <= 7) {
                activities.push({
                  id: `finished-${challenge._id}-${userId}`,
                  type: 'finished',
                  timestamp: lastDate,
                  userName,
                  userAvatar,
                  userInitial,
                  userId,
                  text: t('challenges.feed.finished', { challenge: challenge.title }),
                  challengeId: challenge._id,
                  challengeTitle: challenge.title
                })
              }
            }
          }
          
          // Add join activity (if participant has any completed days, they joined)
          if (completedDays.length > 0) {
            const firstDay = completedDays[0]
            if (firstDay) {
              const joinDate = new Date(firstDay)
              const daysAgo = (new Date() - joinDate) / (1000 * 60 * 60 * 24)
              // Only show recent joins (within last 30 days)
              if (daysAgo <= 30) {
                activities.push({
                  id: `join-${challenge._id}-${userId}`,
                  type: 'join',
                  timestamp: joinDate,
                  userName,
                  userAvatar,
                  userInitial,
                  userId,
                  text: t('challenges.feed.joined', { challenge: challenge.title }),
                  challengeId: challenge._id,
                  challengeTitle: challenge.title
                })
              }
            }
          }
          
          // Add progress updates (recent completed days)
          if (completedDays.length > 0) {
            const recentDays = completedDays
              .map(day => new Date(day))
              .filter(date => {
                const daysAgo = (new Date() - date) / (1000 * 60 * 60 * 24)
                return daysAgo <= 7 && daysAgo >= 0 // Last 7 days
              })
              .sort((a, b) => b - a) // Most recent first
            
            recentDays.forEach(dayDate => {
              activities.push({
                id: `progress-${challenge._id}-${userId}-${dayDate.toISOString()}`,
                type: 'progress',
                timestamp: dayDate,
                userName,
                userAvatar,
                userInitial,
                userId,
                text: t('challenges.feed.progress', { challenge: challenge.title }),
                challengeId: challenge._id,
                challengeTitle: challenge.title
              })
            })
          }
        })
      }
    }
    
    // Sort all activities by timestamp (newest first) and limit to 50
    feedActivities.value = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
    
  } catch (error) {
    console.error('Error loading feed activities:', error)
  } finally {
    feedLoading.value = false
  }
}

function checkChallengeFinished(challenge) {
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

function formatActivityTime(timestamp) {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return t('challenges.comments.justNow')
    if (diffMins < 60) return t('challenges.comments.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('challenges.comments.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('challenges.comments.daysAgo', { count: diffDays })
    
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(date)
  } catch (err) {
    return timestamp.toLocaleDateString()
  }
}

async function joinChallenge(challenge) {
  if (!currentUserId.value) return

  joiningId.value = challenge._id
  try {
    await challengeService.joinChallenge(challenge._id, { userId: currentUserId.value })
    await loadWatchedChallenges()
    if (detailsDialogOpen.value && selectedChallenge.value?._id === challenge._id) {
      await handleDialogUpdate()
    }
  } catch (error) {
    console.error('Error joining challenge:', error)
    alert(error.response?.data?.message || t('challenges.joinError'))
  } finally {
    joiningId.value = null
  }
}

async function watchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  
  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
  }
  
  try {
    await challengeService.watchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (error) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
    }
    console.error('Error watching challenge:', error)
    alert(error.response?.data?.message || t('challenges.watchError'))
  } finally {
    watchingId.value = null
  }
}

async function unwatchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  
  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
  }
  
  try {
    await challengeService.unwatchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
    if (detailsDialogOpen.value && selectedChallenge.value?._id === challenge._id) {
      detailsDialogOpen.value = false
    }
  } catch (error) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
    }
    console.error('Error unwatching challenge:', error)
    alert(error.response?.data?.message || t('challenges.unwatchError'))
  } finally {
    watchingId.value = null
  }
}

function openDetails(challenge) {
  selectedChallenge.value = challenge
  detailsDialogOpen.value = true
}

function handleOwnerNavigated() {
  // Close dialog when owner is navigated
  detailsDialogOpen.value = false
}

async function handleDialogSave() {
  // Not implemented for watched challenges
}

async function leaveChallenge(challenge) {
  if (!currentUserId.value) {
    errorMessage.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    errorMessage.value = t('notifications.joinError')
    return
  }

  leavingId.value = challenge._id
  errorMessage.value = ''

  try {
    await challengeService.leaveChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh watched challenges list
    await loadWatchedChallenges()
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (error) {
        // Fallback to finding in list
        selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.joinError')
  } finally {
    leavingId.value = null
  }
}

async function handleDialogJoin(challenge) {
  await joinChallenge(challenge)
}

async function handleDialogLeave() {
  if (!selectedChallenge.value) return
  await leaveChallenge(selectedChallenge.value)
}

async function handleDialogDelete() {
  // Not implemented for watched challenges
}

async function handleDialogUpdate() {
  if (!selectedChallenge.value) return
  try {
    const { data } = await challengeService.getChallenge(selectedChallenge.value._id)
    selectedChallenge.value = data
    // Update in challenges list
    const index = challenges.value.findIndex(c => c._id === data._id)
    if (index !== -1) {
      challenges.value[index] = data
    }
  } catch (error) {
    console.error('Error updating challenge:', error)
  }
}

// Format date range
function formatDateRange(start, end) {
  const startFormatted = formatDate(start)
  const endFormatted = formatDate(end)
  return startFormatted && endFormatted
    ? `${startFormatted} - ${endFormatted}`
    : startFormatted || endFormatted || ''
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    return formatter.format(date)
  } catch (err) {
    return date.toLocaleDateString()
  }
}

// Get owner progress
function getOwnerProgress(challenge) {
  if (!challenge.owner) return null
  
  // For result challenges, check actions
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions)) return null
    // Count checked actions (including parent and child actions)
    let checkedCount = 0
    challenge.actions.forEach(action => {
      if (action.checked) checkedCount++
      if (action.children && Array.isArray(action.children)) {
        action.children.forEach(child => {
          if (child.checked) checkedCount++
        })
      }
    })
    return checkedCount
  }
  
  // For habit challenges, check completedDays
  if (!challenge.participants) return null
  
  const ownerId = challenge.owner._id || challenge.owner
  const participant = challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === ownerId.toString()
  })
  
  if (!participant || !participant.completedDays) return null
  return participant.completedDays.length
}

function getOwnerProgressDone(challenge) {
  const progress = getOwnerProgress(challenge)
  return progress !== null ? progress : 0
}

function getOwnerProgressTotal(challenge) {
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions)) return 0
    // Count total actions (including parent and child actions)
    let totalCount = 0
    challenge.actions.forEach(action => {
      totalCount++ // Count parent action
      if (action.children && Array.isArray(action.children)) {
        totalCount += action.children.length // Count child actions
      }
    })
    return Math.max(1, totalCount) // At least 1 to avoid division by zero
  }
  
  return getChallengeTotalDays(challenge)
}

function getOwnerProgressPercentage(challenge) {
  const done = getOwnerProgressDone(challenge)
  const total = getOwnerProgressTotal(challenge)
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

function getProgressBarColor(challenge) {
  const percentage = getOwnerProgressPercentage(challenge)
  
  if (percentage === 100) {
    return 'success' // Green for 100%
  } else if (percentage >= 31) {
    return 'primary' // Bright accent blue/purple for 31-99%
  } else {
    return 'info' // Will be overridden with dark blue via CSS
  }
}

function getProgressBarColorClass(challenge) {
  const percentage = getOwnerProgressPercentage(challenge)
  
  if (percentage <= 30) {
    return 'progress-low'
  }
  return ''
}

function getChallengeTotalDays(challenge) {
  if (!challenge.startDate || !challenge.endDate) return 0
  
  try {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    if (challenge.frequency === 'everyOtherDay') {
      let count = 0
      const current = new Date(start)
      let dayIndex = 0
      while (current <= end) {
        if (dayIndex % 2 === 0) count++
        current.setDate(current.getDate() + 1)
        dayIndex++
      }
      return Math.max(1, count)
    }
    
    const diffTime = end - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diffDays)
  } catch {
    return 0
  }
}

// Top Performers - aggregate from all watched challenges
const topPerformers = computed(() => {
  // Map to track unique participants and their best progress
  const participantMap = new Map()
  
  challenges.value.forEach(challenge => {
    // Only include habit challenges (result challenges don't have participant progress)
    if (challenge.challengeType !== 'habit') return
    
    if (challenge.participants && Array.isArray(challenge.participants)) {
      challenge.participants.forEach(participant => {
        const participantId = getParticipantId(participant)
        const progressPercentage = getParticipantProgressPercentageForChallenge(participant, challenge)
        
        // Only include participants with progress > 0
        if (progressPercentage <= 0) return
        
        // Keep the best progress for each participant
        if (!participantMap.has(participantId) || participantMap.get(participantId).progressPercentage < progressPercentage) {
          participantMap.set(participantId, {
            participant,
            challenge,
            progressPercentage
          })
        }
      })
    }
  })
  
  // Convert to array, sort by progress percentage (descending) and take top 5
  const sorted = Array.from(participantMap.values())
    .sort((a, b) => {
      // Sort by progress percentage descending
      const diff = b.progressPercentage - a.progressPercentage
      return diff !== 0 ? diff : 0
    })
    .slice(0, 5)
  
  // Store progress percentage on participant for display
  return sorted.map(item => {
    const participant = { ...item.participant }
    participant._cachedProgressPercentage = item.progressPercentage
    participant._cachedChallenge = item.challenge
    return participant
  })
})

function getParticipantProgress(participant, challenge) {
  // For result challenges, participants don't have individual progress
  // Only the owner tracks progress through actions
  if (challenge.challengeType === 'result') {
    return 0
  }
  
  // For habit challenges, use completedDays
  if (!participant.completedDays || !Array.isArray(participant.completedDays)) return 0
  return participant.completedDays.length
}

function getParticipantProgressPercentage(participant) {
  // Use cached progress percentage if available (from topPerformers)
  if (participant._cachedProgressPercentage !== undefined) {
    return participant._cachedProgressPercentage
  }
  
  // Otherwise, find the challenge this participant belongs to
  const challenge = challenges.value.find(c => {
    return c.participants?.some(p => {
      const pId = p.userId?._id || p.userId || p._id
      const participantId = participant.userId?._id || participant.userId || participant._id
      return pId && participantId && pId.toString() === participantId.toString()
    })
  })
  
  if (!challenge) return 0
  return getParticipantProgressPercentageForChallenge(participant, challenge)
}

function getParticipantProgressPercentageForChallenge(participant, challenge) {
  const progress = getParticipantProgress(participant, challenge)
  const total = getChallengeTotalDays(challenge)
  if (total === 0) return 0
  return Math.round((progress / total) * 100)
}

function getParticipantId(participant) {
  return participant.userId?._id || participant.userId || participant._id || participant
}

function getParticipantName(participant) {
  return participant.userId?.name || participant.name || t('common.unknown')
}

function getParticipantAvatar(participant) {
  return participant.userId?.avatarUrl || participant.avatarUrl || null
}

function getParticipantInitial(participant) {
  const name = getParticipantName(participant)
  return name.charAt(0).toUpperCase()
}

function canJoin(challenge) {
  if (isChallengeEnded(challenge)) return false
  if (challenge.challengeType !== 'habit') return false
  if (!currentUserId.value) return false
  if (isChallengeOwner(challenge.owner)) return false
  if (isParticipant(challenge)) return false
  return true
}

function navigateToUser(user) {
  if (!user) return
  const userId = user._id || user
  if (!userId) return
  router.push(`/heroes/${userId}`)
}

function navigateToActivityUser(activity) {
  if (activity.userId) {
    router.push(`/users/${activity.userId}`)
  }
}

onMounted(() => {
  loadWatchedChallenges()
})
</script>
