<template>
  <div class="register-container">
    <div class="register-header mb-6">
      <h1 class="register-title">{{ t('auth.registerPageTitle') }}</h1>
      <p class="register-description">{{ t('auth.registerDescription') }}</p>
    </div>
    <v-card class="register-card">
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
            {{ t('auth.submitRegister') }}
          </GradientButton>

          <div class="divider mb-4">
            <span>{{ t('auth.or') }}</span>
          </div>

          <v-btn
            block
            size="x-large"
            variant="outlined"
            class="google-button"
            @click="handleGoogleSignIn"
          >
            <v-icon start>mdi-google</v-icon>
            {{ t('auth.continueWithGoogle') }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    <SuccessDialog
      v-model="showSuccess"
      :title="t('auth.successRegister')"
      :message="t('auth.successRegisterBody')"
      :button-text="t('common.ok')"
      @close="closeSuccessModal"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
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
const { t, locale } = useI18n()

const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const nameTouched = ref(false)
const emailTouched = ref(false)
const passwordTouched = ref(false)
const confirmTouched = ref(false)

const isEmpty = (value) => value === '' || value === null || value === undefined

const getEmailError = (value, includeRequired = false) => {
  if (isEmpty(value)) {
    return includeRequired ? t('auth.required') : ''
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value.trim())) {
    return t('auth.emailInvalid')
  }

  return ''
}

const getPasswordError = (value, includeRequired = false) => {
  if (isEmpty(value)) {
    return includeRequired ? t('auth.required') : ''
  }

  if (String(value).length < 6) {
    return t('auth.passwordLength')
  }

  return ''
}

const getConfirmPasswordError = (value, includeRequired = false) => {
  if (isEmpty(value)) {
    return includeRequired ? t('auth.confirmPasswordRequired') : ''
  }

  if (value !== formData.value.password) {
    return t('auth.passwordsDoNotMatch')
  }

  return ''
}

watch(() => formData.value.name, (newValue) => {
  if (!nameTouched.value && !isEmpty(newValue)) {
    nameTouched.value = true
  }

  if (nameTouched.value) {
    errors.value.name = isEmpty(newValue?.trim()) ? t('auth.required') : ''
  }
})

watch(() => formData.value.email, (newValue) => {
  if (!emailTouched.value && !isEmpty(newValue)) {
    emailTouched.value = true
  }

  if (emailTouched.value) {
    errors.value.email = getEmailError(newValue, false)
  }
})

watch(() => formData.value.password, (newValue) => {
  if (!passwordTouched.value && !isEmpty(newValue)) {
    passwordTouched.value = true
  }

  if (passwordTouched.value) {
    errors.value.password = getPasswordError(newValue, false)
  }

  if (confirmTouched.value) {
    errors.value.confirmPassword = getConfirmPasswordError(formData.value.confirmPassword, false)
  }
})

watch(() => formData.value.confirmPassword, (newValue) => {
  if (!confirmTouched.value && !isEmpty(newValue)) {
    confirmTouched.value = true
  }

  if (confirmTouched.value) {
    errors.value.confirmPassword = getConfirmPasswordError(newValue, false)
  }
})

const validateForm = () => {
  errors.value = {}
  let isValid = true

  nameTouched.value = true
  if (!formData.value.name || !formData.value.name.trim()) {
    errors.value.name = t('auth.required')
    isValid = false
  } else {
    errors.value.name = ''
  }

  emailTouched.value = true
  const emailError = getEmailError(formData.value.email, true)
  if (emailError) {
    errors.value.email = emailError
    isValid = false
  } else {
    errors.value.email = ''
  }

  passwordTouched.value = true
  if (!formData.value.password) {
    errors.value.password = t('auth.required')
    isValid = false
  } else if (formData.value.password.length < 6) {
    errors.value.password = t('auth.passwordLength')
    isValid = false
  } else {
    errors.value.password = ''
  }

  confirmTouched.value = true
  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = t('auth.confirmPasswordRequired')
    isValid = false
  } else if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = t('auth.passwordsDoNotMatch')
    isValid = false
  } else {
    errors.value.confirmPassword = ''
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''
  const trimmedName = formData.value.name.trim()
  const trimmedEmail = formData.value.email.trim().toLowerCase()

  try {
    const response = await authService.register({
      name: trimmedName,
      email: trimmedEmail,
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

const handleGoogleSignIn = () => {
  // Determine backend URL - same logic as api.js
  const hostname = window.location.hostname
  const isLocal = ['localhost', '127.0.0.1'].includes(hostname) || hostname.endsWith('.local')
  
  let backendUrl = import.meta.env.VITE_API_BASE_URL
  if (!backendUrl) {
    backendUrl = isLocal ? 'http://localhost:3000' : 'https://challenge-me-backend-frh7.onrender.com'
  } else {
    // Remove /api suffix if present
    backendUrl = backendUrl.replace(/\/api\/?$/, '')
  }
  
  const googleAuthUrl = `${backendUrl}/api/auth/google`
  window.location.href = googleAuthUrl
}
</script>

<style scoped>
.register-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.register-header {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.register-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: rgba(0, 0, 0, 0.87);
}

.register-description {
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

@media (min-width: 600px) {
  .register-title {
    font-size: 2.5rem;
  }
  
  .register-description {
    font-size: 1.125rem;
  }
}

.register-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
  background: transparent !important;
  box-shadow: none !important;
}

.v-card-title {
  text-align: center;
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

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 16px 0;
  color: rgba(0, 0, 0, 0.6);
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.divider span {
  padding: 0 16px;
}

.google-button {
  border-radius: 12px !important;
  border-color: rgba(0, 0, 0, 0.12) !important;
  text-transform: none !important;
  font-size: 1rem !important;
  font-weight: 500 !important;
  color: rgba(0, 0, 0, 0.87) !important;
}

.google-button:hover {
  background-color: rgba(0, 0, 0, 0.04) !important;
}
</style> 