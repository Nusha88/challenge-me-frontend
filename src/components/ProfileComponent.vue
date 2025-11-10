<template>
  <div class="profile-container">
    <v-card class="profile-card">
      <v-card-title class="text-h4 mb-4">{{ t('profile.title') }}</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <v-skeleton-loader v-if="loading" type="card"></v-skeleton-loader>
        <div v-else-if="user">
          <v-list>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.name') }}:</strong> {{ user.name }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.age') }}:</strong> {{ user.age }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.country') }}:</strong> {{ user.country }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.plan') }}:</strong> {{ user.plan }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.registered') }}:</strong> {{ formatDate(user.createdAt) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
        <v-alert v-else type="info">{{ t('profile.noData') }}</v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userService } from '../services/api'
import { useI18n } from 'vue-i18n'

const user = ref(null)
const loading = ref(false)
const error = ref('')
const { t, locale } = useI18n()

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(new Date(dateString))
  } catch (err) {
    return dateString
  }
}

const fetchProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await userService.getProfile()
    user.value = response.data.user
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.profileError')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.profile-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
}

.v-card-title {
  text-align: center;
}
</style> 