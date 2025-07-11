<template>
  <div class="register-container">
    <v-card class="register-card">
      <v-card-title class="text-h4 mb-4">Register</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="Name"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.name"
          ></v-text-field>

          <v-text-field
            v-model="formData.age"
            label="Age"
            type="number"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.age"
          ></v-text-field>

          <v-text-field
            v-model="formData.country"
            label="Country"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.country"
          ></v-text-field>

          <v-select
            v-model="formData.plan"
            :items="planOptions"
            label="Plan"
            variant="outlined"
            class="mb-4"
            :error-messages="errors.plan"
          ></v-select>

          <v-text-field
            v-model="formData.password"
            label="Password"
            type="password"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.password"
          ></v-text-field>

          <v-text-field
            v-model="formData.confirmPassword"
            label="Confirm Password"
            type="password"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.confirmPassword"
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
            Register
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    <v-dialog v-model="showSuccess" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Registration Successful</v-card-title>
        <v-card-text>
          Your account has been created! You are now logged in.
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
  age: '',
  country: '',
  plan: 'Energy',
  password: '',
  confirmPassword: ''
})

const planOptions = [
  'Energy',
  'Present',
  'Future'
]

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.name) {
    errors.value.name = 'Name is required'
    isValid = false
  }

  if (!formData.value.age) {
    errors.value.age = 'Age is required'
    isValid = false
  } else if (formData.value.age < 0 || formData.value.age > 120) {
    errors.value.age = 'Age must be between 0 and 120'
    isValid = false
  }

  if (!formData.value.country) {
    errors.value.country = 'Country is required'
    isValid = false
  }

  if (!formData.value.password) {
    errors.value.password = 'Password is required'
    isValid = false
  } else if (formData.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
    isValid = false
  }

  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''

  try {
    const response = await authService.register({
      name: formData.value.name,
      age: formData.value.age,
      country: formData.value.country,
      plan: formData.value.plan,
      password: formData.value.password
    })
    // Store JWT token and user info
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    window.dispatchEvent(new Event('auth-changed'))
    showSuccess.value = true
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Registration failed. Please try again.'
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
.register-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.register-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
}

.v-card-title {
  text-align: center;
}
</style> 