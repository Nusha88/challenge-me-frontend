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
            v-model="formData.email"
            :label="t('auth.email')"
            type="email"
            required
            variant="outlined"
            class="mb-4"
            :error-messages="errors.email"
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

          <v-autocomplete
            v-model="formData.country"
            :items="countryOptions"
            :label="t('auth.country')"
            item-title="title"
            item-value="value"
            variant="outlined"
            class="mb-4"
            :error-messages="errors.country"
            hide-details="auto"
            clearable
          ></v-autocomplete>

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
          >
            {{ t('auth.submitRegister') }}
          </GradientButton>
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
          <v-btn color="primary" @click="closeSuccessModal">{{ t('common.ok') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'
import { useI18n } from 'vue-i18n'
import GradientButton from './GradientButton.vue'
import {
  getCountryOptions,
  detectUserCountry,
  sanitizeCountryCode,
  isValidCountryCode
} from '../utils/countries'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const errors = ref({})
const showSuccess = ref(false)
const { t, locale } = useI18n()

const formData = ref({
  name: '',
  email: '',
  age: '',
  country: '',
  password: '',
  confirmPassword: ''
})

const ageTouched = ref(false)
const nameTouched = ref(false)
const emailTouched = ref(false)
const passwordTouched = ref(false)
const confirmTouched = ref(false)
const countryTouched = ref(false)

const isEmpty = (value) => value === '' || value === null || value === undefined

const getAgeError = (value, includeRequired = false) => {
  if (isEmpty(value)) {
    return includeRequired ? t('auth.required') : ''
  }

  const ageNumber = Number(value)
  if (!Number.isInteger(ageNumber)) {
    return t('auth.ageInteger')
  }

  if (ageNumber < 12 || ageNumber > 99) {
    return t('auth.ageRange')
  }

  return ''
}

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

const getCountryError = (value, includeRequired = false) => {
  if (isEmpty(value)) {
    return includeRequired ? t('auth.required') : ''
  }

  const sanitized = sanitizeCountryCode(value)
  if (!sanitized) {
    return t('auth.countryInvalid')
  }

  if (!isValidCountryCode(sanitized)) {
    return t('auth.countryInvalid')
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

const countryOptions = computed(() => getCountryOptions(locale.value))

onMounted(() => {
  const detectedCountry = detectUserCountry()
  if (detectedCountry && !formData.value.country) {
    formData.value.country = detectedCountry
    countryTouched.value = false
  }
})

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

watch(() => formData.value.age, (newValue) => {
  if (!ageTouched.value && !isEmpty(newValue)) {
    ageTouched.value = true
  }

  if (ageTouched.value) {
    errors.value.age = getAgeError(newValue, false)
  }
})

watch(() => formData.value.country, (newValue) => {
  if (newValue && typeof newValue === 'object') {
    const normalized = sanitizeCountryCode(newValue.value)
    formData.value.country = normalized
    return
  }

  if (typeof newValue === 'string' && newValue.length === 2) {
    const normalizedCode = sanitizeCountryCode(newValue)
    if (normalizedCode && normalizedCode !== newValue) {
      formData.value.country = normalizedCode
      return
    }
  }

  if (!countryTouched.value && !isEmpty(newValue)) {
    countryTouched.value = true
  }

  if (countryTouched.value) {
    errors.value.country = getCountryError(newValue, false)
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

  ageTouched.value = true
  const ageError = getAgeError(formData.value.age, true)
  if (ageError) {
    errors.value.age = ageError
    isValid = false
  } else {
    errors.value.age = ''
  }

  if (!formData.value.country) {
    errors.value.country = t('auth.required')
    isValid = false
  } else {
    const countryError = getCountryError(formData.value.country, true)
    if (countryError) {
      errors.value.country = countryError
      isValid = false
    } else {
      errors.value.country = ''
      formData.value.country = sanitizeCountryCode(formData.value.country)
    }
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
  const ageNumber = Number(formData.value.age)
  const countryCode = sanitizeCountryCode(formData.value.country)
  const trimmedName = formData.value.name.trim()
  const trimmedEmail = formData.value.email.trim().toLowerCase()

  try {
    const response = await authService.register({
      name: trimmedName,
      email: trimmedEmail,
      age: ageNumber,
      country: countryCode,
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