<template>
  <v-container fluid class="pa-0 fill-height registration-wrapper">
    <v-row no-gutters class="fill-height">

       <v-col cols="12" md="6" class="motivation-section d-none d-md-flex align-center justify-center" :style="{ backgroundImage: `url(${registerBgImage})` }">
        <div class="particles-container">
          <div
              v-for="(p, i) in particles"
              :key="i"
              class="particle"
              :style="p.style"
          ></div>
        </div>
        <div class="motivation-content pa-12 reveal-item" style="--i: 0">
          <v-chip color="rgba(255,255,255,0.2)" text-color="white" class="mb-4 glass-chip">
            ✨ {{ t('auth.joinCommunity') }}
          </v-chip>
          <h1 class="text-h2 font-weight-black text-white mb-6 leading-tight">
            Forge Your Path.<br/>
            <span class="text-gradient-gold">Become a Legend.</span>
          </h1>
          <p class="text-h6 text-white opacity-80 mb-8 font-weight-regular">
            {{ t('auth.motivationText') }}
          </p>

          <div class="hero-illustration">
            <div class="circle-blur"></div>
            <v-icon size="200" color="rgba(255,255,255,0.1)">mdi-shield-star-outline</v-icon>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="form-section d-flex align-center justify-center">
        <div class="form-wrapper pa-6 pa-md-12">

          <div class="text-center mb-8 reveal-item" style="--i: 1">
            <div class="brand-image-wrapper mb-4">
              <v-img
                  :src="swardImage"
                  width="100"
                  height="100"
                  class="mx-auto hero-image"
              ></v-img>
              <div class="brand-glow-effect"></div>
            </div>
            <h2 class="text-h4 font-weight-bold">{{ t('auth.registerPageTitle') }}</h2>
    </div>

          <v-form @submit.prevent="handleSubmit" class="reveal-item" style="--i: 2">
          <v-text-field
            v-model="formData.name"
            :label="t('auth.name')"
                prepend-inner-icon="mdi-account-outline"
            variant="outlined"
                rounded="xl"
                class="mb-4 custom-field"
            :error-messages="errors.name"
          ></v-text-field>

          <v-text-field
            v-model="formData.email"
            :label="t('auth.email')"
                prepend-inner-icon="mdi-email-outline"
            variant="outlined"
                rounded="xl"
                class="mb-4 custom-field"
            :error-messages="errors.email"
          ></v-text-field>

            <v-row>
              <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.password"
            :label="t('auth.password')"
            type="password"
                    prepend-inner-icon="mdi-lock-outline"
            variant="outlined"
                    rounded="xl"
                    class="custom-field"
            :error-messages="errors.password"
          ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
          <v-text-field
            v-model="formData.confirmPassword"
            :label="t('auth.confirmPassword')"
            type="password"
                    prepend-inner-icon="mdi-lock-check-outline"
            variant="outlined"
                    rounded="xl"
                    class="custom-field"
            :error-messages="errors.confirmPassword"
          ></v-text-field>
              </v-col>
            </v-row>

            <v-btn
            type="submit"
            block
                height="64"
            :loading="loading"
                class="hero-gradient-btn mt-6"
          >
              <span class="text-h6 font-weight-bold uppercase tracking-wider">
            {{ t('auth.submitRegister') }}
              </span>
              <v-icon end class="ml-2">mdi-arrow-right</v-icon>
            </v-btn>
          </v-form>

          <div class="text-center mt-10 reveal-item" style="--i: 3">
            <v-btn variant="text" @click="router.push('/login')" class="text-none text-subtitle-1">
              {{ t('auth.alreadyHaveAccount') }} <span class="text-primary font-weight-black ml-1">Login</span>
            </v-btn>
          </div>
        </div>
      </v-col>

    </v-row>
  </v-container>

    <SuccessDialog
      v-model="showSuccess"
      :title="t('auth.successRegister')"
      :message="t('auth.successRegisterBody')"
      :button-text="t('common.ok')"
      @close="closeSuccessModal"
    />
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'
import { useI18n } from 'vue-i18n'
import GradientButton from './GradientButton.vue'
import SuccessDialog from './SuccessDialog.vue'
import swardImage from '../assets/sward.png'
import registerBgImage from '../assets/register.png'

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
const particleCount = 40;
const particles = Array.from({ length: particleCount }).map(() => ({
  style: {
    width: Math.random() * 3 + 'px',
    height: Math.random() * 3 + 'px',
    top: Math.random() * 100 + '%',
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 15 + 's',
    animationDuration: Math.random() * 10 + 10 + 's',
  }
}));

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
    // Show success dialog - don't dispatch auth-changed yet to prevent sidebar from showing
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
  // Dispatch auth-changed event to update layout (show sidebar)
  window.dispatchEvent(new Event('auth-changed'))
  // Use replace instead of push to remove register page from history
  // This ensures the user can't go back to the register page
  router.replace('/')
}
</script>

<style scoped>
.registration-wrapper {
  min-height: 80vh;
}
/* Контейнер для левой части с частицами */
.motivation-section {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.motivation-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%);
  z-index: 0;
}

.motivation-content {
  position: relative;
  z-index: 1;
}

/* Эффект свечения сзади иконки щита */
.circle-blur {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(0,0,0,0) 70%);
  filter: blur(60px);
  z-index: 1;
}

/* Стили для частиц (маленькие мерцающие точки) */
.particles-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.particle {
  position: absolute;
  background: white;
  border-radius: 50%;
  opacity: 0.3;
  animation: float 15s infinite linear;
}

@keyframes float {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 0.5; }
  90% { opacity: 0.5; }
  100% { transform: translateY(-100vh) translateX(20vw); opacity: 0; }
}

/* ОБНОВЛЕННАЯ КНОПКА (Hero Gradient) */
.hero-gradient-btn {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
  color: white !important;
  border-radius: 16px !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  font-size: 1.1rem !important;
  box-shadow: 0 10px 25px rgba(168, 85, 247, 0.4) !important;
  transition: all 0.3s ease !important;
}

.hero-gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(168, 85, 247, 0.6) !important;
}

/* Текст "Become a Legend" */
.text-gradient-gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero-brand-container {
  position: relative;
  display: inline-block;
}

/* Сама картинка с анимацией парения */
.floating-hero-img {
  filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1));
  animation: floatImg 3s ease-in-out infinite;
  z-index: 2;
}

/* Фиолетово-оранжевое свечение под иконкой */
.img-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(255, 165, 0, 0.4) 0%, rgba(139, 92, 246, 0.3) 50%, transparent 70%);
  filter: blur(15px);
  z-index: 1;
}

/* Анимация парения */
@keyframes floatImg {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Убедись, что заголовок выглядит аккуратно */
.text-slate-900 {
  color: #0f172a;
  letter-spacing: -0.5px;
}
.brand-image-wrapper {
  position: relative;
  display: inline-flex;
}

.hero-image {
  /* Легкое парение и тень */
  filter: drop-shadow(0 10px 20px rgba(139, 92, 246, 0.3));
  animation: floatHero 4s ease-in-out infinite;
  z-index: 2;
}

.brand-glow-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  /* Градиент из фиолетового в оранжевый под картинку */
  background: radial-gradient(circle, rgba(255, 165, 0, 0.4) 0%, rgba(139, 92, 246, 0) 70%);
  filter: blur(20px);
  z-index: 1;
}

@keyframes floatHero {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
</style> 
