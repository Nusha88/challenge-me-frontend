<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { APP_EVENTS, addAppEventListener, removeAppEventListener } from '../utils/appEvents'
import { getXpToastVariant, normalizeToastAnchor, playXpAwardChime } from '../utils/xpToastTheme'

const { t } = useI18n()

const visible = ref(false)
const gained = ref(0)
const rewardKind = ref('xp')
const variant = ref('spark')
const anchor = ref(null)
let hideTimer = null

const label = computed(() => {
  if (rewardKind.value === 'sparks') {
    return t('notifications.sparksGainedToast', { count: gained.value })
  }
  return t('notifications.xpGainedToast', { count: gained.value })
})

const iconName = computed(() => (
  rewardKind.value === 'sparks' ? 'mdi-flare' : 'mdi-star-four-points'
))

const toastClass = computed(() => [
  'xp-toast',
  `xp-toast--${variant.value}`,
  anchor.value ? 'xp-toast--anchored' : 'xp-toast--centered'
])

const toastStyle = computed(() => {
  if (!anchor.value) return {}

  return {
    left: `${anchor.value.x}px`,
    top: `${anchor.value.y}px`
  }
})

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function showToast(payload, kind = 'xp') {
  const amount = Number(payload?.gained)
  if (!Number.isFinite(amount) || amount <= 0) return

  clearHideTimer()
  gained.value = amount
  rewardKind.value = kind
  variant.value = kind === 'sparks' ? 'medium' : getXpToastVariant(amount)
  anchor.value = normalizeToastAnchor(payload?.anchor)
  visible.value = false

  requestAnimationFrame(() => {
    visible.value = true
    playXpAwardChime()
    hideTimer = setTimeout(() => {
      visible.value = false
    }, 2500)
  })
}

function handleXpAwarded(event) {
  showToast(event?.detail || {}, 'xp')
}

function handleSparksAwarded(event) {
  showToast(event?.detail || {}, 'sparks')
}

onMounted(() => {
  addAppEventListener(APP_EVENTS.XP_AWARDED, handleXpAwarded)
  addAppEventListener(APP_EVENTS.SPARKS_AWARDED, handleSparksAwarded)
})

onBeforeUnmount(() => {
  removeAppEventListener(APP_EVENTS.XP_AWARDED, handleXpAwarded)
  removeAppEventListener(APP_EVENTS.SPARKS_AWARDED, handleSparksAwarded)
  clearHideTimer()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="xp-toast-fade">
      <div
        v-if="visible"
        :class="toastClass"
        :style="toastStyle"
        role="status"
        aria-live="polite"
      >
        <span class="xp-toast__glow" aria-hidden="true"></span>
        <v-icon class="xp-toast__icon" size="18">{{ iconName }}</v-icon>
        <span class="xp-toast__text">{{ label }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.xp-toast {
  position: fixed;
  z-index: 10050;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  border-radius: 999px;
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  background: rgba(45, 45, 60, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  overflow: hidden;
}

.xp-toast--centered {
  left: 50%;
  bottom: 28px;
  transform: translateX(-50%);
}

.xp-toast--anchored {
  transform: translate(-50%, calc(-100% - 14px));
  animation: xp-toast-rise-from-anchor 2.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.xp-toast__glow {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  opacity: 0.55;
  pointer-events: none;
}

.xp-toast__icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.35));
}

.xp-toast__text {
  position: relative;
  z-index: 1;
  white-space: nowrap;
}

/* Tier colors */
.xp-toast--spark .xp-toast__glow {
  background: linear-gradient(135deg, rgba(112, 72, 232, 0.45), rgba(190, 75, 219, 0.2));
  box-shadow: 0 0 18px rgba(112, 72, 232, 0.35);
}

.xp-toast--spark {
  border-color: rgba(112, 72, 232, 0.45);
}

.xp-toast--spark .xp-toast__icon {
  color: #c4b5fd;
}

.xp-toast--easy .xp-toast__glow {
  background: linear-gradient(135deg, rgba(60, 96, 232, 0.5), rgba(96, 165, 250, 0.15));
  box-shadow: 0 0 20px rgba(60, 96, 232, 0.4);
}

.xp-toast--easy {
  border-color: rgba(96, 165, 250, 0.45);
}

.xp-toast--easy .xp-toast__icon {
  color: #93c5fd;
}

.xp-toast--medium .xp-toast__glow {
  background: linear-gradient(135deg, rgba(79, 209, 197, 0.5), rgba(45, 212, 191, 0.15));
  box-shadow: 0 0 22px rgba(79, 209, 197, 0.45);
}

.xp-toast--medium {
  border-color: rgba(79, 209, 197, 0.5);
}

.xp-toast--medium .xp-toast__icon {
  color: #4fd1c5;
}

.xp-toast--heroic .xp-toast__glow {
  background: linear-gradient(
    120deg,
    rgba(251, 191, 36, 0.55),
    rgba(168, 85, 247, 0.45),
    rgba(236, 72, 153, 0.25)
  );
  box-shadow: 0 0 26px rgba(251, 191, 36, 0.45);
  animation: xp-heroic-shimmer 1.2s ease-in-out infinite alternate;
}

.xp-toast--heroic {
  border-color: rgba(251, 191, 36, 0.55);
}

.xp-toast--heroic .xp-toast__icon {
  color: #fcd34d;
}

@keyframes xp-heroic-shimmer {
  from { opacity: 0.45; }
  to { opacity: 0.85; }
}

@keyframes xp-toast-rise-from-anchor {
  0% {
    opacity: 0;
    transform: translate(-50%, calc(-100% - 6px)) scale(0.9);
  }
  12% {
    opacity: 1;
    transform: translate(-50%, calc(-100% - 14px)) scale(1);
  }
  55% {
    opacity: 1;
    transform: translate(-50%, calc(-100% - 72px)) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, calc(-100% - 96px)) scale(0.98);
  }
}

.xp-toast-fade-enter-active {
  animation: xp-toast-enter-center 0.45s cubic-bezier(0.34, 1.45, 0.64, 1);
}

.xp-toast-fade-leave-active {
  animation: xp-toast-leave 0.35s ease forwards;
}

.xp-toast--anchored.xp-toast-fade-enter-active,
.xp-toast--anchored.xp-toast-fade-leave-active {
  animation: none;
}

@keyframes xp-toast-enter-center {
  0% {
    opacity: 0;
    transform: translate(-50%, 20px) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

@keyframes xp-toast-leave {
  from {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -8px) scale(0.98);
  }
}

@media (max-width: 959px) {
  .xp-toast--centered {
    bottom: 88px;
    max-width: calc(100vw - 32px);
  }

  .xp-toast__text {
    white-space: normal;
    text-align: center;
  }
}
</style>
