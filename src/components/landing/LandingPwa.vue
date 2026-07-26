<template>
  <section class="lp-section">
    <div class="lp-shell pwa-grid">
      <div class="pwa-copy reveal">
        <p class="lp-eyebrow">{{ t('home.landing.pwa.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('home.landing.pwa.title') }}</h2>
        <p class="lp-lead">{{ t('home.landing.pwa.text') }}</p>

        <ul class="pwa-points">
          <li v-for="point in points" :key="point.icon" class="pwa-point">
            <v-icon size="17">{{ point.icon }}</v-icon>
            <span>{{ point.label }}</span>
          </li>
        </ul>
      </div>

      <div class="pwa-visual reveal reveal-2">
        <div class="pwa-phone">
          <img
            :src="screenshot.src"
            :alt="t('home.landing.pwa.alt')"
            class="pwa-screen"
            :width="screenshot.width"
            :height="screenshot.height"
            loading="lazy"
            decoding="async"
          />
        </div>
        <span class="pwa-glow" aria-hidden="true"></span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import screenRu from '../../assets/landing/screen-today-ru-420.webp'
import screenEn from '../../assets/landing/screen-today-en-420.webp'

const { t, locale } = useI18n()

const SCREENSHOTS = {
  ru: { src: screenRu, width: 420, height: 799 },
  en: { src: screenEn, width: 420, height: 823 }
}

const screenshot = computed(() => SCREENSHOTS[locale.value] ?? SCREENSHOTS.en)

const points = computed(() => [
  { icon: 'mdi-download-off-outline', label: t('home.landing.trustNoDownload') },
  { icon: 'mdi-cellphone-check', label: t('home.landing.pwa.pointPlatforms') },
  { icon: 'mdi-bell-off-outline', label: t('home.landing.pwa.pointNotifications') }
])
</script>

<style scoped>
.pwa-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.7fr);
  gap: clamp(28px, 5vw, 60px);
  align-items: center;
}

.pwa-points {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  list-style: none;
  margin: 22px 0 0;
  padding: 0;
}

.pwa-point {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
  color: var(--lp-text-dim);
}

.pwa-point .v-icon {
  color: var(--lp-teal) !important;
  opacity: 0.8;
}

.pwa-visual {
  position: relative;
  display: flex;
  justify-content: center;
}

.pwa-phone {
  position: relative;
  z-index: 1;
  width: min(240px, 70vw);
  padding: 8px;
  border-radius: 30px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.55);
}

.pwa-screen {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 23px;
}

.pwa-glow {
  position: absolute;
  top: 12%;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 209, 197, 0.22), transparent 68%);
  filter: blur(52px);
  pointer-events: none;
}

@media (max-width: 860px) {
  .pwa-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .pwa-copy .lp-lead {
    margin-inline: auto;
  }

  .pwa-points {
    justify-content: center;
  }

  .pwa-visual {
    order: -1;
  }
}
</style>
