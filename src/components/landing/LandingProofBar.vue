<template>
  <section class="lp-section lp-section--tight proof-section">
    <div class="lp-shell">
      <div class="proof-bar reveal">
        <div v-if="showHeroCount" class="proof-item">
          <span class="proof-value">{{ formattedHeroes }}</span>
          <span class="proof-label">{{ t('home.landing.proof.heroesLabel') }}</span>
        </div>
        <div v-else class="proof-item proof-item--qualitative">
          <v-icon size="20" class="proof-icon">mdi-flag-outline</v-icon>
          <span class="proof-label">{{ t('home.landing.proof.pioneers') }}</span>
        </div>

        <span class="proof-divider" aria-hidden="true"></span>

        <div v-if="showMissionCount" class="proof-item">
          <span class="proof-value">{{ formattedMissions }}</span>
          <span class="proof-label">{{ t('home.landing.proof.missionsLabel') }}</span>
        </div>
        <div v-else class="proof-item proof-item--qualitative">
          <v-icon size="20" class="proof-icon">mdi-rocket-launch-outline</v-icon>
          <span class="proof-label">{{ t('home.landing.trustFast') }}</span>
        </div>

        <span class="proof-divider" aria-hidden="true"></span>

        <div class="proof-item proof-item--qualitative">
          <v-icon size="20" class="proof-icon">mdi-flask-outline</v-icon>
          <span class="proof-label">{{ t('home.landing.proof.betaLabel') }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLandingStats } from '../../composables/useLandingStats'
import { useCountUp } from '../../composables/useCountUp'

const { t, locale } = useI18n()
const { heroes, missions, showHeroCount, showMissionCount } = useLandingStats()

const animatedHeroes = useCountUp(heroes)
const animatedMissions = useCountUp(missions)

const numberFormat = computed(() => new Intl.NumberFormat(locale.value))
const formattedHeroes = computed(() => numberFormat.value.format(animatedHeroes.value))
const formattedMissions = computed(() => numberFormat.value.format(animatedMissions.value))
</script>

<style scoped>
.proof-section {
  padding-block: 0 clamp(24px, 4vw, 44px);
}

.proof-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px clamp(18px, 4vw, 44px);
  padding: 18px clamp(18px, 3vw, 32px);
  border-radius: var(--lp-radius);
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--lp-border);
}

.proof-item {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.proof-item--qualitative {
  align-items: center;
}

.proof-value {
  font-size: clamp(1.25rem, 2.4vw, 1.6rem);
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(120deg, #ffffff, var(--lp-teal));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-variant-numeric: tabular-nums;
}

.proof-label {
  font-size: 0.8rem;
  color: var(--lp-text-dim);
  letter-spacing: 0.01em;
}

.proof-icon {
  color: var(--lp-teal) !important;
  opacity: 0.8;
}

.proof-divider {
  width: 1px;
  height: 22px;
  background: var(--lp-border);
}

@media (max-width: 600px) {
  .proof-bar {
    gap: 10px 16px;
    padding: 14px 16px;
  }

  .proof-label {
    font-size: 0.72rem;
  }

  .proof-divider {
    display: none;
  }
}
</style>
