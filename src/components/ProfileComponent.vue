<template>
  <div class="profile-container">
    <v-card class="profile-card">
      <v-card-title class="text-h4 mb-4">User Profile</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <v-skeleton-loader v-if="loading" type="card"></v-skeleton-loader>
        <div v-else-if="user">
          <v-list>
            <v-list-item>
              <v-list-item-title><strong>Name:</strong> {{ user.name }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Age:</strong> {{ user.age }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Country:</strong> {{ user.country }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Plan:</strong> {{ user.plan }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>Registered:</strong> {{ formatDate(user.createdAt) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { userService } from '../services/api'

const user = ref(null)
const loading = ref(false)
const error = ref('')

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await userService.getProfile()
    user.value = response.data.user
  } catch (err) {
    error.value = err.response?.data?.message || 'Error fetching profile'
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