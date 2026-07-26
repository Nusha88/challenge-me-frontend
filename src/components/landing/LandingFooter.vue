<template>
  <footer class="landing-footer">
    <div class="lp-shell footer-inner">
      <div class="footer-brand">
        <span class="footer-name">IGNITE-ME.APP</span>
        <span class="footer-tagline">{{ t('home.landing.footer.tagline') }}</span>
      </div>

      <nav class="footer-links" :aria-label="t('home.landing.footer.tagline')">
        <router-link :to="BROWSE_MISSIONS_ROUTE" class="footer-link">
          {{ t('home.landing.footer.missions') }}
        </router-link>
        <router-link :to="BROWSE_HEROES_ROUTE" class="footer-link">
          {{ t('home.landing.footer.heroes') }}
        </router-link>
        <a
          :href="TELEGRAM_FEEDBACK_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          {{ t('home.landing.footer.feedback') }}
        </a>
      </nav>

      <div class="footer-language">
        <v-icon size="16" class="footer-language-icon">mdi-translate</v-icon>
        <label class="footer-language-label" for="landing-language">
          {{ t('home.landing.a11y.language') }}
        </label>
        <select
          id="landing-language"
          class="footer-language-select"
          :value="locale"
          @change="onLocaleChange"
        >
          <option v-for="option in SUPPORTED_LOCALES" :key="option.code" :value="option.code">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <p class="footer-legal">
      © {{ currentYear }} IGNITE-ME.APP · {{ t('home.landing.footer.rights') }}
    </p>
  </footer>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale, SUPPORTED_LOCALES } from '../../i18n'
import {
  BROWSE_HEROES_ROUTE,
  BROWSE_MISSIONS_ROUTE,
  TELEGRAM_FEEDBACK_URL
} from './landingLinks'

const { t, locale } = useI18n()

const currentYear = new Date().getFullYear()

function onLocaleChange(event) {
  setLocale(event.target.value)
}
</script>

<style scoped>
.landing-footer {
  margin-top: clamp(32px, 5vw, 56px);
  border-top: 1px solid var(--lp-border);
  padding-block: clamp(28px, 4vw, 40px) 24px;
}

.footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px 32px;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.footer-name {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--lp-text);
}

.footer-tagline {
  font-size: 0.76rem;
  color: var(--lp-text-faint);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
}

.footer-link {
  font-size: 0.82rem;
  color: var(--lp-text-dim);
  text-decoration: none;
  padding: 2px 0;
  transition: color 0.25s var(--lp-ease);
}

.footer-link:hover,
.footer-link:focus-visible {
  color: var(--lp-teal);
  background: transparent;
}

.footer-language {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.footer-language-icon {
  color: var(--lp-text-faint) !important;
}

/* The label is for screen readers; the select itself is self-explanatory. */
.footer-language-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.footer-language-select {
  appearance: none;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--lp-border);
  border-radius: var(--lp-radius-pill);
  color: var(--lp-text-dim);
  font-family: inherit;
  font-size: 0.8rem;
  padding: 5px 14px;
  cursor: pointer;
  transition: border-color 0.25s var(--lp-ease), color 0.25s var(--lp-ease);
}

.footer-language-select:hover,
.footer-language-select:focus-visible {
  border-color: var(--lp-border-hi);
  color: var(--lp-text);
  outline: none;
}

.footer-language-select option {
  background: #0d1119;
  color: #f1f5f9;
}

.footer-legal {
  margin: clamp(20px, 3vw, 28px) 0 0;
  text-align: center;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  color: var(--lp-text-faint);
}

@media (max-width: 700px) {
  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
}
</style>
