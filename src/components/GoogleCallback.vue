<template>
  <div class="callback-container">
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
    ></v-progress-circular>
    <p class="mt-4">{{ t('auth.processing') }}</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

onMounted(() => {
  const token = route.query.token
  const userParam = route.query.user

  if (token && userParam) {
    try {
      const user = JSON.parse(decodeURIComponent(userParam))
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      window.dispatchEvent(new Event('auth-changed'))
      router.push('/')
    } catch (error) {
      console.error('Error processing Google callback:', error)
      router.push('/login?error=oauth_failed')
    }
  } else {
    router.push('/login?error=oauth_failed')
  }
})
</script>

<style scoped>
.callback-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
}
</style>



