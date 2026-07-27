<template>
  <section class="settings-panel">
    <h3 class="section-title">
      <v-icon start color="#4FD1C5" size="22">mdi-cog-outline</v-icon>
      {{ t('profile.settings') }}
    </h3>

    <div class="setting-row">
      <span class="setting-label">{{ t('navigation.language') }}</span>
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="outlined"
            color="#4FD1C5"
            size="small"
            append-icon="mdi-chevron-down"
            class="rounded-lg"
          >
            {{ currentLocaleLabel }}
          </v-btn>
        </template>
        <v-list density="compact" class="locale-menu" bg-color="#161b28">
          <v-list-item
            v-for="lang in availableLocales"
            :key="lang.code"
            :active="currentLocale === lang.code"
            base-color="#f1f5f9"
            @click="changeLanguage(lang.code)"
          >
            <v-list-item-title class="locale-menu-title">{{ lang.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div class="setting-row">
      <div class="setting-copy">
        <span class="setting-label">{{ t('profile.pushNotifications') }}</span>
        <span class="setting-hint">
          <template v-if="pushNotificationStatus === 'denied'">
            {{ t('profile.pushNotificationsDeniedInstructions') }}
          </template>
          <template v-else-if="pushNotificationStatus === 'unsupported'">
            {{ t('profile.pushNotificationsUnsupported') }}
          </template>
          <template v-else>
            {{ t('profile.pushNotificationsHint') }}
          </template>
        </span>
      </div>
      <v-switch
        :model-value="isPushSubscribed"
        color="#4FD1C5"
        hide-details
        :disabled="isPushToggleDisabled"
        :loading="subscribingToPush"
        @update:model-value="handlePushNotificationsToggle"
      />
    </div>

    <div v-if="isIosDevice" class="setting-row">
      <div class="setting-copy">
        <span class="setting-label">{{ t('profile.installApp') }}</span>
        <span class="setting-hint">{{ t('profile.installAppHint') }}</span>
      </div>
      <v-btn
        variant="outlined"
        color="#4FD1C5"
        size="small"
        prepend-icon="mdi-cellphone-arrow-down"
        class="rounded-lg"
        @click="installInstructionOpen = true"
      >
        {{ t('profile.installAppButton') }}
      </v-btn>
    </div>

    <div class="setting-row">
      <div class="setting-copy">
        <span class="setting-label">{{ t('profile.dailyRecap') }}</span>
        <span class="setting-hint">{{ t('profile.dailyRecapHint') }}</span>
        <div v-if="dailyRecapEnabled" class="recap-time-row">
          <label class="recap-time-label" for="daily-recap-time">
            {{ t('profile.dailyRecapTime') }}
          </label>
          <div
            class="recap-time-control"
            :class="{ 'is-disabled': dailyRecapSaving }"
            @click="openRecapTimePicker"
          >
            <v-icon size="18" color="#4FD1C5" class="recap-time-icon">mdi-clock-outline</v-icon>
            <input
              id="daily-recap-time"
              ref="recapTimeInputRef"
              v-model="dailyRecapTime"
              type="time"
              class="recap-time-native"
              :disabled="dailyRecapSaving"
              @click.stop
            />
          </div>
          <v-btn
            variant="flat"
            color="#4FD1C5"
            size="small"
            class="recap-save-btn text-none"
            :loading="dailyRecapSaving"
            @click="saveDailyRecapSettings"
          >
            {{ t('profile.dailyRecapSave') }}
          </v-btn>
        </div>
      </div>
      <v-switch
        :model-value="dailyRecapEnabled"
        color="#4FD1C5"
        hide-details
        :disabled="dailyRecapSaving"
        @update:model-value="handleDailyRecapToggle"
      />
    </div>

    <div class="setting-row">
      <div class="setting-copy">
        <span class="setting-label">{{ t('profile.weeklyChronicle') }}</span>
        <span class="setting-hint">{{ t('profile.weeklyChronicleHint') }}</span>
      </div>
      <v-switch
        :model-value="weeklyChronicleEnabled"
        color="#4FD1C5"
        hide-details
        :disabled="weeklyChronicleSaving"
        @update:model-value="handleWeeklyChronicleToggle"
      />
    </div>

    <v-alert
      v-for="alert in statusAlerts"
      :key="alert.key"
      :type="alert.type"
      variant="tonal"
      density="compact"
      class="mt-2"
      closable
      @click:close="alert.clear()"
    >
      {{ alert.message }}
    </v-alert>

    <InstallAppInstructionModal v-model="installInstructionOpen" />
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../../i18n'
import { userService, pushService } from '../../services/api'
import {
  getNotificationPermission,
  requestAndSubscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribedToPushNotifications
} from '../../utils/pushNotifications'
import InstallAppInstructionModal from '../InstallAppInstructionModal.vue'

const { t, locale } = useI18n()
const availableLocales = SUPPORTED_LOCALES

const currentLocale = computed(() => locale.value)
const currentLocaleLabel = computed(
  () => availableLocales.find((lang) => lang.code === locale.value)?.label || locale.value
)

const subscribingToPush = ref(false)
const pushNotificationStatus = ref('default')
const isPushSubscribed = ref(false)
const pushNotificationError = ref('')
const pushNotificationSuccess = ref('')
const dailyRecapEnabled = ref(false)
const dailyRecapTime = ref('20:00')
const dailyRecapSaving = ref(false)
const dailyRecapError = ref('')
const dailyRecapSuccess = ref('')
const weeklyChronicleEnabled = ref(false)
const weeklyChronicleSaving = ref(false)
const weeklyChronicleError = ref('')
const weeklyChronicleSuccess = ref('')
const installInstructionOpen = ref(false)
const recapTimeInputRef = ref(null)

function openRecapTimePicker() {
  if (dailyRecapSaving.value) return
  const input = recapTimeInputRef.value
  if (!input) return
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
      return
    } catch {
      // Fall through to focus/click for older browsers
    }
  }
  input.focus()
  input.click()
}

const isIosDevice = computed(() => {
  if (typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent || ''
  const platform = navigator.platform || ''
  const isClassicIos = /iPad|iPhone|iPod/.test(userAgent)
  const isModernIpadOs = platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1
  return isClassicIos || isModernIpadOs
})

const isPushToggleDisabled = computed(
  () =>
    subscribingToPush.value ||
    pushNotificationStatus.value === 'denied' ||
    pushNotificationStatus.value === 'unsupported'
)

const statusAlerts = computed(() => {
  const alerts = []
  if (weeklyChronicleError.value) {
    alerts.push({
      key: 'wc-err',
      type: 'error',
      message: weeklyChronicleError.value,
      clear: () => { weeklyChronicleError.value = '' }
    })
  }
  if (weeklyChronicleSuccess.value) {
    alerts.push({
      key: 'wc-ok',
      type: 'success',
      message: weeklyChronicleSuccess.value,
      clear: () => { weeklyChronicleSuccess.value = '' }
    })
  }
  if (pushNotificationError.value) {
    alerts.push({
      key: 'push-err',
      type: 'error',
      message: pushNotificationError.value,
      clear: () => { pushNotificationError.value = '' }
    })
  }
  if (pushNotificationSuccess.value) {
    alerts.push({
      key: 'push-ok',
      type: 'success',
      message: pushNotificationSuccess.value,
      clear: () => { pushNotificationSuccess.value = '' }
    })
  }
  if (dailyRecapError.value) {
    alerts.push({
      key: 'dr-err',
      type: 'error',
      message: dailyRecapError.value,
      clear: () => { dailyRecapError.value = '' }
    })
  }
  if (dailyRecapSuccess.value) {
    alerts.push({
      key: 'dr-ok',
      type: 'success',
      message: dailyRecapSuccess.value,
      clear: () => { dailyRecapSuccess.value = '' }
    })
  }
  return alerts
})

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function getRecapLanguageCode() {
  return String(locale.value || 'en').startsWith('ru') ? 'ru' : 'en'
}

function changeLanguage(code) {
  setLocale(code)
  syncPreferredLanguage()
}

async function syncPreferredLanguage() {
  try {
    await userService.updatePreferredLanguage(getRecapLanguageCode())
  } catch {
    // Non-blocking
  }
}

async function loadDailyRecapSettings() {
  dailyRecapError.value = ''
  try {
    const response = await pushService.getDailyRecapSettings()
    dailyRecapEnabled.value = !!response.data?.dailyRecapEnabled
    dailyRecapTime.value = response.data?.dailyRecapTime || '20:00'
  } catch {
    dailyRecapError.value = t('profile.dailyRecapError')
  }
}

async function saveDailyRecapSettings() {
  dailyRecapSaving.value = true
  dailyRecapError.value = ''
  dailyRecapSuccess.value = ''
  try {
    await pushService.updateDailyRecapSettings({
      dailyRecapEnabled: !!dailyRecapEnabled.value,
      dailyRecapTime: dailyRecapTime.value || '20:00',
      dailyRecapTimezone: getBrowserTimezone(),
      dailyRecapLanguage: getRecapLanguageCode()
    })
    dailyRecapSuccess.value = t('profile.dailyRecapSaved')
  } catch {
    dailyRecapError.value = t('profile.dailyRecapError')
  } finally {
    dailyRecapSaving.value = false
  }
}

async function handleDailyRecapToggle(value) {
  dailyRecapEnabled.value = !!value
  await saveDailyRecapSettings()
}

async function loadWeeklyChronicleSettings() {
  weeklyChronicleError.value = ''
  try {
    const response = await userService.getWeeklyChronicleSettings()
    weeklyChronicleEnabled.value = !!response.data?.weeklyChronicleEmailEnabled
  } catch {
    weeklyChronicleError.value = t('profile.weeklyChronicleError')
  }
}

async function saveWeeklyChronicleSettings() {
  weeklyChronicleSaving.value = true
  weeklyChronicleError.value = ''
  weeklyChronicleSuccess.value = ''
  try {
    await userService.updateWeeklyChronicleSettings({
      weeklyChronicleEmailEnabled: !!weeklyChronicleEnabled.value,
      language: getRecapLanguageCode()
    })
    weeklyChronicleSuccess.value = t('profile.weeklyChronicleSaved')
  } catch {
    weeklyChronicleError.value = t('profile.weeklyChronicleError')
  } finally {
    weeklyChronicleSaving.value = false
  }
}

async function handleWeeklyChronicleToggle(value) {
  weeklyChronicleEnabled.value = !!value
  await saveWeeklyChronicleSettings()
}

async function checkPushNotificationStatus() {
  try {
    pushNotificationStatus.value = getNotificationPermission()
    if (pushNotificationStatus.value === 'granted') {
      try {
        const browserHasSubscription = await isSubscribedToPushNotifications()
        if (browserHasSubscription) {
          try {
            const statusResponse = await pushService.getStatus()
            isPushSubscribed.value = !!statusResponse.data.hasSubscription
          } catch {
            isPushSubscribed.value = browserHasSubscription
          }
        } else {
          isPushSubscribed.value = false
        }
      } catch {
        isPushSubscribed.value = false
      }
    } else {
      isPushSubscribed.value = false
    }
  } catch {
    // ignore
  }
}

async function handlePushNotificationsToggle(enabled) {
  if (isPushToggleDisabled.value) return

  const previousValue = isPushSubscribed.value
  isPushSubscribed.value = !!enabled
  subscribingToPush.value = true
  pushNotificationError.value = ''
  pushNotificationSuccess.value = ''

  try {
    if (enabled) {
      const result = await requestAndSubscribeToPushNotifications()
      if (result.success) {
        pushNotificationSuccess.value = t('profile.pushNotificationsEnabledSuccess')
      } else if (result.reason === 'permission-denied') {
        isPushSubscribed.value = previousValue
        pushNotificationError.value = t('profile.pushNotificationsPermissionDenied')
      } else if (result.reason === 'error' && result.error) {
        isPushSubscribed.value = previousValue
        pushNotificationError.value = result.error
      } else {
        isPushSubscribed.value = previousValue
        pushNotificationError.value = t('profile.pushNotificationsEnableError')
      }
    } else {
      const result = await unsubscribeFromPushNotifications()
      if (result.success) {
        pushNotificationSuccess.value = t('profile.pushNotificationsDisabledSuccess')
      } else if (result.reason === 'error' && result.error) {
        isPushSubscribed.value = previousValue
        pushNotificationError.value = result.error
      } else {
        isPushSubscribed.value = previousValue
        pushNotificationError.value = t('profile.pushNotificationsDisableError')
      }
    }
    await checkPushNotificationStatus()
  } catch (error) {
    isPushSubscribed.value = previousValue
    pushNotificationError.value =
      error?.message ||
      (enabled
        ? t('profile.pushNotificationsEnableError')
        : t('profile.pushNotificationsDisableError'))
    await checkPushNotificationStatus()
  } finally {
    subscribingToPush.value = false
  }
}

onMounted(() => {
  checkPushNotificationStatus()
  loadDailyRecapSettings()
  loadWeeklyChronicleSettings()
  syncPreferredLanguage()
})
</script>

<style scoped>
.settings-panel {
  margin-bottom: clamp(20px, 3vw, 32px);
  padding: 20px 22px;
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--home-radius, 16px);
}

.section-title {
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.06));
}

.setting-row:last-of-type {
  border-bottom: none;
}

.setting-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--home-text, #f1f5f9);
}

.setting-hint {
  font-size: 0.75rem;
  color: var(--home-text-dim, #94a3b8);
  line-height: 1.4;
}

.recap-time-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.recap-time-label {
  width: 100%;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--home-text-dim, #94a3b8);
}

.recap-time-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  transition: border-color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}

.recap-time-control.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.recap-time-control:focus-within,
.recap-time-control:hover:not(.is-disabled) {
  border-color: rgba(79, 209, 197, 0.45);
  background: rgba(79, 209, 197, 0.08);
}

.recap-time-icon {
  flex-shrink: 0;
  pointer-events: none;
}

.recap-time-native {
  appearance: none;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--home-text, #f1f5f9);
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  line-height: 1;
  min-width: 4.75rem;
  color-scheme: dark;
  cursor: pointer;
}

.recap-time-native:disabled {
  cursor: not-allowed;
}

/* Hide the browser’s native black clock; our teal icon opens the picker. */
.recap-time-native::-webkit-calendar-picker-indicator {
  display: none;
  -webkit-appearance: none;
}

.recap-time-native::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}

.recap-time-native::-webkit-datetime-edit-hour-field,
.recap-time-native::-webkit-datetime-edit-minute-field,
.recap-time-native::-webkit-datetime-edit-ampm-field {
  color: var(--home-text, #f1f5f9);
}

.recap-save-btn {
  font-weight: 700 !important;
  color: #0b0d12 !important;
}

.locale-menu {
  background: #161b28 !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.locale-menu :deep(.v-list-item-title),
.locale-menu-title {
  color: #f1f5f9 !important;
}

.locale-menu :deep(.v-list-item--active) {
  background: rgba(79, 209, 197, 0.12) !important;
}
</style>
