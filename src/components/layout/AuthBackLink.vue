<template>
  <button type="button" class="auth-back-link" @click="goBack">
    <v-icon size="18">mdi-arrow-left</v-icon>
    <span>{{ t('auth.backToHome') }}</span>
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()

function goBack() {
  router.push('/')
}
</script>

<style scoped>
/*
 * The app bar is hidden on the auth pages, so this is the only way out of them.
 * Absolute rather than fixed so it scrolls away with a long form instead of
 * sitting on top of it.
 */
.auth-back-link {
  position: absolute;
  /* Clears the 24px column padding so it never sits on the panel's rounded corner. */
  top: 36px;
  left: 48px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(13, 17, 25, 0.55);
  backdrop-filter: blur(8px);
  color: rgba(241, 245, 249, 0.82);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.auth-back-link:hover {
  color: #ffffff;
  border-color: rgba(79, 209, 197, 0.5);
  background: rgba(13, 17, 25, 0.78);
}

.auth-back-link:hover .v-icon {
  transform: translateX(-2px);
}

.auth-back-link .v-icon {
  transition: transform 0.25s ease;
}

.auth-back-link:focus-visible {
  outline: 2px solid rgba(79, 209, 197, 0.8);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .auth-back-link,
  .auth-back-link .v-icon {
    transition: none;
  }
}

@media (max-width: 600px) {
  .auth-back-link {
    top: 12px;
    left: 12px;
    padding: 6px 14px 6px 10px;
    font-size: 0.8rem;
  }
}
</style>
