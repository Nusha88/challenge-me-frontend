<template>
  <div class="forgot-password-container">
    <div class="bg-glow"></div>

    <div class="forgot-password-content">
      <div class="forgot-password-header mb-8">
        <div class="status-badge mb-4">
          <span>{{ t('auth.statusRecovery') || 'СИСТЕМА: ВОССТАНОВЛЕНИЕ ДОСТУПА' }}</span>
        </div>

        <h1 class="forgot-password-title">{{ t('auth.forgotPasswordTitle') }}</h1>
        <p class="forgot-password-description">
          {{ t('auth.forgotPasswordDescription') }}
        </p>
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
                  class="custom-field mb-4"
                  base-color="rgba(255,255,255,0.1)"
                  color="#4FD1C5"
                  :error-messages="errors.email"
                  hide-details="auto"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="#4FD1C5" size="20">mdi-email-outline</v-icon>
                </template>
              </v-text-field>

              <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  class="mb-4 rounded-xl"
              >
                {{ error }}
              </v-alert>

              <GradientButton
                  type="submit"
                  block
                  :loading="loading"
                  :disabled="loading"
                  class="mb-6 py-6"
              >
                {{ t('auth.sendResetLink') }}
              </GradientButton>

              <div class="text-center">
                <a href="#" class="back-link" @click.prevent="goBack">
                  <v-icon size="small" class="mr-1">mdi-arrow-left</v-icon>
                  {{ t('auth.backToLogin') }}
                </a>
              </div>
            </v-form>
          </div>

          <div v-else class="success-message">
            <div class="icon-wrapper mb-6">
              <v-icon size="40" color="#4FD1C5">mdi-shield-check-outline</v-icon>
            </div>
            <h2 class="success-title mb-2">{{ t('auth.resetLinkSent') }}</h2>
            <p class="success-desc mb-6">
              {{ t('auth.resetLinkSentDescription', { email: formData.email }) }}
            </p>
            <GradientButton block @click="goBack">
              {{ t('auth.backToLogin') }}
            </GradientButton>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
/* Контейнер с темным фоном как в Login */
.forgot-password-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80vw;
  height: 80vw;
  background: radial-gradient(circle, rgba(79, 209, 197, 0.07) 0%, transparent 70%);
  z-index: 0;
}

.forgot-password-content {
  z-index: 1;
  width: 100%;
  max-width: 440px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 20px;
  color: #4FD1C5;
  font-size: 0.7rem;
  letter-spacing: 1px;
  font-weight: 700;
  text-transform: uppercase;
}

.forgot-password-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1px;
  line-height: 1.1;
}

.forgot-password-description {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  margin-top: 12px;
}

/* Эффект матового стекла для карточки */
.forgot-password-card {
  background: rgba(30, 41, 59, 0.4) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 28px !important;
  padding: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

/* Кастомные поля ввода */
:deep(.v-field) {
  background: rgba(15, 23, 42, 0.8) !important;
  border-radius: 16px !important;
  color: #fff;
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

:deep(.v-label) {
  color: rgba(255, 255, 255, 0.4) !important;
}

.back-link {
  color: #4FD1C5;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.back-link:hover {
  opacity: 1;
  letter-spacing: 0.2px;
}

.success-message {
  text-align: center;
  padding: 10px 0;
}

.icon-wrapper {
  width: 72px;
  height: 72px;
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.success-title {
  color: #fff;
  font-weight: 700;
}

.success-desc {
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}
</style>
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
const { t, locale } = useI18n()

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
      email: formData.value.email.trim().toLowerCase(),
      language: locale.value
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
