<template>
  <div class="login-container">
    <div class="login-header mb-6">
      <h1 class="login-title">{{ t('auth.loginPageTitle') }}</h1>
      <p class="login-description">{{ t('auth.loginDescription') }}</p>
    </div>
    <v-card class="login-card">
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="formData.email"
            :label="t('auth.email')"
            type="email"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.email"
          ></v-text-field>

          <v-text-field
            v-model="formData.password"
            :label="t('auth.password')"
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

          <GradientButton
            type="submit"
            block
            :loading="loading"
            :disabled="loading"
            class="mb-4"
          >
            {{ t('auth.submitLogin') }}
          </GradientButton>

          <div class="text-center mb-4">
            <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">
              {{ t('auth.forgotPassword') }}
            </a>
          </div>

        </v-form>
      </v-card-text>
    </v-card>
    <SuccessDialog
      v-model="showSuccess"
      :title="t('auth.successLogin')"
      :message="t('auth.successLoginBody')"
      :button-text="t('common.ok')"
      @close="closeSuccessModal"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'
import { useI18n } from 'vue-i18n'
import GradientButton from './GradientButton.vue'
import SuccessDialog from './SuccessDialog.vue'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const errors = ref({})
const showSuccess = ref(false)
const { t } = useI18n()


const formData = ref({
  email: '',
  password: ''
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
  
  if (!formData.value.password) {
    errors.value.password = t('auth.required')
    isValid = false
  }
  
  return isValid
}

const handleForgotPassword = () => {
  router.push('/forgot-password')
}

const handleLogin = async () => {
  if (!validateForm()) return
  loading.value = true
  error.value = ''
  try {
    const response = await authService.login({
      email: formData.value.email.trim().toLowerCase(),
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
      error.value = t('auth.loginFailed')
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-header {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: rgba(0, 0, 0, 0.87);
}

.login-description {
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

@media (min-width: 600px) {
  .login-title {
    font-size: 2.5rem;
  }
  
  .login-description {
    font-size: 1.125rem;
  }
}

.login-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
  background: transparent !important;
  box-shadow: none !important;
}

.v-card-title {
  text-align: center;
}

.forgot-link {
  color: #1976d2;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
}

.forgot-link:hover {
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