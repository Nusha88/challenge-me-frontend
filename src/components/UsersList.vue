<template>
  <div class="users-container">
    <v-card class="users-card">
      <v-card-title class="text-h4 mb-4">{{ t('users.title') }}</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          class="elevation-1"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template v-slot:no-data>
            <div class="py-6 text-center">{{ t('users.noUsers') }}</div>
          </template>
        </v-data-table>

        <v-alert
          v-if="error"
          type="error"
          class="mt-4"
        >
          {{ error }}
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { userService } from '../services/api'
import { useI18n } from 'vue-i18n'

const users = ref([])
const loading = ref(false)
const error = ref('')
const { t, locale } = useI18n()

const headers = computed(() => [
  { title: t('users.name'), key: 'name' },
  { title: t('users.age'), key: 'age' },
  { title: t('users.country'), key: 'country' },
  { title: t('users.plan'), key: 'plan' },
  { title: t('users.registered'), key: 'createdAt' }
])

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

const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await userService.getAllUsers()
    users.value = response.data.users
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.usersError')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.users-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  padding: 24px;
}

.users-card {
  width: 100%;
  padding: 24px;
}

.v-card-title {
  text-align: center;
}
</style> 