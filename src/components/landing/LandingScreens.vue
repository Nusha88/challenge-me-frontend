<template>
  <!--
    Desktop dashboard preview only. Mobile visitors already see a phone UI in the
    PWA section, and this wide screenshot is an awkward crop on a small screen.
  -->
  <section class="lp-section screens-section">
    <div class="lp-shell">
      <header class="lp-section-head lp-section-head--center reveal">
        <p class="lp-eyebrow">{{ t('home.landing.screens.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('home.landing.screens.title') }}</h2>
        <p class="lp-lead">{{ t('home.landing.screens.lead') }}</p>
      </header>

      <figure class="screens-figure reveal reveal-1">
        <picture>
          <source
            media="(min-width: 640px)"
            type="image/webp"
            :srcset="`${demoWebp800} 800w, ${demoWebp1600} 1600w`"
            sizes="(max-width: 900px) 92vw, 1100px"
          />
          <source
            media="(min-width: 640px)"
            type="image/jpeg"
            :srcset="`${demoJpg1600} 1600w`"
            sizes="(max-width: 900px) 92vw, 1100px"
          />
          <!--
            Tiny placeholder so phones do not download the desktop screenshot when
            neither <source> matches. The section is also hidden below 640px.
          -->
          <img
            src="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="
            :alt="t('home.landing.screens.alt')"
            class="screens-image"
            width="1600"
            height="915"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </figure>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import demoWebp800 from '../../assets/landing/demo-800.webp'
import demoWebp1600 from '../../assets/landing/demo-1600.webp'
import demoJpg1600 from '../../assets/landing/demo-1600.jpg'

const { t } = useI18n()
</script>

<style scoped>
@media (max-width: 639px) {
  .screens-section {
    display: none;
  }
}

.screens-figure {
  margin: 0;
  position: relative;
}

.screens-figure::after {
  content: '';
  position: absolute;
  inset: 12% 8% -6%;
  background: radial-gradient(ellipse at center, rgba(112, 72, 232, 0.22), transparent 70%);
  filter: blur(52px);
  z-index: -1;
  pointer-events: none;
}

.screens-image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: clamp(12px, 1.6vw, 18px);
  border: 1px solid rgba(79, 209, 197, 0.32);
  box-shadow:
    0 0 24px rgba(79, 209, 197, 0.16),
    0 24px 60px rgba(0, 0, 0, 0.5);
}
</style>
