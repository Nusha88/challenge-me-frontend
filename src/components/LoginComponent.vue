<template>
  <div class="login-container">
    <v-card class="login-card">
      <v-card-title class="text-h4 mb-4">Login</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="formData.name"
            label="Name"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.name"
          ></v-text-field>

          <v-text-field
            v-model="formData.password"
            label="Password"
            type="password"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.password"
          ></v-text-field>

          <v-alert
            v-if="error"
            type="error"
            class="mb-4"
          >
            {{ error }}
          </v-alert>

          <v-btn
            color="primary"
            type="submit"
            block
            size="large"
            :loading="loading"
            :disabled="loading"
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    <v-dialog v-model="showSuccess" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Login Successful</v-card-title>
        <v-card-text>
          Welcome back! You are now logged in.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeSuccessModal">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const errors = ref({})
const showSuccess = ref(false)

const formData = ref({
  name: '',
  password: ''
})

const validateForm = () => {
  errors.value = {}
  let isValid = true
  if (!formData.value.name) {
    errors.value.name = 'Name is required'
    isValid = false
  }
  if (!formData.value.password) {
    errors.value.password = 'Password is required'
    isValid = false
  }
  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) return
  loading.value = true
  error.value = ''
  try {
    const response = await authService.login({
      name: formData.value.name,
      password: formData.value.password
    })
    // Store JWT token in localStorage
    localStorage.setItem('token', response.data.token)
    // Optionally store user info
    localStorage.setItem('user', JSON.stringify(response.data.user))
    window.dispatchEvent(new Event('auth-changed'))
    showSuccess.value = true
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Login failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

function closeSuccessModal() {
  showSuccess.value = false
  router.push('/')
}
</script>

<style scoped>
.login-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
}

.v-card-title {
  text-align: center;
}
</style> 