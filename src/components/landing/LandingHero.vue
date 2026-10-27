<template>
  <section class="lp-section lp-section--hero">
    <div class="lp-shell hero-grid">
      <div class="hero-copy">
        <p class="hero-badge">
          <span class="hero-badge-dot" aria-hidden="true"></span>
          {{ t('home.landing.badge') }}
        </p>

        <h1 class="hero-title">
          <span class="lp-gradient-text">{{ t('home.landing.title') }}</span>
        </h1>

        <p class="hero-subtitle">{{ t('home.landing.subtitle') }}</p>

        <div class="hero-actions">
          <LandingPrimaryCta position="hero">
            {{ t('home.landing.primaryCta') }}
          </LandingPrimaryCta>

          <v-btn
            variant="outlined"
            size="x-large"
            class="hero-secondary"
            @click="startDemoFromLanding"
          >
            {{ t('home.landing.secondaryCta') }}
            <v-icon end size="18">mdi-play-outline</v-icon>
          </v-btn>
        </div>

        <router-link
          :to="BROWSE_MISSIONS_ROUTE"
          class="hero-browse"
          @click="trackBrowse"
        >
          {{ t('home.landing.browseCta') }}
          <v-icon size="16">mdi-arrow-right</v-icon>
        </router-link>

        <ul class="hero-trust">
          <li v-for="item in trustItems" :key="item.icon" class="hero-trust-item">
            <v-icon size="16">{{ item.icon }}</v-icon>
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </div>

      <div class="hero-visual">
        <div class="hero-phone">
          <img
            :src="screenshot.src"
            :alt="t('home.landing.heroImageAlt')"
            class="hero-screen"
            :width="screenshot.width"
            :height="screenshot.height"
            decoding="async"
            fetchpriority="high"
          />
        </div>
        <span class="hero-phone-glow" aria-hidden="true"></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LandingPrimaryCta from './LandingPrimaryCta.vue'
import { BROWSE_MISSIONS_ROUTE } from './landingLinks'
import { GOALS, reachGoal } from '../../services/analytics'
import { useDemoMode } from '../../composables/useDemoMode'
import screenRu from '../../assets/landing/screen-today-ru-420.webp'
import screenEn from '../../assets/landing/screen-today-en-420.webp'

const SCREENSHOTS = {
  ru: { src: screenRu, width: 420, height: 799 },
  en: { src: screenEn, width: 420, height: 823 }
}

const { t, locale } = useI18n()
const router = useRouter()
const { startDemo } = useDemoMode()

const screenshot = computed(() => SCREENSHOTS[locale.value] ?? SCREENSHOTS.en)

const trustItems = computed(() => [
  { icon: 'mdi-account-off-outline', label: t('home.landing.trustDemo') },
  { icon: 'mdi-cloud-check-outline', label: t('home.landing.trustNoDownload') },
  { icon: 'mdi-timer-sand', label: t('home.landing.trustFast') }
])

function startDemoFromLanding() {
  reachGoal(GOALS.LANDING_SECONDARY_CLICK, { position: 'hero', action: 'demo' })
  startDemo()
  router.push('/today')
}

function trackBrowse() {
  reachGoal(GOALS.LANDING_SECONDARY_CLICK, { position: 'hero', action: 'browse' })
}
</script>

<style scoped>
.lp-section--hero {
  padding-block: clamp(32px, 6vw, 88px) clamp(40px, 6vw, 72px);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(24px, 5vw, 56px);
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 18px;
  padding: 5px 14px;
  border-radius: var(--lp-radius-pill);
  background: rgba(79, 209, 197, 0.08);
  border: 1px solid rgba(79, 209, 197, 0.28);
  color: var(--lp-teal);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lp-teal);
  box-shadow: 0 0 8px var(--lp-teal);
  animation: hero-pulse 2.4s ease-in-out infinite;
}

@keyframes hero-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
}

.hero-title {
  font-size: clamp(2rem, 5.6vw, 3.7rem);
  font-weight: 900;
  line-height: 1.06;
  letter-spacing: -0.025em;
  margin: 0 0 18px;
  text-wrap: balance;
}

.hero-subtitle {
  font-size: clamp(0.95rem, 1.7vw, 1.14rem);
  line-height: 1.65;
  color: var(--lp-text-dim);
  max-width: 42ch;
  margin: 0 0 30px;
  text-wrap: pretty;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.hero-secondary {
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  color: var(--lp-text) !important;
  background: rgba(255, 255, 255, 0.02);
  text-transform: none;
  letter-spacing: 0.01em;
  font-weight: 600 !important;
  transition: border-color 0.3s var(--lp-ease), background 0.3s var(--lp-ease);
}

.hero-secondary:hover {
  border-color: var(--lp-border-hi) !important;
  background: rgba(79, 209, 197, 0.07);
}

.hero-browse {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 26px;
  color: var(--lp-teal);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.01em;
}

.hero-browse:hover {
  color: #7ee8dd;
}

.hero-browse .v-icon {
  color: inherit !important;
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.hero-trust-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  color: var(--lp-text-faint);
}

.hero-trust-item .v-icon {
  color: var(--lp-teal) !important;
  opacity: 0.85;
}

.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-phone {
  position: relative;
  z-index: 1;
  width: min(280px, 100%);
  padding: 8px;
  border-radius: 34px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.55);
}

.hero-screen {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 26px;
}

.hero-phone-glow {
  position: absolute;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(112, 72, 232, 0.28), transparent 68%);
  filter: blur(46px);
  pointer-events: none;
}

@media (max-width: 960px) {
  .hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-subtitle {
    margin-inline: auto;
  }

  .hero-actions,
  .hero-trust {
    justify-content: center;
  }

  .hero-phone {
    width: min(200px, 58vw);
  }
}

@media (max-width: 600px) {
  /* Copy first so the primary CTA stays above the fold on short phones. */
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .hero-secondary {
    width: 100%;
  }

  .hero-trust {
    gap: 6px 14px;
    justify-content: center;
  }

  .hero-trust-item {
    font-size: 0.75rem;
  }

  .hero-phone {
    width: min(168px, 46vw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-badge-dot {
    animation: none;
  }
}
</style>
