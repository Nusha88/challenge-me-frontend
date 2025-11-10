<template>
  <div class="register-container">
    <v-card class="register-card">
      <v-card-title class="text-h4 mb-4">{{ t('auth.registerTitle') }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            :label="t('auth.name')"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.name"
          ></v-text-field>

          <v-text-field
            v-model="formData.age"
            :label="t('auth.age')"
            type="number"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.age"
          ></v-text-field>

          <v-text-field
            v-model="formData.country"
            :label="t('auth.country')"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.country"
          ></v-text-field>

          <v-select
            v-model="formData.plan"
            :items="planOptions"
            :label="t('auth.plan')"
            item-title="title"
            item-value="value"
            variant="outlined"
            class="mb-4"
            :error-messages="errors.plan"
          ></v-select>

          <v-text-field
            v-model="formData.password"
            :label="t('auth.password')"
            type="password"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.password"
          ></v-text-field>

          <v-text-field
            v-model="formData.confirmPassword"
            :label="t('auth.confirmPassword')"
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
            {{ t('auth.submitRegister') }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    <v-dialog v-model="showSuccess" max-width="400">
      <v-card>
        <v-card-title class="text-h5">{{ t('auth.successRegister') }}</v-card-title>
        <v-card-text>
          {{ t('auth.successRegisterBody') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="closeSuccessModal">{{ t('auth.close') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const errors = ref({})
const showSuccess = ref(false)
const { t } = useI18n()

const formData = ref({
  name: '',
  age: '',
  country: '',
  plan: 'Energy',
  password: '',
  confirmPassword: ''
})

const planOptions = computed(() => [
  { title: t('auth.planOptions.energy'), value: 'Energy' },
  { title: t('auth.planOptions.present'), value: 'Present' },
  { title: t('auth.planOptions.future'), value: 'Future' }
])

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.name) {
    errors.value.name = t('auth.required')
    isValid = false
  }

  if (!formData.value.age) {
    errors.value.age = t('auth.required')
    isValid = false
  } else if (formData.value.age < 0 || formData.value.age > 120) {
    errors.value.age = t('auth.ageRange')
    isValid = false
  }

  if (!formData.value.country) {
    errors.value.country = t('auth.required')
    isValid = false
  }

  if (!formData.value.password) {
    errors.value.password = t('auth.required')
    isValid = false
  } else if (formData.value.password.length < 6) {
    errors.value.password = t('auth.passwordLength')
    isValid = false
  }

  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = t('auth.confirmPasswordRequired')
    isValid = false
  } else if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = t('auth.passwordsDoNotMatch')
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
      error.value = t('auth.registrationFailed')
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