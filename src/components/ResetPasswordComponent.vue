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
const { t, locale } = useI18n()

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
      password: formData.value.password,
      language: locale.value
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

<template>
  <div class="reset-password-container">
    <div class="bg-glow"></div>

    <div class="reset-password-content">
      <div class="reset-password-header mb-8">
        <div class="status-badge mb-4">
          <span>{{ t('auth.statusReset') || 'СИСТЕМА: ОБНОВЛЕНИЕ ДАННЫХ' }}</span>
        </div>
        <h1 class="reset-password-title">{{ t('auth.resetPasswordTitle') }}</h1>
        <p class="reset-password-description">
          {{ t('auth.resetPasswordDescription') }}
        </p>
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
                class="custom-field mb-4"
                base-color="rgba(255,255,255,0.1)"
                color="#4FD1C5"
                :error-messages="errors.password"
                hide-details="auto"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="#4FD1C5" size="20">mdi-lock-outline</v-icon>
                </template>
              </v-text-field>

              <v-text-field
                v-model="formData.confirmPassword"
                :label="t('auth.confirmPassword')"
                type="password"
                required
                variant="outlined"
                class="custom-field mb-6"
                base-color="rgba(255,255,255,0.1)"
                color="#4FD1C5"
                :error-messages="errors.confirmPassword"
                hide-details="auto"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="#4FD1C5" size="20">mdi-lock-check-outline</v-icon>
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
                {{ t('auth.resetPassword') }}
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
              <v-icon size="40" color="#4FD1C5">mdi-check-decagram-outline</v-icon>
            </div>
            <h2 class="success-title mb-2">{{ t('auth.passwordResetSuccess') }}</h2>
            <p class="success-desc mb-6">{{ t('auth.passwordResetSuccessDescription') }}</p>
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
  </div>
</template>

<style scoped>
.reset-password-container {
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
  background: radial-gradient(circle, rgba(79, 209, 197, 0.08) 0%, transparent 70%);
  z-index: 0;
}

.reset-password-content {
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

.reset-password-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1px;
  line-height: 1.1;
}

.reset-password-description {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  margin-top: 12px;
}

.reset-password-card {
  background: rgba(30, 41, 59, 0.4) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 28px !important;
  padding: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

/* Кастомизация инпутов для темной темы */
:deep(.v-field) {
  background: rgba(15, 23, 42, 0.8) !important;
  border-radius: 16px !important;
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

:deep(.v-label) {
  color: rgba(255, 255, 255, 0.4) !important;
}

:deep(.v-field__input) {
  color: #fff !important;
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
  text-shadow: 0 0 8px rgba(79, 209, 197, 0.4);
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
}
</style>
