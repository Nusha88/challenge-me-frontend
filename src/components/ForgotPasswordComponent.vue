<template>
  <div class="forgot-password-container">
    <div class="forgot-password-header mb-6">
      <h1 class="forgot-password-title">{{ t('auth.forgotPasswordTitle') }}</h1>
      <p class="forgot-password-description">{{ t('auth.forgotPasswordDescription') }}</p>
    </div>
    <v-card class="forgot-password-card">
      <v-card-text>
        <div v-if="!emailSent">
          <v-form @submit.prevent="handleSubmit">
            <v-text-field
              v-model="formData.email"
              :label="t('auth.email')"
              type="email"
              required
              variant="outlined"
              class="mb-4"
              :error-messages="errors.email"
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
              {{ t('auth.sendResetLink') }}
            </GradientButton>

            <div class="text-center">
              <a href="#" class="back-link" @click.prevent="goBack">
                {{ t('auth.backToLogin') }}
              </a>
            </div>
          </v-form>
        </div>

        <div v-else class="success-message">
          <v-icon size="64" color="success" class="mb-4">mdi-email-check</v-icon>
          <h2 class="mb-2">{{ t('auth.resetLinkSent') }}</h2>
          <p class="mb-4">{{ t('auth.resetLinkSentDescription', { email: formData.email }) }}</p>
          <GradientButton
            block
            @click="goBack"
          >
            {{ t('auth.backToLogin') }}
          </GradientButton>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'
import { useI18n } from 'vue-i18n'
import GradientButton from './GradientButton.vue'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const errors = ref({})
const emailSent = ref(false)
const { t } = useI18n()

const formData = ref({
  email: ''
})

const validateForm = () => {
  errors.value = {}
  let isValid = true
  
  if (!formData.value.email) {
    errors.value.email = t('auth.required')
    isValid = false
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.value.email.trim())) {
      errors.value.email = t('auth.emailInvalid')
      isValid = false
    }
  }
  
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  loading.value = true
  error.value = ''
  try {
    await authService.forgotPassword({
      email: formData.value.email.trim().toLowerCase()
    })
    emailSent.value = true
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = t('auth.forgotPasswordFailed')
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/login')
}
</script>

<style scoped>
.forgot-password-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.forgot-password-header {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.forgot-password-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: rgba(0, 0, 0, 0.87);
}

.forgot-password-description {
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

@media (min-width: 600px) {
  .forgot-password-title {
    font-size: 2.5rem;
  }
  
  .forgot-password-description {
    font-size: 1.125rem;
  }
}

.forgot-password-card {
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
