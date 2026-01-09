<template>
  <div class="reset-password-container">
    <div class="reset-password-header mb-6">
      <h1 class="reset-password-title">{{ t('auth.resetPasswordTitle') }}</h1>
      <p class="reset-password-description">{{ t('auth.resetPasswordDescription') }}</p>
    </div>
    <v-card class="reset-password-card">
      <v-card-text>
        <div v-if="!passwordReset">
          <v-form @submit.prevent="handleSubmit">
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

            <GradientButton
              type="submit"
              block
              :loading="loading"
              :disabled="loading"
              class="mb-4"
            >
              {{ t('auth.resetPassword') }}
            </GradientButton>

            <div class="text-center">
              <a href="#" class="back-link" @click.prevent="goBack">
                {{ t('auth.backToLogin') }}
              </a>
            </div>
          </v-form>
        </div>

        <div v-else class="success-message">
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
          <h2 class="mb-2">{{ t('auth.passwordResetSuccess') }}</h2>
          <p class="mb-4">{{ t('auth.passwordResetSuccessDescription') }}</p>
          <GradientButton
            block
            @click="goToLogin"
          >
            {{ t('auth.backToLogin') }}
          </GradientButton>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../services/api'
import { useI18n } from 'vue-i18n'
import GradientButton from './GradientButton.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const error = ref('')
const errors = ref({})
const passwordReset = ref(false)
const { t } = useI18n()

const formData = ref({
  password: '',
  confirmPassword: ''
})

const resetToken = ref('')

onMounted(() => {
  resetToken.value = route.query.token || ''
  if (!resetToken.value) {
    error.value = t('auth.invalidResetToken')
  }
})

const validateForm = () => {
  errors.value = {}
  let isValid = true
  
  if (!formData.value.password) {
    errors.value.password = t('auth.required')
    isValid = false
  } else if (formData.value.password.length < 6) {
    errors.value.password = t('auth.passwordLength')
    isValid = false
  }
  
  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = t('auth.required')
    isValid = false
  } else if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = t('auth.passwordsDoNotMatch')
    isValid = false
  }
  
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  if (!resetToken.value) {
    error.value = t('auth.invalidResetToken')
    return
  }
  
  loading.value = true
  error.value = ''
  try {
    await authService.resetPassword({
      token: resetToken.value,
      password: formData.value.password
    })
    passwordReset.value = true
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = t('auth.resetPasswordFailed')
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/login')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.reset-password-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.reset-password-header {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.reset-password-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: rgba(0, 0, 0, 0.87);
}

.reset-password-description {
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

@media (min-width: 600px) {
  .reset-password-title {
    font-size: 2.5rem;
  }
  
  .reset-password-description {
    font-size: 1.125rem;
  }
}

.reset-password-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
  background: transparent !important;
  box-shadow: none !important;
}

.success-message {
  text-align: center;
  padding: 24px 0;
}

.back-link {
  color: #1976d2;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
}

.back-link:hover {
  text-decoration: underline;
}

:deep(.v-field) {
  border-radius: 12px !important;
}

:deep(.v-field__outline) {
  border-radius: 12px !important;
}

:deep(.v-field__input) {
  border-radius: 12px !important;
}

:deep(.v-text-field .v-field),
:deep(.v-autocomplete .v-field),
:deep(.v-select .v-field),
:deep(.v-textarea .v-field) {
  border-radius: 12px !important;
}

:deep(.v-text-field .v-field__outline),
:deep(.v-autocomplete .v-field__outline),
:deep(.v-select .v-field__outline),
:deep(.v-textarea .v-field__outline) {
  border-radius: 12px !important;
}
</style>
