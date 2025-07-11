<template>
  <div class="users-container">
    <v-card class="users-card">
      <v-card-title class="text-h4 mb-4">Registered Users</v-card-title>
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
import { ref, onMounted } from 'vue'
import { userService } from '../services/api'

const users = ref([])
const loading = ref(false)
const error = ref('')

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Age', key: 'age' },
  { title: 'Country', key: 'country' },
  { title: 'Plan', key: 'plan' },
  { title: 'Registration Date', key: 'createdAt' }
]

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await userService.getAllUsers()
    users.value = response.data.users
  } catch (err) {
    error.value = err.response?.data?.message || 'Error fetching users'
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