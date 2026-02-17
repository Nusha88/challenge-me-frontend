<template>
  <v-container fluid class="pa-0 fill-height login-wrapper">
    <v-row no-gutters class="fill-height">

      <v-col cols="12" md="6" class="form-section d-flex align-center justify-center">
        <div class="form-wrapper pa-6 pa-md-12 w-100" style="max-width: 550px;">

          <div class="text-center mb-10 reveal-item">
            <div class="brand-image-wrapper mb-4">
              <v-img
                  :src="swardImage"
                  width="100"
                  height="100"
                  class="mx-auto hero-image"
              ></v-img>
              <div class="brand-glow-effect"></div>
            </div>
            <h2 class="text-h3 font-weight-bold text-slate-900 mb-2">{{ t('auth.loginPageTitle') }}</h2>
            <p class="text-body-1 text-grey-darken-1">Enter your credentials to continue</p>
          </div>

          <v-form @submit.prevent="handleLogin" class="reveal-item">
            <v-text-field
                v-model="formData.email"
                :label="t('auth.email')"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                rounded="xl"
                class="mb-4 custom-field"
                :error-messages="errors.email"
            ></v-text-field>

            <v-text-field
                v-model="formData.password"
                :label="t('auth.password')"
                type="password"
                prepend-inner-icon="mdi-lock-outline"
                variant="outlined"
                rounded="xl"
                class="mb-2 custom-field"
                :error-messages="errors.password"
            ></v-text-field>

            <div class="d-flex justify-end mb-6">
              <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">
                {{ t('auth.forgotPassword') }}
              </a>
            </div>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-6 rounded-xl">
              {{ error }}
            </v-alert>

            <v-btn
                type="submit"
                block
                height="56"
                :loading="loading"
                :disabled="loading"
                class="hero-gradient-btn"
            >
              <span class="text-body-1 font-weight-bold uppercase tracking-wider">{{ t('auth.submitLogin') }}</span>
              <v-icon end class="ml-2">mdi-arrow-right</v-icon>
            </v-btn>
          </v-form>

          <div class="text-center mt-10">
            <p class="text-grey-darken-1">
              Don't have an account?
              <v-btn variant="text" @click="router.push('/register')" class="text-primary font-weight-black px-1">
                Sign Up
              </v-btn>
            </p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="motivation-section d-none d-md-flex align-center justify-center" :style="{ backgroundImage: `url(${registerBgImage})` }">
        <div class="particles-container">
          <div
              v-for="(p, i) in particles"
              :key="i"
              class="particle"
              :style="p.style"
          ></div>
        </div>

        <div class="motivation-content pa-12 reveal-item">
          <v-chip color="rgba(255,255,255,0.2)" text-color="white" class="mb-4 glass-chip">
            ⚔️ {{ t('auth.welcomeBack') }}
          </v-chip>
          <h1 class="text-h2 font-weight-black text-white mb-6 leading-tight">
            Resume Your Saga.<br/>
            <span class="text-gradient-gold">Continue the Journey.</span>
          </h1>
          <p class="text-h6 text-white opacity-80 mb-8 font-weight-regular">
            {{ t('auth.loginDescription') }}
          </p>
        </div>
      </v-col>
    </v-row>

    <SuccessDialog
        v-model="showSuccess"
        :title="t('auth.successLogin')"
        :message="t('auth.successLoginBody')"
        :button-text="t('common.ok')"
        @close="closeSuccessModal"
    />
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/api'
import { useI18n } from 'vue-i18n'
import SuccessDialog from './SuccessDialog.vue'
import registerBgImage from '../assets/register.png'
import swardImage from '../assets/sward.png'

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
    // Show success dialog - don't dispatch auth-changed yet to prevent sidebar from showing
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

function closeSuccessModal() {
  showSuccess.value = false
  // Dispatch auth-changed event to update layout (show sidebar)
  window.dispatchEvent(new Event('auth-changed'))
  // Use replace instead of push to remove login page from history
  // This ensures the user can't go back to the login page
  router.replace('/')
}
</script>

<style scoped>
.login-wrapper {
  background: white;
  min-height: 80vh;
}

/* Правая секция с фоном */
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

.text-gradient-gold {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Кристалл и свечение */
.brand-image-wrapper {
  position: relative;
  display: inline-block;
}

.hero-image {
  filter: drop-shadow(0 10px 20px rgba(139, 92, 246, 0.4));
  animation: floatCrystal 4s ease-in-out infinite;
  z-index: 2;
}

.brand-glow-effect {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 100px; height: 100px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%);
  filter: blur(20px);
  z-index: 1;
}

@keyframes floatCrystal {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

/* Поля ввода и кнопки */
.custom-field :deep(.v-field) {
  border-radius: 16px !important;
  background: #f8fafc !important;
}

.hero-gradient-btn {
  background: linear-gradient(135deg, #7E46C4 0%, #F4A782 100%) !important;
  border-radius: 16px !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  box-shadow: 0 10px 25px rgba(126, 70, 196, 0.4) !important;
  color: white !important;
  transition: all 0.3s ease !important;
}

.hero-gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(126, 70, 196, 0.6) !important;
}

.hero-gradient-btn:disabled {
  opacity: 0.6;
}

.forgot-link {
  text-decoration: none;
  font-weight: 600;
  color: #6366f1;
  font-size: 0.9rem;
}

/* Анимация появления */
.reveal-item {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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
</style>
