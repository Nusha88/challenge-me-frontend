<template>
  <section class="lp-section rewards-section">
    <div class="lp-shell">
      <header class="lp-section-head lp-section-head--center reveal">
        <p class="lp-eyebrow">{{ t('home.landing.rewards.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('home.landing.rewards.title') }}</h2>
        <p class="lp-lead">{{ t('home.landing.rewards.lead') }}</p>
      </header>

      <ul class="lp-grid rewards-grid">
        <li
          v-for="(reward, index) in rewards"
          :key="reward.id"
          v-spotlight
          class="lp-card lp-card--spotlight lp-card--interactive reward-card reveal"
          :class="`reveal-${index + 1}`"
        >
          <span class="lp-icon-tile" :class="reward.tone">
            <v-icon>{{ reward.icon }}</v-icon>
          </span>
          <h3 class="lp-card-title">{{ t(`home.landing.rewards.${reward.id}.title`) }}</h3>
          <p class="lp-card-text">{{ t(`home.landing.rewards.${reward.id}.text`) }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { vSpotlight } from '../../composables/useSpotlight'

const { t } = useI18n()

const rewards = [
  { id: 'xp', icon: 'mdi-chart-line-variant', tone: '' },
  { id: 'ranks', icon: 'mdi-shield-star-outline', tone: 'lp-icon-tile--purple' },
  { id: 'sparks', icon: 'mdi-star-four-points', tone: 'lp-icon-tile--gold' },
  { id: 'freeze', icon: 'mdi-snowflake', tone: '' }
]
</script>

<style scoped>
/*
 * Fixed column counts rather than auto-fit: with exactly four cards, auto-fit
 * drops to three per row on mid-size screens and strands the fourth on its own.
 */
.rewards-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 900px) {
  .rewards-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.reward-card {
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  .reward-card .lp-card-title {
    font-size: 0.92rem;
  }

  .reward-card .lp-card-text {
    font-size: 0.78rem;
  }
}
</style>
