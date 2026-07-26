<template>
  <section class="lp-section lp-section--tight">
    <div class="lp-shell">
      <article class="lp-card founder-card reveal">
        <div class="founder-aside">
          <img
            :src="brandMark"
            alt=""
            aria-hidden="true"
            class="founder-avatar"
            width="256"
            height="256"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="founder-body">
          <p class="lp-eyebrow">{{ t('home.landing.founder.eyebrow') }}</p>
          <h2 class="founder-title">{{ t('home.landing.founder.title') }}</h2>

          <p class="founder-text">{{ t('home.landing.founder.paragraph1') }}</p>
          <p class="founder-text">{{ t('home.landing.founder.paragraph2') }}</p>

          <v-btn
            :href="TELEGRAM_FEEDBACK_URL"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            class="founder-cta"
          >
            <v-icon start size="18">mdi-send-outline</v-icon>
            {{ t('home.landing.founder.cta') }}
          </v-btn>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import brandMark from '../../assets/landing/brand-256.webp'
import { TELEGRAM_FEEDBACK_URL } from './landingLinks'

const { t } = useI18n()
</script>

<style scoped>
.founder-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: clamp(18px, 3vw, 32px);
  align-items: start;
  padding: clamp(22px, 3vw, 36px);
  background:
    radial-gradient(90% 120% at 100% 0%, rgba(112, 72, 232, 0.12), transparent 60%),
    var(--lp-surface);
}

.founder-avatar {
  width: clamp(64px, 8vw, 92px);
  height: auto;
  filter: drop-shadow(0 0 18px rgba(112, 72, 232, 0.45));
}

.founder-title {
  font-size: clamp(1.25rem, 2.4vw, 1.65rem);
  font-weight: 800;
  color: #fff;
  margin: 0 0 14px;
  line-height: 1.25;
}

.founder-text {
  font-size: 0.92rem;
  line-height: 1.7;
  color: var(--lp-text-dim);
  margin: 0 0 12px;
  max-width: 66ch;
  text-wrap: pretty;
}

.founder-cta {
  margin-top: 8px;
  border-radius: var(--lp-radius-sm) !important;
  border: 1px solid rgba(79, 209, 197, 0.35) !important;
  color: var(--lp-teal) !important;
  text-transform: none;
  font-weight: 700 !important;
  letter-spacing: 0.01em;
}

.founder-cta:hover {
  background: rgba(79, 209, 197, 0.08);
}

@media (max-width: 640px) {
  .founder-card {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }

  .founder-text {
    text-align: left;
  }

  .founder-cta {
    width: 100%;
  }
}
</style>
