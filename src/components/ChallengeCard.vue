<template>
  <v-card
    class="challenge-card"
    :class="{ 
      'is-owner': isOwner,
      'is-failed': isFinished && !isSuccessful,
      'is-finished': isFinished,
      'quest-mode': challenge.challengeType === 'result' && challenge.imageUrl && !isFinished,
      'habit-mode': challenge.challengeType === 'habit' && !isFinished
    }"
    @click="$emit('click', challenge)"
  >
    <div 
      v-if="challenge.challengeType === 'result' && challenge.imageUrl && !isFinished" 
      class="card-background" 
      :style="{ backgroundImage: `url(${challenge.imageUrl})` }"
    >
      <div class="overlay-mask"></div>
    </div>

    <div v-if="challenge.challengeType === 'habit' && !isFinished" class="habit-visual-wrapper">
      <div class="habit-gradient-glow"></div>
      <div class="habit-grid-pattern"></div>
    </div>

    <div v-if="isFinished && !isSuccessful" class="failed-overlay">
      <div class="smoke-effect"></div>
    </div>

    <div class="card-content">
      <div class="header-row">
        <span :class="['type-tag', challenge.challengeType]">
          {{ challenge.challengeType === 'habit' ? 'DAILY RITUAL' : 'EPIC QUEST' }}
        </span>
        <v-spacer></v-spacer>
        <v-icon v-if="challenge.privacy === 'private'" size="14" class="privacy-icon">mdi-lock</v-icon>
      </div>

      <div class="body-content">
  <h3 class="mission-title">{{ challenge.title }}</h3>
  
  <div v-if="isParticipant && challenge.challengeType === 'habit' && !isFinished" class="habit-interactive-zone">
    <div class="mini-history-grid">
      <div 
        v-for="(day, index) in lastSevenDays" 
        :key="index" 
        class="history-dot"
        :class="{ 'filled': day.completed, 'today': index === 6 }"
      >
        <v-tooltip activator="parent" location="top">{{ day.label }}</v-tooltip>
      </div>
    </div>

    <div class="action-row">
      <div v-if="isTodayCompleted" class="streak-active">
        <v-icon size="16" class="mr-1">mdi-fire</v-icon>
        <span class="streak-val">{{ streakDays }} DAY STREAK</span>
      </div>
      
      <div v-else class="ignite-trigger" @click.stop="completeDay">
        <div class="ignite-pill">
          <v-icon size="18" class="fire-icon">mdi-fire-outline</v-icon>
          <span class="ignite-text">{{ t('challenges.clickToIgnite') }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="!isParticipant && !isFinished" class="guest-info-zone">
    <div class="participant-stats">
      <v-icon size="14" color="rgba(255,255,255,0.5)">mdi-account-group</v-icon>
      <span class="ml-1">{{ participantCount }} heroes in line</span>
    </div>
    <div v-if="showJoinButton" class="join-prompt">
       View details to join
    </div>
  </div>
</div>

      <v-spacer></v-spacer>

      <div class="footer-stats">
        <div class="progress-header">
          <span class="percent-num">{{ progressPercentage }}%</span>
          <span class="status-text">Complete</span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          :color="challenge.challengeType === 'habit' ? '#00CED1' : '#7048E8'"
          height="6"
          rounded
          class="mission-progress"
        ></v-progress-linear>
      </div>
    </div>

    <div v-if="isFinished" class="finish-tag" :class="{ 'failed': !isSuccessful }">
      <v-icon size="14" class="mr-1">{{ isSuccessful ? 'mdi-check-decagram' : 'mdi-skull' }}</v-icon>
      {{ isSuccessful ? 'FINISHED' : 'FAILED' }}
    </div>
  </v-card>
</template>

<style scoped>
/* Базовая карточка */
.challenge-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

.challenge-card:hover {
  transform: translateY(-8px);
  border-color: rgba(112, 72, 232, 0.4) !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
}

/* Фоны */
.card-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.8s ease;
}

.challenge-card:hover .card-background { transform: scale(1.08); }

.overlay-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 15, 25, 0.2) 0%, rgba(15, 15, 25, 0.95) 80%);
}

/* Специфичный фон для Ритуалов */
.habit-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image: radial-gradient(#00CED1 0.5px, transparent 0.5px);
  background-size: 10px 10px;
  mask-image: linear-gradient(to bottom, black, transparent);
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mission-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  margin: 10px 0 15px 0;
  line-height: 1.3;
}

/* Теги */
.type-tag {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
}
.type-tag.habit { color: #00CED1; border: 1px solid rgba(0, 206, 209, 0.3); }
.type-tag.result { color: #F4A782; border: 1px solid rgba(244, 167, 130, 0.3); }

/* Мини-сетка 7 дней */
.mini-history-grid {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
}

.history-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.history-dot.filled {
  background: #00CED1;
  box-shadow: 0 0 8px rgba(0, 206, 209, 0.4);
}

.history-dot.today {
  border: 1px solid #00CED1;
  position: relative;
}

/* Ignite Логика */
.ignite-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.fire-icon { color: rgba(255, 255, 255, 0.2); transition: all 0.3s ease; }

.ignite-text {
  max-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 10px;
  font-weight: 900;
  color: #ff9800;
  opacity: 0;
  transition: all 0.3s ease;
}

.challenge-card:hover .ignite-pill {
  background: rgba(255, 152, 0, 0.1);
  border-color: rgba(255, 152, 0, 0.3);
  padding: 6px 16px;
}

.challenge-card:hover .ignite-text {
  max-width: 120px;
  opacity: 1;
  margin-left: 8px;
}

.challenge-card:hover .fire-icon {
  color: #ff9800;
  filter: drop-shadow(0 0 5px orange);
  animation: flicker 0.8s infinite alternate;
}

/* Стрик */
.streak-active {
  display: flex;
  align-items: center;
  color: #00CED1;
  font-size: 11px;
  font-weight: 900;
  background: rgba(0, 206, 209, 0.1);
  padding: 5px 15px;
  border-radius: 30px;
}

/* Прогресс */
.percent-num { font-weight: 900; font-size: 14px; color: #fff; margin-right: 6px; }
.status-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5) !important; /* Светло-серый, но не черный */
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.mission-progress { background: rgba(255, 255, 255, 0.03) !important; }

/* Финишный бейдж */
.finish-tag {
  position: absolute;
  top: 15px; right: 15px;
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
  font-size: 10px;
  font-weight: 900;
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.finish-tag.failed {
  background: rgba(244, 67, 54, 0.2);
  color: #F44336;
  border-color: rgba(244, 67, 54, 0.3);
}

@keyframes flicker {
  from { transform: scale(1); opacity: 0.7; }
  to { transform: scale(1.15); opacity: 1; }
}
.guest-info-zone {
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.participant-stats {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
}

.join-prompt {
  font-size: 10px;
  color: #00CED1;
  margin-top: 4px;
  font-weight: 800;
  text-transform: uppercase;
}
/* Визуализация Ритуалов */
.habit-visual-wrapper {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.habit-gradient-glow {
  position: absolute;
  top: -20%; left: -10%; width: 140%; height: 140%;
  background: radial-gradient(circle at 20% 20%, rgba(0, 206, 209, 0.15) 0%, transparent 50%);
  filter: blur(40px);
}

.habit-grid-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image: radial-gradient(rgba(0, 206, 209, 0.5) 1px, transparent 1px);
  background-size: 14px 14px;
  mask-image: linear-gradient(to bottom, black 30%, transparent 90%);
}
/* Контейнер для эффекта дыма/пыли */
.failed-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(10, 10, 15, 0.4); /* Затемнение */
  overflow: hidden;
}

.smoke-effect {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background: radial-gradient(
    ellipse at center, 
    rgba(255, 82, 82, 0.03) 0%, 
    rgba(20, 20, 30, 0.05) 40%, 
    transparent 70%
  );
  /* Используем анимацию для имитации движения тумана */
  animation: smokeMovement 8s ease-in-out infinite alternate;
  pointer-events: none;
  filter: blur(40px);
}

/* Анимация ленивого движения дыма */
@keyframes smokeMovement {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translate(5%, 10%) scale(1.1) rotate(5deg);
    opacity: 0.6;
  }
  100% {
    transform: translate(-5%, 5%) scale(1.05) rotate(-3deg);
    opacity: 0.4;
  }
}

/* Дополнительный штрих: эффект «битых пикселей» или помех для проваленных миссий */
.is-failed::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.04; /* Едва заметный шум */
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 3;
}
.challenge-card.is-failed {
  filter: grayscale(0.4);
  border-color: rgba(255, 82, 82, 0.2) !important;
}

.challenge-card.is-failed .mission-title {
  color: rgba(255, 255, 255, 0.4);
  text-decoration: line-through rgba(255, 82, 82, 0.3);
}
.is-finished { filter: grayscale(0.8); opacity: 0.7; }
</style>
<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { Flame } from 'lucide-vue-next'
import upcomingImage from '../assets/upcoming.png'
import successImage from '../assets/success.png'
import failedImage from '../assets/failed.png'

const props = defineProps({
  challenge: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    default: null
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  joiningId: {
    type: String,
    default: null
  },
  leavingId: {
    type: String,
    default: null
  },
  watchingId: {
    type: String,
    default: null
  },
  isWatched: {
    type: Boolean,
    default: false
  },
  allChallenges: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'join', 'leave', 'watch', 'unwatch', 'owner-navigated', 'update'])

// Local watchers count
const localWatchersCount = ref(props.challenge.watchersCount ?? 0)

watch(() => props.challenge.watchersCount, (newCount) => {
  if (newCount !== undefined) {
    localWatchersCount.value = newCount
  }
}, { immediate: true })

const watchersCount = computed(() => localWatchersCount.value)

const { t, locale } = useI18n()
const router = useRouter()

// --- HELPERS ---

function formatDateString(date) {
  try {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return null
  }
}

function normalizeDate(date) {
  if (!date) return null
  let dateStr = String(date)
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0]
  }
  return dateStr.substring(0, 10)
}

// --- COMPUTED PROPERTIES ---

const isOwner = computed(() => {
  if (!props.challenge.owner || !props.currentUserId) return false
  const ownerId = props.challenge.owner._id || props.challenge.owner
  return ownerId === props.currentUserId
})
const isParticipant = computed(() => {
  if (!props.currentUserId || !props.challenge.participants) return false
  
  return props.challenge.participants.some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === props.currentUserId.toString()
  })
})

const participantCount = computed(() => {
  return props.challenge.participants ? props.challenge.participants.length : 0
})
const isFinished = computed(() => {
  if (props.challenge.endDate) {
    try {
      const endDate = new Date(props.challenge.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < today) return true
    } catch { /* continue */ }
  }
  
  if (props.challenge.challengeType === 'result') {
    if (!props.challenge.actions?.length) return false
    return props.challenge.actions.every(action => {
      if (!action.checked) return false
      if (action.children?.length) return action.children.every(child => child.checked)
      return true
    })
  }
  return false
})

const isSuccessful = computed(() => {
  if (!isFinished.value) return false
  if (props.challenge.challengeType === 'result') {
    return efficiencyPercentage.value === 100
  }
  if (props.challenge.challengeType === 'habit') {
    return progressPercentage.value === 100
  }
  return false
})

const isUpcoming = computed(() => {
  if (!props.challenge.startDate) return false
  try {
    const startDate = new Date(props.challenge.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    return startDate > today
  } catch { return false }
})

const streakDays = computed(() => {
  if (props.challenge.challengeType !== 'habit' || !props.currentUserId || !props.challenge.participants) return 0
  
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === props.currentUserId.toString()
  })
  
  if (!participant?.completedDays?.length) return 0
  
  const completedDateStrings = participant.completedDays.map(d => normalizeDate(d)).filter(Boolean)
  const todayStr = formatDateString(new Date())
  
  let startDate = new Date()
  startDate.setHours(0,0,0,0)
  if (!completedDateStrings.includes(todayStr)) {
    startDate.setDate(startDate.getDate() - 1)
  }
  
  let streak = 0
  let currentDate = new Date(startDate)
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDateString(currentDate)
    if (completedDateStrings.includes(dateStr)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  return streak
})

const isTodayCompleted = computed(() => {
  if (props.challenge.challengeType !== 'habit' || !props.currentUserId || !props.challenge.participants) return false
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === props.currentUserId.toString()
  })
  const todayStr = formatDateString(new Date())
  return (participant?.completedDays || []).some(d => normalizeDate(d) === todayStr)
})

// Определяем, чей прогресс нам нужно отображать
const targetParticipant = computed(() => {
  if (!props.challenge.participants) return null;

  // 1. Пытаемся найти текущего авторизованного пользователя
  const currentUser = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id;
    return userId && userId.toString() === props.currentUserId?.toString();
  });
  if (currentUser) return currentUser;

  // 2. Если мы гость, находим владельца (Owner) среди участников
  const ownerId = props.challenge.owner?._id || props.challenge.owner;
  return props.challenge.participants.find(p => {
    const pId = p.userId?._id || p.userId || p._id;
    return pId && pId.toString() === ownerId?.toString();
  });
});

// Исправленный прогресс
const progressDone = computed(() => {
  if (props.challenge.challengeType === 'result') {
    let count = 0;
    props.challenge.actions?.forEach(action => {
      if (action.checked) count++;
      action.children?.forEach(child => { if (child.checked) count++; });
    });
    return count;
  } else {
    // Используем данные целевого участника вместо жесткой привязки к currentUserId
    return targetParticipant.value?.completedDays?.length || 0;
  }
});

// Исправленная сетка последних 7 дней
const lastSevenDays = computed(() => {
  const days = [];
  const completedDates = (targetParticipant.value?.completedDays || [])
    .map(d => normalizeDate(d));

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = formatDateString(d);
    days.push({
      date: dateStr,
      completed: completedDates.includes(dateStr),
      label: i === 0 ? t('common.today') : dateStr
    });
  }
  return days;
});

const progressTotal = computed(() => {
  if (props.challenge.challengeType === 'result') {
    let count = 0
    props.challenge.actions?.forEach(action => {
      count++
      if (action.children) count += action.children.length
    })
    return count
  } else {
    try {
      const start = new Date(props.challenge.startDate)
      const end = new Date(props.challenge.endDate)
      if (isNaN(start) || isNaN(end)) return 0
      start.setHours(0,0,0,0); end.setHours(0,0,0,0)
      
      if (props.challenge.frequency === 'everyOtherDay') {
        let count = 0; let curr = new Date(start); let idx = 0
        while (curr <= end) {
          if (idx % 2 === 0) count++
          curr.setDate(curr.getDate() + 1); idx++
        }
        return count
      }
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    } catch { return 0 }
  }
})

const progressPercentage = computed(() => {
  const total = progressTotal.value
  if (total === 0) return 0
  return Math.min(100, Math.max(0, Math.round((progressDone.value / total) * 100)))
})

const efficiencyPercentage = computed(() => {
  if (props.challenge.challengeType !== 'result' || !props.challenge.actions) return 0
  let total = 0, completed = 0
  props.challenge.actions.forEach(a => {
    total++; if (a.checked) completed++
    a.children?.forEach(c => { total++; if (c.checked) completed++ })
  })
  return total === 0 ? 0 : Math.round((completed / total) * 100)
})

// --- ACTIONS ---

async function completeDay() {
  if (props.challenge.challengeType !== 'habit' || !props.currentUserId || isTodayCompleted.value) return
  
  const todayStr = formatDateString(new Date())
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === props.currentUserId.toString()
  })

  const newCompletedDays = [...(participant?.completedDays || []), todayStr]

  try {
    await challengeService.updateParticipantCompletedDays(props.challenge._id, props.currentUserId, newCompletedDays)
    if (participant) participant.completedDays = newCompletedDays
    
    window.dispatchEvent(new Event('participant-completed-days-updated'))
    window.dispatchEvent(new Event('challenge-updated'))
    emit('update')
  } catch (error) {
    console.error('Error completing challenge:', error)
  }
}

function handleWatchClick() {
  if (props.isWatched) {
    if (localWatchersCount.value > 0) localWatchersCount.value--
    emit('unwatch', props.challenge)
  } else {
    localWatchersCount.value++
    emit('watch', props.challenge)
  }
}

function navigateToOwner() {
  const ownerId = props.challenge.owner?._id || props.challenge.owner
  if (ownerId) {
    emit('owner-navigated')
    router.push(`/heroes/${ownerId}`)
  }
}

function restartChallenge() {
  const challengeData = { ...props.challenge, startDate: '', endDate: '' }
  sessionStorage.setItem('restartChallengeData', JSON.stringify(challengeData))
  if (props.challenge._id) sessionStorage.setItem('restartedChallengeId', props.challenge._id)
  router.push('/missions/add')
}
</script>



