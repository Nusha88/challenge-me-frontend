<template>
  <v-card
    class="challenge-card"
    :class="[{ 
      'is-owner': isOwner,
      'is-failed': isExtinguished,
      'is-finished': isFinished,
      'is-disabled': disabled,
      'has-cover': hasCoverImage,
      'habit-mode': isActiveHabit
    }, tierAccentClass]"
    @click="handleCardClick"
  >
    <div 
      v-if="hasCoverImage" 
      class="card-background" 
      :style="{ backgroundImage: `url(${challenge.imageUrl})` }"
    >
      <div class="overlay-mask"></div>
    </div>

    <div v-if="isActiveHabit && !hasCoverImage" class="habit-visual-wrapper">
      <div class="habit-gradient-glow"></div>
      <div class="habit-grid-pattern"></div>
    </div>

    <div v-if="isExtinguished" class="failed-overlay">
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

  <div v-else-if="!isFinished" class="guest-info-zone">
    <div class="participant-stats">
      <v-icon size="14" color="rgba(255,255,255,0.5)">mdi-account-group</v-icon>
      <span class="ml-1">{{ participantCount }} {{ t('missions.heroesInLine') }}</span>
    </div>
    <div v-if="showJoinButton && !isParticipant" class="join-prompt">
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
          :class="{ 'progress-resetting': progressResetting }"
        ></v-progress-linear>
      </div>
    </div>

    <div v-if="isFinished" class="finish-actions">
      <div class="finish-tag" :class="`finish-tag--${missionTier}`">
        <v-icon size="14">{{ tierIcon }}</v-icon>
        <span>{{ tierLabel }}</span>
        <span class="finish-tag-rate">{{ tierRatePercent }}%</span>
      </div>
    </div>

    <div v-if="isFinished && showExtendButton" class="extend-btn-overlay">
      <v-tooltip
        :text="insufficientSparksTooltip"
        :disabled="hasEnoughSparks"
        location="bottom"
      >
        <template #activator="{ props: tooltipProps }">
          <span v-bind="tooltipProps" class="extend-btn-wrapper">
            <button
              type="button"
              class="extend-btn"
              :disabled="!hasEnoughSparks || isExtending"
              @click.stop="openExtendConfirm"
            >
              <span>{{ t('missions.extendPath') }}</span>
              <span class="extend-btn-price">
                <span class="sparks-icon">✦</span>
                {{ EXTEND_COST }}
              </span>
            </button>
          </span>
        </template>
      </v-tooltip>
    </div>

    <v-dialog v-model="extendConfirmOpen" max-width="420">
      <v-card class="extend-confirm-card">
        <v-card-text class="pt-6">
          {{ extendConfirmText }}
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="extendConfirmOpen = false">
            {{ t('missions.extendCancel') }}
          </v-btn>
          <v-btn
            class="extend-btn extend-btn--dialog"
            :loading="isExtending"
            @click="confirmExtend"
          >
            {{ t('missions.extendConfirmAction') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
  /* Тёмная подложка сверху и снизу: тег типа и заголовок должны читаться
     даже на светлом изображении миссии */
  background: linear-gradient(
    180deg,
    rgba(10, 10, 20, 0.82) 0%,
    rgba(12, 12, 22, 0.52) 32%,
    rgba(15, 15, 25, 0.86) 76%,
    rgba(15, 15, 25, 0.96) 100%
  );
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

/* Финишный бейдж и продление */
.finish-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 12;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
}

.finish-actions > * {
  pointer-events: auto;
}

.extend-btn-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 12;
  pointer-events: none;
}

.extend-btn-overlay > * {
  pointer-events: auto;
}

.finish-tag {
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 4px 10px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(148, 163, 184, 0.18);
  color: #94A3B8;
  border: 1px solid rgba(148, 163, 184, 0.32);
}

.finish-tag-rate {
  font-weight: 800;
  opacity: 0.7;
}

.finish-tag--perfect {
  background: rgba(251, 191, 36, 0.18);
  color: #FBBF24;
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.25);
}

.finish-tag--bright {
  background: rgba(245, 158, 11, 0.16);
  color: #F59E0B;
  border-color: rgba(245, 158, 11, 0.34);
}

.finish-tag--sustained {
  background: rgba(249, 115, 22, 0.14);
  color: #FB923C;
  border-color: rgba(249, 115, 22, 0.3);
}

.extend-btn-wrapper {
  display: inline-flex;
}

.extend-btn {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  border-radius: 8px;
  padding: 10px 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.extend-btn:hover:not(:disabled) {
  box-shadow: 0 0 16px rgba(112, 72, 232, 0.6);
  transform: translateY(-1px);
}

.extend-btn:disabled {
  opacity: 0.5;
  filter: grayscale(1);
  cursor: not-allowed;
}

.extend-btn-price {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 900;
}

.extend-btn .sparks-icon {
  color: #FFC107;
  font-size: 0.85rem;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255, 193, 7, 0.45));
}

.extend-btn--dialog {
  padding: 8px 16px;
}

.extend-confirm-card {
  background: rgba(20, 22, 35, 0.98) !important;
  color: #ffffff;
  border: 1px solid rgba(112, 72, 232, 0.25);
}

.mission-progress.progress-resetting :deep(.v-progress-linear__determinate) {
  transition: width 0.65s ease !important;
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

/* Поверх обложки затемнение слабее: изображение уже приглушено фильтром */
.challenge-card.has-cover .failed-overlay {
  background: rgba(10, 10, 15, 0.2);
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

/* Прозрачность заголовка перемножается с opacity контента, поэтому она
   заметно выше, чем выглядит: иначе название в архиве не прочитать */
.challenge-card.is-failed .mission-title {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: line-through rgba(255, 82, 82, 0.3);
}
.challenge-card.is-finished .card-content,
.challenge-card.is-finished .habit-visual-wrapper {
  filter: grayscale(0.8);
  opacity: 0.85;
}

/* Архивная обложка гаснет через яркость, а не прозрачность: иначе тёмная
   подложка внутри неё ослабевает и текст перестаёт читаться.
   Значение мягкое, потому что фильтр умножается на градиент внутри обложки */
.challenge-card.is-finished .card-background {
  filter: grayscale(0.85) brightness(0.72);
}

/* Тир завершённой миссии подсвечивает рамку карточки в архиве */
.challenge-card.tier-perfect { --tier-rgb: 251, 191, 36; }
.challenge-card.tier-bright { --tier-rgb: 245, 158, 11; }
.challenge-card.tier-sustained { --tier-rgb: 249, 115, 22; }
.challenge-card.tier-extinguished { --tier-rgb: 148, 163, 184; }

.challenge-card.is-finished {
  border-color: rgba(var(--tier-rgb, 148, 163, 184), 0.35) !important;
  box-shadow: 0 6px 24px rgba(var(--tier-rgb, 148, 163, 184), 0.14) !important;
}

.challenge-card.is-finished.tier-perfect {
  border-color: rgba(251, 191, 36, 0.45) !important;
  box-shadow: 0 6px 28px rgba(251, 191, 36, 0.22) !important;
}

.challenge-card.is-finished:hover {
  border-color: rgba(var(--tier-rgb, 148, 163, 184), 0.6) !important;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 26px rgba(var(--tier-rgb, 148, 163, 184), 0.24) !important;
}

@media (max-width: 600px) {
  .challenge-card {
    backdrop-filter: blur(6px);
  }

  .challenge-card:hover {
    transform: none;
    box-shadow: none !important;
  }

  .challenge-card.is-finished:hover {
    transform: none;
    box-shadow: 0 6px 24px rgba(var(--tier-rgb, 148, 163, 184), 0.14) !important;
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
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChallengeType } from '../composables/useChallengeType'
import { useChallengeCardProgress } from '../composables/useChallengeCardProgress'
import { useExtendChallenge, EXTEND_COST } from '../composables/useExtendChallenge'
import { Flame } from 'lucide-vue-next'
import { isChallengeFinished, isChallengeUpcoming } from '../utils/challengeStatus'
import { MISSION_TIERS, calculateCompletionRate, resolveMissionTier } from '../utils/missionParticipation'

const TIER_ICONS = {
  [MISSION_TIERS.PERFECT]: 'mdi-fire',
  [MISSION_TIERS.BRIGHT]: 'mdi-star-four-points',
  [MISSION_TIERS.SUSTAINED]: 'mdi-candle',
  [MISSION_TIERS.EXTINGUISHED]: 'mdi-smoke'
}

const props = defineProps({
  challenge: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    default: null
  },
  // Whose progress the card should display. Defaults to the logged-in user.
  progressUserId: {
    type: String,
    default: null
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  // The seven-day dots and ignite pill are exclusive to My Missions.
  showHabitTracker: {
    type: Boolean,
    default: false
  },
  showExtendButton: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'update', 'extended'])

const { t } = useI18n()
const { getMissionTypeLabel } = useChallengeType()
const {
  extendingId,
  getDurationDays,
  hasEnoughSparks,
  sparksNeeded,
  extendChallenge
} = useExtendChallenge()

const extendConfirmOpen = ref(false)
const progressResetting = ref(false)

const isExtending = computed(() => extendingId.value === props.challenge._id)
const durationDays = computed(() => getDurationDays(props.challenge))
const insufficientSparksTooltip = computed(() =>
  t('missions.extendInsufficientSparks', { count: sparksNeeded.value })
)
const extendConfirmText = computed(() =>
  t('missions.extendConfirm', {
    title: props.challenge.title,
    days: durationDays.value,
    cost: EXTEND_COST
  })
)

const currentUserIdString = computed(() => props.currentUserId?.toString() || '')

const {
  isHabitType,
  isResultType,
  isParticipant,
  targetParticipant,
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

const isUpcoming = computed(() => isChallengeUpcoming(props.challenge))

const isActiveHabit = computed(() => isHabitType.value && !isFinished.value && !isUpcoming.value)

const progressBarColor = computed(() => (isHabitType.value ? '#7048E8' : '#4FD1C5'))

// Rituals and quests alike use their own image as the card backdrop,
// including in the archive where it is dimmed and desaturated.
const hasCoverImage = computed(() => Boolean(props.challenge.imageUrl))

const isHabitParticipantMode = computed(() => {
  return props.showHabitTracker && isParticipant.value && isActiveHabit.value
})

// Habit tiers use the participant's personal completion rate (from their join date),
// matching how rewards are granted on the backend.
const completionRate = computed(() => {
  if (isResultType.value) return efficiencyPercentage.value
  if (targetParticipant.value) {
    return calculateCompletionRate(props.challenge, targetParticipant.value)
  }
  return progressPercentage.value
})

const missionTier = computed(() => resolveMissionTier(completionRate.value))

const isExtinguished = computed(() => isFinished.value && missionTier.value === MISSION_TIERS.EXTINGUISHED)

const tierLabel = computed(() => t(`challenges.missionTiers.${missionTier.value}`))

const tierIcon = computed(() => TIER_ICONS[missionTier.value] || 'mdi-flag-checkered')

const tierAccentClass = computed(() => (isFinished.value ? `tier-${missionTier.value}` : null))

// Floored so the badge never displays a threshold the mission did not clear.
const tierRatePercent = computed(() => Math.floor(completionRate.value))

function handleCardClick() {
  if (props.disabled) return
  emit('click', props.challenge)
}

function openExtendConfirm() {
  if (!hasEnoughSparks.value || isExtending.value) {
    return
  }
  extendConfirmOpen.value = true
}

async function confirmExtend() {
  extendConfirmOpen.value = false
  progressResetting.value = true

  try {
    const updatedChallenge = await extendChallenge(props.challenge)
    if (updatedChallenge) {
      emit('extended', updatedChallenge)
    }
    emit('update')
  } catch {
    // extendError is set in composable
  } finally {
    window.setTimeout(() => {
      progressResetting.value = false
    }, 700)
  }
}
</script>



