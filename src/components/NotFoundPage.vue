<template>
  <div class="not-found-container">
    <div class="content-layer">
      <div class="glitch-wrapper">
        <h1 class="error-code">404</h1>
        <div class="error-signal">{{ t('notFound.signalLost') }}</div>
      </div>

      <p class="error-message">
        {{ t('notFound.message') }}
      </p>

      <v-btn
        color="teal-accent-4"
        variant="outlined"
        rounded="pill"
        size="large"
        class="mt-6 home-btn"
        to="/"
      >
        {{ t('notFound.backToMissionsCenter') }}
      </v-btn>
    </div>

    <div class="bg-glow"></div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.not-found-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0d111c;
  color: #ffffff;
  text-align: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.content-layer {
  position: relative;
  z-index: 1;
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(to bottom, #a78bfa, #2dd4bf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0;
  letter-spacing: -5px;
}

.error-signal {
  font-family: monospace;
  letter-spacing: 4px;
  color: #2dd4bf;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  text-transform: uppercase;
}

.error-message {
  max-width: 500px;
  font-size: 1.1rem;
  color: #94a3b8;
  line-height: 1.6;
}

.home-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

.home-btn:hover {
  box-shadow: 0 0 20px rgba(45, 212, 191, 0.4);
  background: rgba(45, 212, 191, 0.1) !important;
}

.bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}
</style>
