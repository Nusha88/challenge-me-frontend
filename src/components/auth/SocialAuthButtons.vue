<template>
  <div v-if="google || telegram" class="social-auth">
    <div class="social-auth-actions">
      <v-btn
        v-if="google && mode !== 'link'"
        type="button"
        variant="outlined"
        block
        height="44"
        class="social-auth-btn"
        :aria-label="t('auth.continueWithGoogle')"
        :loading="loading === 'google'"
        :disabled="Boolean(loading)"
        @click="startGoogle"
      >
        <v-icon start size="18">mdi-google</v-icon>
        <span class="social-auth-label-full">{{ t('auth.continueWithGoogle') }}</span>
        <span class="social-auth-label-short">Google</span>
      </v-btn>

      <v-btn
        v-if="telegram"
        type="button"
        variant="outlined"
        block
        height="44"
        class="social-auth-btn social-auth-btn--telegram"
        :aria-label="mode === 'link' ? t('auth.linkTelegram') : t('auth.continueWithTelegram')"
        :loading="loading === 'telegram'"
        :disabled="Boolean(loading)"
        @click="startTelegram"
      >
        <v-icon start size="18">mdi-send</v-icon>
        <span class="social-auth-label-full">{{ mode === 'link' ? t('auth.linkTelegram') : t('auth.continueWithTelegram') }}</span>
        <span class="social-auth-label-short">Telegram</span>
      </v-btn>
    </div>

    <div v-if="mode !== 'link'" class="social-auth-divider">
      <span>{{ t('auth.orWithEmail') }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authService } from '../../services/api'
import { useDemoStore } from '../../stores/demo'
import { getAuthErrorMessage } from '../../utils/authErrorMessage'
import { useSocialAuthSession } from '../../composables/useSocialAuthSession'

const props = defineProps({
  mode: { type: String, default: 'login' },
  referralCode: { type: String, default: '' },
  redirect: { type: String, default: '' }
})

const emit = defineEmits(['error', 'linked', 'authenticated'])

const { t } = useI18n()
const route = useRoute()
const demoStore = useDemoStore()
const { finishSocialAuth } = useSocialAuthSession()

const google = ref(false)
const telegram = ref(false)
const telegramBotId = ref(null)
const loading = ref('')

onMounted(async () => {
  try {
    const { data } = await authService.getProviders()
    google.value = Boolean(data?.google)
    telegram.value = Boolean(data?.telegram && data?.telegramBotId)
    telegramBotId.value = data?.telegramBotId || null
  } catch {
    google.value = false
    telegram.value = false
  }
})

function resolveRedirect() {
  if (props.redirect) return props.redirect
  const target = route.query.redirect
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
    return target
  }
  return '/today'
}

function startGoogle() {
  loading.value = 'google'
  window.location.href = authService.googleStartUrl({
    referralCode: props.referralCode,
    redirect: resolveRedirect(),
    demo: demoStore.isDemoMode
  })
}

function loadTelegramScript() {
  if (window.Telegram?.Login?.auth) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-telegram-widget]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('telegram_script')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.dataset.telegramWidget = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('telegram_script'))
    document.head.appendChild(script)
  })
}

async function startTelegram() {
  loading.value = 'telegram'
  try {
    await loadTelegramScript()
    if (!window.Telegram?.Login?.auth || !telegramBotId.value) {
      throw new Error('telegram_unavailable')
    }

    window.Telegram.Login.auth(
      { bot_id: Number(telegramBotId.value), request_access: true },
      async (user) => {
        if (!user) {
          loading.value = ''
          return
        }
        try {
          const payload = { ...user, referralCode: props.referralCode, redirect: resolveRedirect() }
          const { data } = await authService.loginTelegram(payload)
          if (props.mode === 'link' || data.linked) {
            emit('linked', data.user)
            loading.value = ''
            return
          }
          await finishSocialAuth({
            token: data.token,
            user: data.user,
            isNew: Boolean(data.isNew),
            redirect: data.redirect || resolveRedirect()
          })
          emit('authenticated', data)
        } catch (error) {
          emit(
            'error',
            getAuthErrorMessage(error.response?.data?.message, t, 'auth.socialFailed')
          )
          loading.value = ''
        }
      }
    )
  } catch {
    emit('error', t('auth.telegramUnavailable'))
    loading.value = ''
  }
}
</script>

<style scoped>
.social-auth {
  margin-bottom: 8px;
}

.social-auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 22px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.social-auth-divider::before,
.social-auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.social-auth-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.social-auth-label-short {
  display: none;
}

.social-auth-btn {
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  border-radius: 16px !important;
  color: #f1f5f9 !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.01em;
}

.social-auth-btn:hover {
  border-color: rgba(79, 209, 197, 0.55) !important;
  background: rgba(79, 209, 197, 0.08) !important;
}

.social-auth-btn--telegram:hover {
  border-color: rgba(56, 167, 222, 0.65) !important;
  background: rgba(56, 167, 222, 0.1) !important;
}

@media (max-width: 959px) {
  .social-auth {
    margin-bottom: 2px;
  }

  .social-auth-actions {
    flex-direction: row;
    gap: 8px;
  }

  .social-auth-btn {
    flex: 1;
    min-width: 0;
    height: 42px !important;
    font-size: 0.82rem !important;
  }

  .social-auth-label-full {
    display: none;
  }

  .social-auth-label-short {
    display: inline;
  }

  .social-auth-divider {
    margin: 8px 0 10px;
    font-size: 0.7rem;
  }
}
</style>
