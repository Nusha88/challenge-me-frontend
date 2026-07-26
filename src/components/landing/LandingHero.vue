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
          <!-- No note here: the trust row below already carries the same reassurance. -->
          <LandingPrimaryCta position="hero">
            {{ t('home.landing.primaryCta') }}
          </LandingPrimaryCta>

          <v-btn
            :to="BROWSE_MISSIONS_ROUTE"
            variant="outlined"
            size="x-large"
            class="hero-secondary"
            @click="trackSecondary"
          >
            {{ t('home.landing.secondaryCta') }}
            <v-icon end size="18">mdi-arrow-right</v-icon>
          </v-btn>
        </div>

        <ul class="hero-trust">
          <li v-for="item in trustItems" :key="item.icon" class="hero-trust-item">
            <v-icon size="16">{{ item.icon }}</v-icon>
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </div>

      <div class="hero-visual">
        <picture>
          <source
            type="image/webp"
            :srcset="`${heroWebp460} 460w, ${heroWebp900} 900w`"
            sizes="(max-width: 960px) 240px, 420px"
          />
          <img
            :src="heroJpg900"
            :alt="t('home.landing.heroImageAlt')"
            class="hero-artifact"
            width="900"
            height="900"
            decoding="async"
            fetchpriority="high"
          />
        </picture>
        <span class="hero-artifact-glow" aria-hidden="true"></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LandingPrimaryCta from './LandingPrimaryCta.vue'
import { BROWSE_MISSIONS_ROUTE } from './landingLinks'
import { GOALS, reachGoal } from '../../services/analytics'

/*
 * Served from public/ rather than imported, so index.html can preload the hero
 * during HTML parsing instead of waiting for the JS bundle to render this
 * component. Kept in sync by scripts/optimize-landing-assets.sh.
 */
const heroWebp460 = '/landing/hero-460.webp'
const heroWebp900 = '/landing/hero-900.webp'
const heroJpg900 = '/landing/hero-900.jpg'

const { t } = useI18n()

const trustItems = computed(() => [
  { icon: 'mdi-gift-outline', label: t('home.landing.trustFree') },
  { icon: 'mdi-cloud-check-outline', label: t('home.landing.trustNoDownload') },
  { icon: 'mdi-timer-sand', label: t('home.landing.trustFast') }
])

function trackSecondary() {
  reachGoal(GOALS.LANDING_SECONDARY_CLICK, { position: 'hero' })
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
  max-width: 58ch;
  margin: 0 0 30px;
  text-wrap: pretty;
}

.hero-actions {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 26px;
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

.hero-artifact {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  max-width: 420px;
  height: auto;
  filter: drop-shadow(0 0 34px rgba(79, 209, 197, 0.28)) contrast(1.08);
  -webkit-mask-image: radial-gradient(circle, #000 42%, transparent 78%);
  mask-image: radial-gradient(circle, #000 42%, transparent 78%);
  animation: hero-float 7s ease-in-out infinite;
}

@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-18px); }
}

.hero-artifact-glow {
  position: absolute;
  width: 62%;
  aspect-ratio: 1;
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

  .hero-copy {
    order: 2;
  }

  .hero-visual {
    order: 1;
  }

  .hero-subtitle {
    margin-inline: auto;
  }

  .hero-actions,
  .hero-trust {
    justify-content: center;
  }

  .hero-artifact {
    max-width: 240px;
  }
}

@media (max-width: 600px) {
  /* Keeps the primary CTA above the fold on short phones. */
  .hero-artifact {
    max-width: 176px;
  }

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
  }

  .hero-trust-item {
    font-size: 0.75rem;
  }
}
</style>
