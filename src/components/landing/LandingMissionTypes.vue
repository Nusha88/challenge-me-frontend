<template>
  <section class="lp-section">
    <div class="lp-shell">
      <header class="lp-section-head lp-section-head--center reveal">
        <p class="lp-eyebrow">{{ t('home.landing.missions.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('home.landing.missions.title') }}</h2>
        <p class="lp-lead">{{ t('home.landing.missions.lead') }}</p>
      </header>

      <div class="mission-grid">
        <article
          v-for="(mission, index) in missions"
          :key="mission.id"
          v-spotlight
          class="lp-card lp-card--spotlight mission-card reveal"
          :class="`reveal-${index + 1}`"
        >
          <span class="lp-icon-tile" :class="mission.tone">
            <v-icon>{{ mission.icon }}</v-icon>
          </span>

          <h3 class="mission-title">{{ t(`home.landing.missions.${mission.id}.title`) }}</h3>
          <p class="mission-tagline">{{ t(`home.landing.missions.${mission.id}.tagline`) }}</p>
          <p class="lp-card-text mission-description">
            {{ t(`home.landing.missions.${mission.id}.description`) }}
          </p>

          <p class="mission-examples-label">{{ t('home.landing.missions.examplesLabel') }}</p>
          <ul class="mission-examples">
            <li v-for="key in mission.examples" :key="key" class="lp-chip">
              <v-icon size="14">{{ mission.exampleIcon }}</v-icon>
              {{ t(`home.landing.missions.${mission.id}.${key}`) }}
            </li>
          </ul>

          <div class="mission-notes">
            <p v-for="key in mission.notes" :key="key" class="mission-note">
              <v-icon size="15">{{ key === 'reward' ? 'mdi-trophy-outline' : 'mdi-account-multiple-outline' }}</v-icon>
              <span>{{ t(`home.landing.missions.${mission.id}.${key}`) }}</span>
            </p>
          </div>

          <button type="button" class="mission-demo" @click="openGuide(mission.id)">
            <v-icon size="19">mdi-play-circle-outline</v-icon>
            {{ t(`home.landing.missions.${mission.id}.cta`) }}
          </button>
        </article>
      </div>

      <aside class="lp-card steps-card reveal reveal-3">
        <span class="lp-icon-tile lp-icon-tile--gold">
          <v-icon>mdi-checkbox-marked-circle-outline</v-icon>
        </span>
        <div>
          <h3 class="lp-card-title">{{ t('home.landing.missions.steps.title') }}</h3>
          <p class="lp-card-text">{{ t('home.landing.missions.steps.description') }}</p>
        </div>
      </aside>
    </div>

    <MissionGuideDialog v-model="guideOpen" :type="activeMission" />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MissionGuideDialog from './MissionGuideDialog.vue'
import { vSpotlight } from '../../composables/useSpotlight'
import { GOALS, reachGoal } from '../../services/analytics'

const { t } = useI18n()

const missions = [
  {
    id: 'ritual',
    icon: 'mdi-star-four-points-outline',
    tone: '',
    exampleIcon: 'mdi-repeat',
    examples: ['example1', 'example2', 'example3', 'example4'],
    notes: ['social']
  },
  {
    id: 'quest',
    icon: 'mdi-sword',
    tone: 'lp-icon-tile--purple',
    exampleIcon: 'mdi-flag-checkered',
    examples: ['example1', 'example2', 'example3'],
    notes: ['reward', 'social']
  }
]

const guideOpen = ref(false)
const activeMission = ref('ritual')

function openGuide(id) {
  activeMission.value = id
  guideOpen.value = true
  reachGoal(GOALS.MISSION_CARD_OPEN, { type: id })
}
</script>

<style scoped>
.mission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 1.8vw, 20px);
}

.mission-card {
  display: flex;
  flex-direction: column;
}

.mission-title {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 800;
  color: #fff;
  margin: 0 0 4px;
  line-height: 1.25;
}

.mission-tagline {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--lp-teal);
  margin: 0 0 12px;
  line-height: 1.4;
}

.mission-description {
  margin-bottom: 18px;
}

.mission-examples-label {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lp-text-faint);
  margin: 0 0 8px;
}

.mission-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  list-style: none;
  margin: 0 0 18px;
  padding: 0;
}

.mission-examples .v-icon {
  color: var(--lp-teal) !important;
  opacity: 0.7;
}

.mission-notes {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
}

.mission-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.55;
  color: var(--lp-text-dim);
}

.mission-note .v-icon {
  color: var(--lp-teal) !important;
  opacity: 0.75;
  margin-top: 2px;
  flex-shrink: 0;
}

.mission-demo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
  padding: 11px 16px;
  width: 100%;
  border-radius: var(--lp-radius-sm);
  border: 1px solid rgba(79, 209, 197, 0.28);
  background: rgba(79, 209, 197, 0.07);
  color: var(--lp-teal);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.3s var(--lp-ease), border-color 0.3s var(--lp-ease);
}

.mission-demo:hover {
  background: rgba(79, 209, 197, 0.14);
  border-color: rgba(79, 209, 197, 0.5);
}

.mission-demo:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 209, 197, 0.3);
}

.mission-demo .v-icon {
  color: var(--lp-teal) !important;
}

.steps-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: clamp(12px, 1.8vw, 20px);
}

.steps-card .lp-icon-tile {
  margin-bottom: 0;
}

@media (max-width: 760px) {
  .mission-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .mission-examples {
    gap: 6px;
  }

  .mission-examples .lp-chip {
    font-size: 0.72rem;
    padding: 4px 10px;
  }

  .steps-card {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
