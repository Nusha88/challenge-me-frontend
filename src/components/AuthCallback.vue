<template>
  <v-container class="auth-callback d-flex align-center justify-center fill-height">
    <div class="text-center">
      <v-progress-circular v-if="!error" indeterminate color="#4FD1C5" size="42" />
      <p v-if="!error" class="auth-callback-text">{{ t('auth.socialCompleting') }}</p>
      <v-alert v-else type="error" class="mb-4">{{ error }}</v-alert>
      <v-btn v-if="error" variant="outlined" color="#4FD1C5" :to="'/login'">
        {{ t('auth.backToLogin') }}
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSocialAuthSession } from '../composables/useSocialAuthSession'

const { t } = useI18n()
const route = useRoute()
const { finishSocialAuth } = useSocialAuthSession()
const error = ref('')

onMounted(async () => {
  const queryError = typeof route.query.error === 'string' ? route.query.error : ''
  const token = typeof route.query.token === 'string' ? route.query.token : ''

  const queryErrorKeys = {
    google: 'auth.socialFailed',
    google_unavailable: 'auth.googleUnavailable',
    disabled: 'auth.accountDisabled'
  }

  if (queryError || !token) {
    error.value = queryError
      ? t(queryErrorKeys[queryError] || 'auth.socialFailed')
      : t('auth.socialFailed')
    return
  }

  try {
    await finishSocialAuth({
      token,
      isNew: route.query.isNew === '1',
      redirect: route.query.redirect
    })
  } catch {
    error.value = t('auth.socialFailed')
  }
})
</script>

<style scoped>
.auth-callback {
  min-height: 70vh;
}

.auth-callback-text {
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
