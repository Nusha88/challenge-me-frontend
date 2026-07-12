<template>
  <div class="unsubscribe-page">
    <v-card class="unsubscribe-card rounded-xl">
      <v-card-text class="pa-8 text-center">
        <v-progress-circular
          indeterminate
          color="#4FD1C5"
          size="48"
        />
        <p class="text-body-2 text-white opacity-75 mt-4 mb-0">
          {{ t('emailUnsubscribe.processing') }}
        </p>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

function resolveApiBaseUrl() {
  const envBase = import.meta.env.VITE_API_BASE_URL
  if (envBase) {
    return envBase.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const isLocal = ['localhost', '127.0.0.1'].includes(hostname) || hostname.endsWith('.local')
    if (isLocal) {
      return 'http://localhost:3000/api'
    }
  }

  return 'https://challenge-me-backend-frh7.onrender.com/api'
}

onMounted(() => {
  const token = route.query.token
  if (!token || typeof token !== 'string') {
    window.location.replace('/')
    return
  }

  const apiBase = resolveApiBaseUrl()
  const target = `${apiBase}/auth/email/unsubscribe?token=${encodeURIComponent(token)}&format=html`
  window.location.replace(target)
})
</script>

<style scoped>
.unsubscribe-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(160deg, #0f172a 0%, #16213e 56%, #1a1a2e 100%);
}

.unsubscribe-card {
  width: 100%;
  max-width: 480px;
  background: rgba(15, 23, 42, 0.92) !important;
  border: 1px solid rgba(79, 209, 197, 0.18);
  color: #fff;
}
</style>
