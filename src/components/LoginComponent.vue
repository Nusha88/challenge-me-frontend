
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

<template>
  <v-container fluid class="pa-0 fill-height login-wrapper">
    <v-row no-gutters class="fill-height">
      
      <v-col cols="12" md="6" class="form-section d-flex align-center justify-center pa-6">
        <div class="form-wrapper glass-card pa-8 pa-md-12 w-100 reveal-item" style="max-width: 500px;">
          
          <div class="text-center mb-8">
            <div class="brand-image-wrapper mb-4">
              <v-img
                  :src="swardImage"
                  width="100"
                  height="100"
                  class="mx-auto hero-image"
              ></v-img>
              <div class="brand-glow-effect"></div>
            </div>
            <h2 class="text-h3 font-weight-bold text-white mb-2">{{ t('auth.loginPageTitle') }}</h2>
            <p class="text-body-1 text-slate-400">Enter your credentials to continue</p>
          </div>

          <v-form @submit.prevent="handleLogin">
            <v-text-field
                v-model="formData.email"
                :label="t('auth.email')"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                rounded="xl"
                class="mb-4 custom-field"
                :error-messages="errors.email"
                color="primary"
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
                color="primary"
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

          <div class="text-center mt-8">
            <p class="text-slate-400">
              Don't have an account?
              <v-btn variant="text" @click="router.push('/register')" class="signup-text-btn px-1">
                Sign Up
              </v-btn>
            </p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="motivation-section d-none d-md-flex pa-6">
        <div 
          class="motivation-card w-100 h-100 d-flex align-center justify-center"
          :style="{ backgroundImage: `url(${registerBgImage})` }"
        >
          <div class="motivation-overlay"></div>
          
          <div class="particles-container">
            <div v-for="(p, i) in particles" :key="i" class="particle" :style="p.style"></div>
          </div>

          <div class="motivation-content pa-12 reveal-item text-center">
            <v-chip variant="outlined" class="mb-4 glass-chip text-white">
              ⚔️ {{ t('auth.welcomeBack') }}
            </v-chip>
            <h1 class="text-h2 font-weight-black text-white mb-6 leading-tight">
              Resume Your Saga.<br/>
              <span class="text-gradient-gold">Continue the Journey.</span>
            </h1>
            <p class="text-h6 text-slate-300 mb-8 font-weight-regular" style="max-width: 600px;">
              {{ t('auth.loginDescription') }}
            </p>
          </div>
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

<style scoped>
.login-wrapper {
  /* Фон берется из App.vue, тут оставляем прозрачность */
  background: transparent;
  min-height: 100vh;
}

/* Эффект стекла для формы */
.glass-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 32px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

/* Кастомизация полей ввода под темную тему */
.custom-field :deep(.v-field) {
  background: rgba(0, 0, 0, 0.2) !important; /* Темный фон поля */
  border-radius: 16px !important;
  transition: all 0.3s ease;
}

.custom-field :deep(.v-field__outline) {
  color: rgba(255, 255, 255, 0.1) !important; /* Цвет рамки */
}

.custom-field :deep(.v-label), 
.custom-field :deep(.v-field__prepend-inner) {
  color: #94A3B8 !important; /* Slate-400 */
}

.custom-field :deep(input) {
  color: #FFFFFF !important; /* Белый текст при вводе */
}

.custom-field :deep(.v-field--focused .v-field__outline) {
  color: #8B5CF6 !important; /* Фиолетовый при фокусе */
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
}

/* Кнопки и ссылки */
.hero-gradient-btn {
  background: linear-gradient(135deg, #7048E8 0%, #4FD1C5 100%) !important;
  border-radius: 16px !important;
  text-transform: none !important;
  box-shadow: 0 10px 25px rgba(112, 72, 232, 0.3) !important;
  color: white !important;
}

.forgot-link {
  text-decoration: none;
  font-weight: 600;
  color: #A78BFA; /* Светло-фиолетовый */
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #FFFFFF;
}

.signup-text-btn {
  color: #4FD1C5 !important; /* Turquoise accent from gradient */
  font-weight: 800 !important;
  text-transform: none;
}

.motivation-section {
  background: transparent; /* Важно: фон теперь у внутренней карточки */
}

.motivation-card {
  position: relative;
  background-size: cover;
  background-position: center;
  border-radius: 40px; /* Скругляем саму картинку */
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.motivation-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  /* Градиент от темного к прозрачному, чтобы "сшить" с левой частью */
  background: linear-gradient(
    to right, 
    rgba(11, 13, 18, 0.8) 0%, 
    rgba(11, 13, 18, 0.4) 50%,
    rgba(30, 41, 59, 0.2) 100%
  );
  z-index: 1;
}

.motivation-content {
  position: relative;
  z-index: 2;
}

.text-gradient-gold {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-chip {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Анимации из оригинала */
.hero-image {
  filter: drop-shadow(0 10px 30px rgba(139, 92, 246, 0.5));
  animation: floatCrystal 4s ease-in-out infinite;
}

@keyframes floatCrystal {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.reveal-item {
  animation: fadeIn 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
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
  100% { transform: translateY(-100vh) translateX(20vw); opacity: 0; }
}
/* Цвет для "Enter your credentials" и "Don't have an account?" */
.text-slate-400 {
  color: rgba(255, 255, 255, 0.6) !important; /* Мягкий белый вместо черного */
  font-weight: 400;
}

/* Цвет кнопки Sign Up, чтобы она не сливалась */
.signup-text-btn {
  color: #4FD1C5 !important; /* Turquoise accent from gradient */
  font-weight: 800 !important;
  text-transform: none !important;
  letter-spacing: 0.5px;
}

.signup-text-btn:hover {
  text-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
}

/* Дополнительно убедимся, что основной заголовок белый */
h2.text-h3 {
  color: #FFFFFF !important;
}
.forgot-link {
  color: rgba(255, 255, 255, 0.6) !important;
  text-decoration: none;
  font-size: 0.875rem;
  padding: 4px 8px; /* Немного места для клика */
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: transparent !important; /* Принудительно убираем любой фон */
}

.forgot-link:hover {
  color: #7048E8 !important; /* Цвет при наведении */
  background-color: rgba(112, 72, 232, 0.1) !important; /* Вместо зеленого — очень слабый фиолетовый отблеск */
  text-decoration: underline;
}

/* На всякий случай убираем активное состояние (нажатие) */
.forgot-link:active, 
.forgot-link:focus {
  background-color: transparent !important;
  outline: none !important;
}
/* Делаем описание в правой части светлым */
.motivation-content p {
  color: rgba(255, 255, 255, 0.7) !important; /* Светло-серый, приятный для глаз */
}

/* На всякий случай точечно для этого текста */
.text-slate-300 {
  color: #cbd5e1 !important; /* Мягкий стальной цвет */
}
/* Базовый стиль кнопки (убедись, что класс совпадает с тем, что в HTML) */
/* Кнопки и ссылки */
.hero-gradient-btn {
  background: linear-gradient(135deg, #7048E8 0%, #4FD1C5 100%) !important;
  border-radius: 16px !important;
  text-transform: none !important;
  box-shadow: 0 10px 25px rgba(112, 72, 232, 0.3) !important;
  color: white !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  position: relative;
  overflow: hidden;
}

.hero-gradient-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(112, 72, 232, 0.6) !important;
  filter: brightness(1.1);
}

.hero-gradient-btn:active {
  transform: translateY(1px);
  filter: brightness(0.9);
}

.hero-gradient-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: 0.5s;
}

.hero-gradient-btn:hover::after {
  left: 100%;
}

.hero-gradient-btn:disabled {
  opacity: 0.6;
}
/* Стили для алерта об ошибке */
.v-alert {
  background: rgba(255, 50, 50, 0.1) !important; /* Очень прозрачный красный */
  border: 1px solid rgba(255, 50, 50, 0.3) !important; /* Тонкая светящаяся рамка */
  border-radius: 12px !important;
  color: #ff8a8a !important; /* Нежно-красный текст, который лучше читается на темном */
  backdrop-filter: blur(10px);
  box-shadow: 0 0 15px rgba(255, 50, 50, 0.1); /* Легкое красное эхо вокруг */
}

/* Если ты используешь стандартный error-messages у v-text-field */
.custom-field :deep(.v-messages__message) {
  color: #ff8a8a !important;
  font-weight: 500;
  padding-top: 4px;
  text-shadow: 0 0 8px rgba(255, 50, 50, 0.3);
}

/* Красная рамка у самого поля при ошибке */
.custom-field.v-input--error :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: #ff5252 !important;
  filter: drop-shadow(0 0 5px rgba(255, 82, 82, 0.2));
}
</style>