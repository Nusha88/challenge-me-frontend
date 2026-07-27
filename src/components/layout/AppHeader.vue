<template>
  <v-app-bar class="app-bar-custom" elevation="0" :fixed="isMobileHeader">
    <div class="header-content-wrapper" :class="{ 'header-content-wrapper--guest': !isLoggedIn }">
      <div class="header-section header-left">
        <v-app-bar-nav-icon
          v-if="isLoggedIn"
          class="d-md-none"
          @click="$emit('toggle-drawer')"
        ></v-app-bar-nav-icon>
        <StreakBadge
          :visible="isLoggedIn && showStreak"
          :display-streak-days="displayStreakDays"
          :yesterday-streak-days="yesterdayStreakDays"
          :has-today-completed-tasks="hasTodayCompletedTasks"
          :streak-days-text="streakDaysText"
        />
      </div>

      <div class="header-section header-center">
        <div class="brand-group">
          <router-link
            to="/"
            class="brand-link"
          >
            <img
              :src="brandLogo"
              alt="Ignite"
              class="brand-logo"
              width="40"
              height="40"
              decoding="async"
            />
          </router-link>
          <button
            v-if="isLoggedIn"
            type="button"
            class="sparks-container"
            :aria-label="t('navigation.sparksInfoAriaLabel')"
            @click="sparksInfoOpen = true"
          >
            <span class="sparks-icon">✦</span>
            <span class="sparks-count" :class="sparksCountClass">{{ userSparks }}</span>
            <span v-if="spentDelta" class="sparks-spent-delta">{{ spentDelta }}</span>
            <span v-if="gainedDelta" class="sparks-gained-delta">{{ gainedDelta }}</span>
          </button>
        </div>
      </div>

      <div class="header-section header-right">
        <v-menu v-if="!isLoggedIn" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="text"
              size="small"
              class="language-button"
              :aria-label="t('navigation.language')"
            >
              <v-icon size="18">mdi-translate</v-icon>
              <span class="language-code">{{ locale.toUpperCase() }}</span>
            </v-btn>
          </template>
          <v-list density="compact" class="language-list">
            <v-list-item
              v-for="option in SUPPORTED_LOCALES"
              :key="option.code"
              :active="option.code === locale"
              @click="setLocale(option.code)"
            >
              <v-list-item-title>{{ option.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          v-if="!isLoggedIn && route.path !== '/login'"
          to="/login"
          variant="text"
          class="login-button"
        >
          {{ t('navigation.login') }}
        </v-btn>
        <v-btn
          v-if="!isLoggedIn && route.path !== '/register'"
          to="/register"
          variant="flat"
          class="sign-up-button"
        >
          {{ t('navigation.register') }}
        </v-btn>
        <v-btn
          v-if="isLoggedIn"
          to="/missions/add"
          variant="elevated"
          size="large"
          class="mr-2 app-cta-primary d-none d-md-inline-flex start-mission-btn"
        >
          <template #prepend>
            <v-icon>mdi-rocket-launch-outline</v-icon>
          </template>
          {{ t('navigation.addChallenge') }}
        </v-btn>
        <v-btn
          v-if="isLoggedIn"
          variant="text"
          class="mr-2 notification-button"
          @click="$emit('open-notifications')"
        >
          <v-icon>mdi-bell</v-icon>
          <v-badge
            v-if="unreadCount > 0"
            :content="unreadCount > 99 ? '99+' : unreadCount"
            color="error"
            overlap
            class="notification-badge"
          ></v-badge>
        </v-btn>
      </div>
    </div>

    <SparksInfoDialog
      v-model="sparksInfoOpen"
      :balance="userSparks"
    />
  </v-app-bar>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useUserStore } from '../../stores/user'
import { setLocale, SUPPORTED_LOCALES } from '../../i18n'
import { APP_EVENTS, addAppEventListener, removeAppEventListener } from '../../utils/appEvents'
import brandLogo from '../../assets/landing/brand-256.webp'
import StreakBadge from './StreakBadge.vue'
import SparksInfoDialog from './SparksInfoDialog.vue'

defineProps({
  isLoggedIn: { type: Boolean, default: false },
  unreadCount: { type: Number, default: 0 },
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  streakDaysText: { type: String, default: '' },
  showStreak: { type: Boolean, default: false }
})

defineEmits(['toggle-drawer', 'open-notifications'])

const route = useRoute()
const { t, locale } = useI18n()
const { mdAndUp } = useDisplay()
const userStore = useUserStore()
const userSparks = computed(() => userStore.userSparks)
const sparksInfoOpen = ref(false)
const sparksSpentAnimating = ref(false)
const sparksGainedAnimating = ref(false)
const spentDelta = ref('')
const gainedDelta = ref('')

/** Below md: fixed bar so Vuetify reserves top space on v-main. */
const isMobileHeader = computed(() => !mdAndUp.value)
const sparksCountClass = computed(() => ({
  'sparks-count--spent': sparksSpentAnimating.value,
  'sparks-count--gained': sparksGainedAnimating.value
}))

function handleSparksSpent(event) {
  const spent = Number(event?.detail?.spent || 0)
  if (!spent) return

  gainedDelta.value = ''
  spentDelta.value = `−${spent}`
  sparksGainedAnimating.value = false
  sparksSpentAnimating.value = true

  window.setTimeout(() => {
    sparksSpentAnimating.value = false
    spentDelta.value = ''
  }, 800)
}

function handleSparksAwarded(event) {
  const gained = Number(event?.detail?.gained || 0)
  if (!gained) return

  spentDelta.value = ''
  gainedDelta.value = `+${gained}`
  sparksSpentAnimating.value = false
  sparksGainedAnimating.value = true

  window.setTimeout(() => {
    sparksGainedAnimating.value = false
    gainedDelta.value = ''
  }, 800)
}

onMounted(() => {
  addAppEventListener(APP_EVENTS.SPARKS_SPENT, handleSparksSpent)
  addAppEventListener(APP_EVENTS.SPARKS_AWARDED, handleSparksAwarded)
})

onBeforeUnmount(() => {
  removeAppEventListener(APP_EVENTS.SPARKS_SPENT, handleSparksSpent)
  removeAppEventListener(APP_EVENTS.SPARKS_AWARDED, handleSparksAwarded)
})
</script>

<style scoped>
.app-bar-custom {
  background: rgba(11, 13, 18, 0.82) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
  color: var(--home-text, #f1f5f9) !important;
}

.header-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 16px;
  gap: 16px;
}

.header-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header-left {
  justify-content: flex-start;
  min-width: 120px;
}

.header-center {
  justify-content: center;
  flex: 1;
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
  min-width: 120px;
  gap: 8px;
}

/*
 * The left slot only ever holds the drawer toggle and the streak badge, so for a
 * logged-out visitor it collapses to an empty 120px spacer and the "centred"
 * brand ends up parked at an arbitrary point next to it. Drop the slot and align
 * the brand to the start, which is where a landing visitor looks for a logo.
 */
.header-content-wrapper--guest .header-left {
  display: none;
}

.header-content-wrapper--guest .header-center {
  justify-content: flex-start;
}

.brand-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 8px;
  min-width: 0;
  height: 100%;
}

.brand-link {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  flex-shrink: 0;
}

.brand-link:hover,
.brand-link:focus,
.brand-link:active {
  text-decoration: none;
  background-color: transparent;
}

.brand-logo {
  height: 40px;
  filter: drop-shadow(0 0 10px rgba(112, 72, 232, 0.4));
  transition: transform 0.3s ease;
  display: block;
  object-fit: contain;
}

.brand-logo:hover {
  transform: scale(1.05);
}

.sparks-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.28);
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  font: inherit;
  color: inherit;
  appearance: none;
  -webkit-appearance: none;
}

.sparks-container:hover {
  background: rgba(251, 191, 36, 0.16);
  border-color: rgba(251, 191, 36, 0.42);
}

.sparks-container:focus-visible {
  outline: 2px solid rgba(251, 191, 36, 0.55);
  outline-offset: 2px;
}

.sparks-icon {
  color: var(--home-gold, #fbbf24);
  font-size: 0.85rem;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.45));
}

.sparks-count {
  font-weight: 800;
  font-size: 0.875rem;
  color: #ffffff;
  line-height: 1;
  transition: color 0.2s ease, transform 0.2s ease;
}

.sparks-count--spent {
  animation: sparksSpentPulse 0.65s ease;
}

.sparks-count--gained {
  animation: sparksGainedPulse 0.65s ease;
}

.sparks-spent-delta {
  font-size: 0.7rem;
  font-weight: 800;
  color: #7048E8;
  line-height: 1;
  animation: sparksDeltaFade 0.8s ease forwards;
}

.sparks-gained-delta {
  font-size: 0.7rem;
  font-weight: 800;
  color: #4FD1C5;
  line-height: 1;
  animation: sparksDeltaFade 0.8s ease forwards;
}

@keyframes sparksSpentPulse {
  0% { transform: scale(1); color: #ffffff; }
  35% { transform: scale(1.12); color: #7048E8; }
  100% { transform: scale(1); color: #ffffff; }
}

@keyframes sparksGainedPulse {
  0% { transform: scale(1); color: #ffffff; }
  35% { transform: scale(1.12); color: #4FD1C5; }
  100% { transform: scale(1); color: #ffffff; }
}

@keyframes sparksDeltaFade {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}

.sparks-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.65);
  text-transform: uppercase;
  line-height: 1;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.notification-button {
  color: rgba(255, 255, 255, 0.7) !important;
  position: relative;
}

.notification-button:hover {
  color: white !important;
}

/*
 * Register is the primary action for everyone who reaches the header logged out,
 * so it carries the brand gradient while Log in stays a quiet text button.
 */
.sign-up-button {
  background: linear-gradient(135deg, var(--home-teal, #4fd1c5) 0%, var(--home-magenta, #a62ee8) 100%) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 12px !important;
  box-shadow: var(--home-glow-teal, 0 0 16px rgba(79, 209, 197, 0.28)) !important;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.sign-up-button:hover {
  box-shadow: var(--home-glow-purple, 0 0 24px rgba(112, 72, 232, 0.35)) !important;
  transform: translateY(-1px);
}

.sign-up-button :deep(.v-btn__overlay) {
  background: transparent !important;
}

.login-button {
  color: rgba(255, 255, 255, 0.78) !important;
  border-radius: 12px !important;
}

.login-button:hover {
  color: #ffffff !important;
}

.language-button {
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 12px !important;
  min-width: 0 !important;
  gap: 6px;
}

.language-button:hover {
  color: #ffffff !important;
}

.language-code {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.language-list {
  background: #0d1119 !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.sign-up-button :deep(.v-btn__content),
.login-button :deep(.v-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.v-badge__badge) {
  background-color: #ff5252 !important;
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.5);
}

.app-bar-custom :deep(.v-app-bar-title),
.app-bar-custom :deep(.v-btn:not(.sign-up-button)),
.app-bar-custom :deep(.brand-link),
.app-bar-custom :deep(.v-app-bar-nav-icon) {
  color: #ffffff;
}

@media (min-width: 600px) {
  .brand-group {
    padding: 0 12px;
  }

  .brand-link {
    font-size: 1.25rem;
  }
}

@media (max-width: 959px) {
  .app-bar-custom {
    border-radius: 0;
  }

  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0.5em;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 0.25em;
    min-height: 56px;
    align-items: center;
  }

  .header-content-wrapper {
    gap: 12px;
  }

  .header-left,
  .header-right {
    min-width: auto;
    flex: 0 0 auto;
  }

  .header-center {
    flex: 1;
    justify-content: center;
  }

  .header-center .d-flex {
    justify-content: center;
    gap: 8px;
  }

  .header-right {
    gap: 6px;
  }

  .brand-group {
    gap: 8px;
    padding: 0 4px;
  }

  .brand-link {
    font-size: 0.875rem !important;
  }

  .sparks-container {
    gap: 4px;
    padding: 3px 8px;
  }

  .brand-logo {
    height: 32px;
  }

  .sign-up-button,
  .login-button {
    font-size: 0.75rem;
    padding: 6px 12px;
    min-width: auto;
    height: 32px;
  }

  .sign-up-button :deep(.v-btn__content),
  .login-button :deep(.v-btn__content) {
    padding: 0 4px;
  }
}

@media (max-width: 600px) {
  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0.5em;
  }

  .header-content-wrapper {
    gap: 8px;
  }

  .header-center .d-flex {
    gap: 6px;
  }

  .header-right {
    gap: 4px;
  }

  .brand-group {
    gap: 6px;
  }

  .brand-link {
    font-size: 0.75rem !important;
  }

  .sparks-container {
    gap: 4px;
    padding: 2px 6px;
  }

  .sparks-label {
    display: none;
  }

  .brand-logo {
    height: 28px;
  }

  .sign-up-button,
  .login-button {
    font-size: 0.7rem;
    padding: 4px 8px;
    height: 28px;
  }

  /*
   * At this width the auth buttons need every pixel, so the switcher drops to
   * the icon alone. The translate glyph is what makes the control findable; the
   * active language is still marked in the menu it opens.
   */
  .language-code {
    display: none;
  }

  .language-button {
    min-width: 32px !important;
    padding: 0 6px !important;
    height: 28px;
  }
}
</style>
