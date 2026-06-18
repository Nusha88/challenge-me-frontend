<template>
  <v-card v-if="challenges.length > 0" class="todays-card todays-challenges-card">
    <v-card-text>
      <div class="todays-challenges-section">
        <h3 class="section-subtitle">{{ t('home.loggedIn.todaysChallenges') }}</h3>
        <div class="todays-challenges-list">
          <div
            v-for="challenge in challenges"
            :key="challenge._id"
            class="challenge-card"
            :class="{
              completed: variant === 'today' && isRowCompleted(challenge),
              'challenge-card-disabled': variant === 'tomorrow'
            }"
            @click="variant === 'today' && $emit('navigate', challenge)"
          >
            <div
              class="challenge-icon"
              :class="{ 'has-hover': variant === 'today' && getDayStatus(challenge) === 'incomplete' }"
              @click.stop="variant === 'today' && getDayStatus(challenge) === 'incomplete' && $emit('toggle-completion', challenge, true)"
            >
              <template v-if="variant === 'today'">
                <v-icon
                  v-if="isRowCompleted(challenge)"
                  size="small"
                  color="#7048e8"
                >mdi-check-circle</v-icon>
                <template v-else>
                  <v-icon size="small" color="#7048e8" class="flag-icon">mdi-flag</v-icon>
                  <v-icon size="small" color="#7048e8" class="check-icon-hover">mdi-check-circle</v-icon>
                </template>
              </template>
              <v-icon v-else size="small" color="#94A3B8">mdi-flag</v-icon>
            </div>
            <span
              class="challenge-text"
              :class="{
                completed: variant === 'today' && isRowCompleted(challenge),
                'challenge-text-disabled': variant === 'tomorrow'
              }"
            >
              {{ challenge.title }}
            </span>
            <template v-if="variant === 'today'">
              <span
                v-if="getDayStatus(challenge) === 'protected'"
                class="protected-badge"
              >
                {{ t('sparks.rituals.protectedBadge') }}
              </span>
              <button
                v-else-if="showSecondChance(challenge)"
                type="button"
                class="second-chance-btn"
                :disabled="!canUseSecondChance || secondChanceLoadingId === challenge._id"
                :title="!canUseSecondChance ? t('sparks.rituals.insufficientSparks') : ''"
                @click.stop="$emit('second-chance', challenge)"
              >
                <span>{{ t('sparks.rituals.secondChanceButton') }}</span>
                <span class="second-chance-cost">
                  <span>|</span>
                  <span>{{ secondChanceCost }}</span>
                  <span class="sparks-icon">✦</span>
                </span>
              </button>
            </template>
            <span
              v-if="variant === 'today'"
              class="challenge-progress"
              :class="{ completed: isRowCompleted(challenge) }"
            >
              {{ getCompletedDays(challenge) }} / {{ getTotalDays(challenge) }}
            </span>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>

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
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  challenges: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'today',
    validator: (value) => ['today', 'tomorrow'].includes(value)
  },
  isCompleted: { type: Function, default: () => false },
  getDayStatus: { type: Function, default: () => 'incomplete' },
  showSecondChance: {
    type: Function,
    default: (challenge) => {
      void challenge
      return false
    }
  },
  getCompletedDays: { type: Function, default: () => 0 },
  getTotalDays: { type: Function, default: () => 0 },
  canUseSecondChance: { type: Boolean, default: false },
  secondChanceLoadingId: { type: String, default: null },
  secondChanceCost: { type: Number, default: 30 }
})

defineEmits(['navigate', 'toggle-completion', 'second-chance'])

const { t } = useI18n()

function isRowCompleted(challenge) {
  const status = props.getDayStatus(challenge)
  return status === 'completed' || status === 'protected'
}
</script>

<style scoped>
.todays-card {
  width: 100%;
  margin: 0;
}

.todays-challenges-card {
  width: 65%;
  flex: 0 0 65%;
  max-width: 65%;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

@media (max-width: 959px) {
  .todays-challenges-card {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
  }

  .challenge-card {
    padding: 10px 14px !important;
  }

  .challenge-card:has(.second-chance-btn) {
    position: relative;
    padding-top: 38px !important;
  }

  .second-chance-btn {
    position: absolute;
    top: 8px;
    right: 10px;
    margin-left: 0;
    z-index: 1;
  }
}

.section-subtitle {
  color: #4FD1C5 !important;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(79, 209, 197, 0.4);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  margin-bottom: 16px;
  padding-left: 4px;
}

.todays-challenges-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.challenge-card {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: white !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.challenge-card:hover:not(.challenge-card-disabled) {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(112, 72, 232, 0.3) !important;
  transform: translateY(-2px);
}

.challenge-icon {
  width: 36px;
  height: 36px;
  background: rgba(112, 72, 232, 0.1);
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
  background: #E8E0FF;
  transform: scale(1.1);
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

.challenge-text {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: #FFFFFF;
  transition: color 0.3s ease;
  flex: 1;
}

.challenge-progress {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: #4FD1C5;
  opacity: 0.8;
  margin-left: 8px;
  white-space: nowrap;
}

.second-chance-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 82, 82, 0.75);
  background: rgba(255, 82, 82, 0.08);
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.35);
  transition: background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  flex-shrink: 0;
}

.second-chance-btn:hover:not(:disabled) {
  background: rgba(255, 82, 82, 0.16);
  box-shadow: 0 0 14px rgba(255, 82, 82, 0.55);
}

.second-chance-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.second-chance-cost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ffc107;
  font-weight: 800;
}

.second-chance-cost .sparks-icon {
  color: #ffc107;
  font-size: 0.7rem;
  filter: drop-shadow(0 0 4px rgba(255, 193, 7, 0.45));
}

.protected-badge {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 10px;
  border: 1px solid rgba(79, 209, 197, 0.65);
  background: rgba(60, 96, 232, 0.12);
  color: #4fd1c5;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: 0 0 12px rgba(60, 96, 232, 0.45);
  flex-shrink: 0;
}

.challenge-card.completed {
  background: rgba(255, 255, 255, 0.01);
  border-color: transparent;
  box-shadow: none;
  opacity: 0.5;
}

.challenge-card.completed .challenge-icon {
  background: rgba(148, 163, 184, 0.1) !important;
}

.challenge-card.completed :deep(.v-icon) {
  color: #94A3B8 !important;
  opacity: 0.8;
}

.challenge-text.completed {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.4);
}

.challenge-progress.completed {
  color: #94A3B8;
  opacity: 0.6;
}

.challenge-card-disabled {
  opacity: 0.6;
  cursor: not-allowed !important;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.03) !important;
}

.challenge-card-disabled .challenge-icon {
  background: rgba(148, 163, 184, 0.1) !important;
}

.challenge-text-disabled {
  color: rgba(255, 255, 255, 0.3) !important;
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
  width: 140px;
  margin-bottom: 20px;
  filter: drop-shadow(0 10px 15px rgba(112, 72, 232, 0.1));
}

.empty-text-sub {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  max-width: 250px;
  line-height: 1.5;
}

.empty-text-sub :deep(strong) {
  color: #7048E8;
}

:deep(.v-card-text) {
  color: white !important;
}
</style>
