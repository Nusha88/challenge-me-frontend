<template>
  <v-card class="todays-card todays-challenges-card home-glass-card">
    <v-card-text>
      <div class="todays-challenges-section">
        <h3 class="home-section-title">{{ sectionTitle }}</h3>

        <div v-if="challenges.length > 0" class="todays-challenges-list">
          <div
            v-for="challenge in challenges"
            :key="challenge._id"
            class="home-quest-row challenge-card"
            :class="{
              'is-completed': variant === 'today' && isRowCompleted(challenge),
              'challenge-card-disabled': variant === 'tomorrow'
            }"
            role="button"
            :tabindex="variant === 'today' ? 0 : -1"
            @click="variant === 'today' && $emit('navigate', challenge)"
            @keydown.enter.prevent="variant === 'today' && $emit('navigate', challenge)"
            @keydown.space.prevent="variant === 'today' && $emit('navigate', challenge)"
          >
            <button
              v-if="variant === 'today'"
              type="button"
              class="challenge-complete-btn"
              :class="{ 'is-done': isRowCompleted(challenge) }"
              :aria-label="
                isRowCompleted(challenge)
                  ? t('home.loggedIn.dailyChecklist.stepCompleted')
                  : t('home.loggedIn.dailyChecklist.markComplete')
              "
              :disabled="getDayStatus(challenge) !== 'incomplete'"
              @click.stop="$emit('toggle-completion', challenge, true)"
            >
              <v-icon size="small" color="#7048e8">
                {{ isRowCompleted(challenge) ? 'mdi-check-circle' : 'mdi-flag' }}
              </v-icon>
            </button>
            <span v-else class="challenge-complete-btn is-disabled" aria-hidden="true">
              <v-icon size="small" color="#94A3B8">mdi-flag</v-icon>
            </span>

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
                <span class="home-cost-badge">
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

        <HomeEmptyState
          v-else-if="variant === 'today'"
          :image-src="treasureImage"
          :image-alt="t('home.loggedIn.treasureAlt')"
          :text="t('home.loggedIn.emptyMissions.text')"
          :primary-label="t('home.loggedIn.emptyMissions.launchFirstMission')"
          primary-to="/missions/add"
          :secondary-label="t('home.loggedIn.emptyMissions.explore')"
          secondary-to="/missions"
        />

        <HomeEmptyState
          v-else
          :text="t('home.loggedIn.loadout.empty')"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HomeEmptyState from './HomeEmptyState.vue'
import treasureImage from '../../assets/home/treasure-280.webp'

const props = defineProps({
  challenges: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'today',
    validator: (value) => ['today', 'tomorrow'].includes(value)
  },
  getDayStatus: { type: Function, default: () => 'incomplete' },
  showSecondChance: {
    type: Function,
    default: () => false
  },
  getCompletedDays: { type: Function, default: () => 0 },
  getTotalDays: { type: Function, default: () => 0 },
  canUseSecondChance: { type: Boolean, default: false },
  secondChanceLoadingId: { type: String, default: null },
  secondChanceCost: { type: Number, default: 30 }
})

defineEmits(['navigate', 'toggle-completion', 'second-chance'])

const { t } = useI18n()

const sectionTitle = computed(() => {
  return props.variant === 'tomorrow'
    ? t('home.loggedIn.tomorrowsChallenges')
    : t('home.loggedIn.todaysChallenges')
})

function isRowCompleted(challenge) {
  const status = props.getDayStatus(challenge)
  return status === 'completed' || status === 'protected'
}
</script>

<style scoped>
.todays-challenges-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 959px) {
  .challenge-card:has(.second-chance-btn) {
    position: relative;
    padding-top: 40px !important;
  }

  .second-chance-btn {
    position: absolute;
    top: 8px;
    right: 10px;
    margin-left: 0;
  }
}

.todays-challenges-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.challenge-card {
  cursor: pointer;
}

.challenge-complete-btn {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: rgba(112, 72, 232, 0.14);
  cursor: pointer;
  transition:
    background 0.25s var(--home-ease, ease),
    transform 0.25s var(--home-ease, ease);
}

.challenge-complete-btn:hover:not(:disabled) {
  background: rgba(112, 72, 232, 0.28);
  transform: scale(1.06);
}

.challenge-complete-btn:disabled,
.challenge-complete-btn.is-done {
  cursor: default;
}

.challenge-complete-btn.is-disabled {
  background: rgba(148, 163, 184, 0.12);
  cursor: default;
}

.challenge-text {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--home-text, #fff);
}

.challenge-text.completed {
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.45);
}

.challenge-text-disabled {
  color: rgba(255, 255, 255, 0.35) !important;
}

.challenge-progress {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--home-teal, #4fd1c5);
  opacity: 0.85;
  white-space: nowrap;
}

.challenge-progress.completed {
  color: #94a3b8;
  opacity: 0.65;
}

.second-chance-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 82, 82, 0.75);
  background: rgba(255, 82, 82, 0.1);
  color: #fff;
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.3);
  flex-shrink: 0;
}

.second-chance-btn:hover:not(:disabled) {
  background: rgba(255, 82, 82, 0.18);
}

.second-chance-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.protected-badge {
  display: inline-flex;
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 10px;
  border: 1px solid rgba(79, 209, 197, 0.65);
  background: rgba(60, 96, 232, 0.12);
  color: var(--home-teal, #4fd1c5);
  font-size: 0.68rem;
  font-weight: 800;
  flex-shrink: 0;
}

.challenge-card-disabled {
  opacity: 0.65;
  cursor: default;
  pointer-events: none;
}
</style>
