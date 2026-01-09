<template>
  <div class="users-container">
    <v-card class="users-card">
      <v-card-title class="text-h4 mb-4">{{ t('users.title') }}</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          :sort-by="[{ key: 'challengeCount', order: 'desc' }]"
          class="elevation-1"
          @click:row="handleRowClick"
        >
          <template v-slot:item.avatarUrl="{ item }">
            <v-avatar size="40" class="mr-2">
              <v-img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="item.name" cover></v-img>
              <span v-else class="avatar-initials">{{ getUserInitials(item.name) }}</span>
            </v-avatar>
          </template>
          <template v-slot:item.name="{ item }">
            {{ item.name }}
          </template>
          <template v-slot:item.challengeCount="{ item }">
            {{ item.challengeCount || 0 }}
          </template>
          <template v-slot:item.daysOnSite="{ item }">
            {{ item.daysOnSite || 0 }}
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
import { useRouter } from 'vue-router'
import { userService } from '../services/api'
import { useI18n } from 'vue-i18n'

const router = useRouter()

const users = ref([])
const loading = ref(false)
const error = ref('')
const { t, locale } = useI18n()

const getUserInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  const initials = parts.length === 1
    ? parts[0].slice(0, 2)
    : `${parts[0][0] || ''}${parts[1][0] || ''}`
  return initials.toUpperCase()
}

const getDaysOnSite = (dateString) => {
  if (!dateString) return '0'
  try {
    const registrationDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    registrationDate.setHours(0, 0, 0, 0)
    
    const diffTime = today - registrationDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays.toString()
  } catch (err) {
    return '0'
  }
}

const headers = computed(() => [
  { title: '', key: 'avatarUrl', sortable: false, width: '80px' },
  { title: t('users.name'), key: 'name' },
  { title: t('users.challenges'), key: 'challengeCount', align: 'center' },
  { title: t('users.daysOnSite'), key: 'daysOnSite', align: 'center' }
])


const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await userService.getAllUsers()
    // Add daysOnSite to each user for sorting
    users.value = response.data.users.map(user => ({
      ...user,
      daysOnSite: getDaysOnSiteNumber(user.createdAt)
    }))
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.usersError')
  } finally {
    loading.value = false
  }
}

const getDaysOnSiteNumber = (dateString) => {
  if (!dateString) return 0
  try {
    const registrationDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    registrationDate.setHours(0, 0, 0, 0)
    
    const diffTime = today - registrationDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch (err) {
    return 0
  }
}

const handleRowClick = (event, row) => {
  const userId = row.item._id || row.item.id
  if (userId) {
    router.push(`/users/${userId}`)
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

.avatar-initials {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
}
</style> 