<template>
  <section class="lp-section">
    <div class="lp-shell">
      <header class="lp-section-head lp-section-head--center reveal">
        <p class="lp-eyebrow">{{ t('home.landing.privacy.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('home.landing.privacy.title') }}</h2>
      </header>

      <div class="lp-grid lp-grid--2 privacy-grid">
        <article v-spotlight class="lp-card lp-card--spotlight privacy-card privacy-card--public reveal reveal-1">
          <div class="privacy-head">
            <span class="lp-icon-tile">
              <v-icon>mdi-earth</v-icon>
            </span>
            <span class="lp-chip lp-chip--teal">{{ t('home.landing.privacy.publicChip') }}</span>
          </div>
          <h3 class="privacy-title">{{ t('home.landing.privacy.publicTitle') }}</h3>
          <p class="lp-card-text">{{ t('home.landing.privacy.publicText') }}</p>
        </article>

        <article v-spotlight class="lp-card lp-card--spotlight privacy-card privacy-card--private reveal reveal-2">
          <div class="privacy-head">
            <span class="lp-icon-tile lp-icon-tile--purple">
              <v-icon>mdi-lock-outline</v-icon>
            </span>
            <span class="lp-chip privacy-chip-private">{{ t('home.landing.privacy.privateChip') }}</span>
          </div>
          <h3 class="privacy-title">{{ t('home.landing.privacy.privateTitle') }}</h3>
          <p class="lp-card-text">{{ t('home.landing.privacy.privateText') }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { vSpotlight } from '../../composables/useSpotlight'

const { t } = useI18n()
</script>

<style scoped>
.privacy-card {
  display: flex;
  flex-direction: column;
  padding: clamp(20px, 2.6vw, 30px);
}

.privacy-card--public {
  background:
    radial-gradient(120% 100% at 0% 0%, rgba(79, 209, 197, 0.08), transparent 60%),
    var(--lp-surface);
}

.privacy-card--private {
  background:
    radial-gradient(120% 100% at 0% 0%, rgba(112, 72, 232, 0.1), transparent 60%),
    var(--lp-surface);
}

.privacy-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.privacy-head .lp-icon-tile {
  margin-bottom: 0;
}

.privacy-chip-private {
  background: rgba(112, 72, 232, 0.12);
  border-color: rgba(112, 72, 232, 0.3);
  color: #b79bff;
}

.privacy-title {
  font-size: clamp(1.05rem, 1.9vw, 1.25rem);
  font-weight: 800;
  color: #fff;
  margin: 8px 0 10px;
  line-height: 1.3;
}
</style>
