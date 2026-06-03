<template>
  <v-card
    class="challenge-card"
    :class="{ 
      'is-owner': isOwner,
      'is-failed': isFinished && !isSuccessful,
      'is-finished': isFinished,
      'is-disabled': disabled,
      'quest-mode': isQuestMode,
      'habit-mode': isActiveHabit
    }"
    @click="handleCardClick"
  >
    <div 
      v-if="isQuestMode" 
      class="card-background" 
      :style="{ backgroundImage: `url(${challenge.imageUrl})` }"
    >
      <div class="overlay-mask"></div>
    </div>

    <div v-if="isActiveHabit" class="habit-visual-wrapper">
      <div class="habit-gradient-glow"></div>
      <div class="habit-grid-pattern"></div>
    </div>

    <div v-if="isFinished && !isSuccessful" class="failed-overlay">
      <div class="smoke-effect"></div>
    </div>

    <div class="card-content">
      <div class="header-row">
        <span :class="['type-tag', challenge.challengeType]">
          {{ getMissionTypeLabel(challenge.challengeType) }}
        </span>
        <v-spacer></v-spacer>
        <v-icon v-if="challenge.privacy === 'private'" size="14" class="privacy-icon">mdi-lock</v-icon>
      </div>

      <div class="body-content">
  <h3 class="mission-title">{{ challenge.title }}</h3>
  
  <div v-if="isHabitParticipantMode" class="habit-interactive-zone">
    <div class="mini-history-grid">
      <div
        v-for="day in lastSevenDays"
        :key="day.date"
        class="history-dot"
        :class="{ filled: day.completed, today: day.date === todayString }"
        :title="day.label"
      >
      </div>
    </div>
          
    <div class="action-row">
      <div v-if="isTodayCompleted" class="streak-active">
        <span class="flame-icon-wrapper">
          <Flame :size="16" color="#00CED1" />
        </span>
        <span class="streak-val">{{ streakDays }} {{ t('missions.dayStreak') }}</span>
      </div>
      
      <div
        v-else-if="isTodayScheduled"
        class="ignite-trigger"
        @click.stop="completeToday"
      >
        <div class="ignite-pill">
          <span class="flame-icon-wrapper">
            <Flame :size="16" color="#00CED1" />
          </span>
          <span class="ignite-text">{{ t('challenges.clickToIgnite') }}</span>
        </div>
      </div>

      <div v-else class="ignite-trigger is-disabled" @click.stop>
        <div class="ignite-pill is-disabled">
          <span class="flame-icon-wrapper">
            <Flame :size="16" color="rgba(255,255,255,0.35)" />
          </span>
          <span class="ignite-text is-visible">{{ t('challenges.calendarLegend.unavailable') }}</span>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="!isParticipant && !isFinished" class="guest-info-zone">
    <div class="participant-stats">
      <v-icon size="14" color="rgba(255,255,255,0.5)">mdi-account-group</v-icon>
      <span class="ml-1">{{ participantCount }} {{ t('missions.heroesInLine') }}</span>
    </div>
    <div v-if="showJoinButton" class="join-prompt">
       {{ isHabitType ? t('missions.viewDetailsToJoin') : t('missions.viewDetails') }}
          </div>
        </div>
      </div>

      <v-spacer></v-spacer>

      <div class="footer-stats">
        <div class="progress-header">
          <span class="percent-num">{{ progressPercentage }}%</span>
          <span class="status-text">{{ t('missions.complete') }}</span>
          </div>
        <v-progress-linear
          :model-value="progressPercentage"
          :color="progressBarColor"
          height="6"
          rounded
          class="mission-progress"
        ></v-progress-linear>
      </div>
    </div>

    <div v-if="isFinished" class="finish-tag" :class="{ 'failed': !isSuccessful }">
      <v-icon size="14" class="mr-1">{{ isSuccessful ? 'mdi-check-decagram' : 'mdi-skull' }}</v-icon>
      {{ isSuccessful ? t('missions.finished') : t('missions.failed') }}
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

.challenge-card.is-disabled {
  cursor: default;
}

.challenge-card.is-disabled:hover {
  transform: none;
  border-color: rgba(255, 255, 255, 0.08) !important;
  box-shadow: none !important;
}

.challenge-card.is-disabled::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: rgba(13, 17, 28, 0.38);
  backdrop-filter: blur(3px);
  z-index: 5;
  pointer-events: none;
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
.type-tag.habit { color: #7048E8; border: 1px solid rgba(112, 72, 232, 0.3); }
.type-tag.result { color: #4FD1C5; border: 1px solid rgba(79, 209, 197, 0.3); }

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

/* Action Row */
.action-row {
  position: relative;
  z-index: 10;
  margin-top: 8px;
}

/* Ignite Логика */
.ignite-trigger {
  display: inline-flex;
  width: fit-content;
  cursor: pointer;
}

.ignite-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.ignite-trigger.is-disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.ignite-pill.is-disabled {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.06);
}

.ignite-text.is-visible {
  max-width: 140px;
  opacity: 1;
  margin-left: 8px;
  color: rgba(255, 255, 255, 0.5);
}


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

.challenge-card:hover .ignite-pill .flame-icon-wrapper svg {
  stroke: #ff9800 !important;
  filter: drop-shadow(0 0 5px rgba(255, 152, 0, 0.8));
  animation: flicker 0.8s infinite alternate;
}

.challenge-card:hover .ignite-pill .flame-icon-wrapper svg path,
.challenge-card:hover .ignite-pill .flame-icon-wrapper svg line,
.challenge-card:hover .ignite-pill .flame-icon-wrapper svg polyline {
  stroke: #ff9800 !important;
}


/* Стрик */
.streak-active {
  display: flex;
  width: fit-content;
  align-items: center;
  color: #00CED1;
  font-size: 11px;
  font-weight: 900;
  background: rgba(0, 206, 209, 0.1);
  padding: 5px 15px;
  border-radius: 30px;
  position: relative;
  z-index: 10;
}

.flame-icon-wrapper {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
  flex-shrink: 0;
  position: relative;
  z-index: 11;
}

.streak-active svg {
  flex-shrink: 0;
  display: block;
  position: relative;
  z-index: 11;
  pointer-events: none;
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
/* Базовый контейнер прогресс-бара */
.mission-progress {
  background: rgba(255, 255, 255, 0.05) !important;
  overflow: visible !important; /* Важно: чтобы свечение не обрезалось */
}

/* Стилизация внутренней полосы заполнения */
.mission-progress :deep(.v-progress-linear__determinate) {
  transition: all 0.3s ease;
  border-radius: 20px;
}

/* Фиолетовое свечение (для Habit) */
.mission-progress :deep(.v-progress-linear__determinate[style*="background-color: rgb(112, 72, 232)"]),
.mission-progress :deep(.v-progress-linear__determinate[style*="background-color: #7048E8"]) {
  box-shadow: 0 0 12px 2px rgba(112, 72, 232, 0.7), 
              0 0 20px 0px rgba(112, 72, 232, 0.4);
}

/* Бирюзовое свечение (для Result/Challenge) */
.mission-progress :deep(.v-progress-linear__determinate[style*="background-color: rgb(79, 209, 197)"]),
.mission-progress :deep(.v-progress-linear__determinate[style*="background-color: #4FD1C5"]) {
  box-shadow: 0 0 12px 2px rgba(79, 209, 197, 0.7), 
              0 0 20px 0px rgba(79, 209, 197, 0.4);
}

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
  display: flex;
}

.participant-stats {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  width: fit-content;
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

/* Лёгкий оверлей для проваленных миссий (без SVG noise — дешевле при множестве карточек) */
.challenge-card.is-failed::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 82, 82, 0.08) 0%,
    transparent 45%,
    rgba(20, 20, 30, 0.12) 100%
  );
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

@media (max-width: 600px) {
  .challenge-card {
    backdrop-filter: blur(6px);
  }

  .challenge-card:hover {
    transform: none;
    box-shadow: none !important;
  }

  .challenge-card:hover .card-background {
    transform: none;
  }

  .smoke-effect {
    animation: none;
    filter: blur(20px);
  }

  .habit-gradient-glow {
    filter: blur(24px);
  }

  .challenge-card:hover .ignite-pill .flame-icon-wrapper svg {
    animation: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .challenge-card,
  .card-background,
  .ignite-pill,
  .ignite-text,
  .smoke-effect,
  .mission-progress :deep(.v-progress-linear__determinate) {
    transition: none !important;
    animation: none !important;
  }

  .challenge-card:hover {
    transform: none;
  }

  .challenge-card:hover .card-background {
    transform: none;
  }

  .challenge-card:hover .ignite-pill .flame-icon-wrapper svg {
    animation: none !important;
  }
}
</style>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChallengeType } from '../composables/useChallengeType'
import { useChallengeCardProgress } from '../composables/useChallengeCardProgress'
import { Flame } from 'lucide-vue-next'
import { isChallengeFinished } from '../utils/challengeStatus'

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
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'update'])

const { t } = useI18n()
const { getMissionTypeLabel } = useChallengeType()

const currentUserIdString = computed(() => props.currentUserId?.toString() || '')

const {
  isHabitType,
  isResultType,
  isParticipant,
  progressPercentage,
  efficiencyPercentage,
  streakDays,
  isTodayCompleted,
  isTodayScheduled,
  lastSevenDays,
  todayString,
  completeToday
} = useChallengeCardProgress(props, emit)

const isOwner = computed(() => {
  if (!props.challenge.owner || !currentUserIdString.value) return false
  const ownerId = props.challenge.owner._id || props.challenge.owner
  return ownerId?.toString() === currentUserIdString.value
})

const participantCount = computed(() => {
  return props.challenge.participants ? props.challenge.participants.length : 0
})

const isFinished = computed(() => isChallengeFinished(props.challenge))

const isActiveHabit = computed(() => isHabitType.value && !isFinished.value)

const progressBarColor = computed(() => (isHabitType.value ? '#7048E8' : '#4FD1C5'))

const isQuestMode = computed(() => {
  return isResultType.value && props.challenge.imageUrl && !isFinished.value
})

const isHabitParticipantMode = computed(() => {
  return isParticipant.value && isActiveHabit.value
})

const isSuccessful = computed(() => {
  if (!isFinished.value) return false
  if (isResultType.value) {
    return efficiencyPercentage.value === 100
  }
  if (isHabitType.value) {
    return progressPercentage.value === 100
  }
  return false
})

function handleCardClick() {
  if (props.disabled) return
  emit('click', props.challenge)
}
</script>



