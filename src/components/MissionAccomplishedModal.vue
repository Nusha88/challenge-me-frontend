<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    persistent
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="ma-card">
      <div class="ma-glow"></div>

      <div class="ma-header">
        <div class="ma-trophy-wrap">
          <Trophy :size="34" :stroke-width="1.8" class="ma-trophy-icon" />
        </div>
        <h2 class="ma-title">{{ t('challenges.missionAccomplished.title') }}</h2>
        <p class="ma-subtitle">{{ t('challenges.missionAccomplished.subtitle') }}</p>
        <p v-if="questTitle" class="ma-quest-title">{{ questTitle }}</p>

        <v-textarea
          v-model="userReflection"
          class="ma-reflection mt-3"
          :placeholder="t('challenges.missionAccomplished.reflectionPlaceholder')"
          variant="solo-filled"
          flat
          rows="2"
          auto-grow
          maxlength="150"
          counter
          hide-details="auto"
        />
      </div>

      <v-card-text class="ma-body">
        <p class="ma-rewards-label">{{ t('challenges.missionAccomplished.rewardsTitle') }}</p>

        <div class="ma-rewards">
          <div class="ma-reward ma-reward--xp" :class="{ 'is-visible': rewardsVisible }">
            <div class="ma-reward-icon-wrap">
              <Zap :size="22" :stroke-width="2.5" class="ma-reward-icon" />
            </div>
            <div>
              <p class="ma-reward-value">+{{ xpGained }}</p>
              <p class="ma-reward-label">{{ t('challenges.missionAccomplished.xpLabel') }}</p>
            </div>
          </div>

          <div
            class="ma-reward ma-reward--sparks"
            :class="{ 'is-visible': rewardsVisible }"
            :style="{ transitionDelay: '120ms' }"
          >
            <div class="ma-reward-icon-wrap">
              <Sparkles :size="22" :stroke-width="2.2" class="ma-reward-icon" />
            </div>
            <div>
              <p class="ma-reward-value">+{{ sparksGained }}</p>
              <p class="ma-reward-label">{{ t('challenges.missionAccomplished.sparksLabel') }}</p>
            </div>
          </div>
        </div>
      </v-card-text>

      <div class="ma-actions">
        <v-btn class="ma-share" block size="large" @click="shareTriumph">
          {{ t('challenges.missionAccomplished.shareTriumph') }}
        </v-btn>
        <v-btn variant="outlined" class="ma-continue" block size="large" @click="close">
          {{ t('challenges.missionAccomplished.continue') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles, Trophy, Zap } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  questTitle: { type: String, default: '' },
  xpGained: { type: Number, default: 0 },
  sparksGained: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue', 'share'])

const { t } = useI18n()
const rewardsVisible = ref(false)
const userReflection = ref('')

watch(
  () => props.modelValue,
  (open) => {
    rewardsVisible.value = false
    if (open) {
      userReflection.value = ''
      requestAnimationFrame(() => {
        rewardsVisible.value = true
      })
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

function shareTriumph() {
  emit('share', { userReflection: userReflection.value.trim() })
}
</script>

<style scoped>
.ma-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(165deg, #1a1030 0%, #0f172a 45%, #1c1208 100%) !important;
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 22px !important;
  color: #fff;
  box-shadow:
    0 0 40px rgba(245, 158, 11, 0.15),
    0 24px 48px rgba(0, 0, 0, 0.45);
}

.ma-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.22), transparent 55%),
    radial-gradient(circle at 15% 85%, rgba(139, 92, 246, 0.18), transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(245, 158, 11, 0.12), transparent 40%);
}

.ma-header {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 28px 24px 8px;
}

.ma-trophy-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-bottom: 14px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.08));
  border: 1px solid rgba(251, 191, 36, 0.45);
  box-shadow: 0 0 28px rgba(245, 158, 11, 0.35);
  animation: ma-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.ma-trophy-icon {
  color: #fbbf24;
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
}

.ma-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  line-height: 1.15;
  background: linear-gradient(90deg, #fff 0%, #fbbf24 55%, #f59e0b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ma-rise 0.5s ease 0.1s both;
}

.ma-subtitle {
  margin: 10px 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.72);
  animation: ma-rise 0.5s ease 0.18s both;
}

.ma-quest-title {
  margin: 8px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  animation: ma-rise 0.5s ease 0.24s both;
}

.ma-reflection :deep(.v-field) {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.ma-reflection :deep(.v-field__overlay) {
  opacity: 0;
}

.ma-reflection :deep(textarea) {
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.88rem;
  line-height: 1.45;
}

.ma-reflection :deep(textarea::placeholder) {
  color: rgba(255, 255, 255, 0.38);
}

.ma-reflection :deep(.v-counter) {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.72rem;
}

.ma-body {
  position: relative;
  z-index: 1;
  padding: 8px 24px 12px !important;
}

.ma-rewards-label {
  margin: 0 0 14px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(251, 191, 36, 0.85);
}

.ma-rewards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ma-reward {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 14px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
  opacity: 0;
  transform: translateY(16px) scale(0.96);
  transition:
    opacity 0.45s ease,
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ma-reward.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.ma-reward--xp {
  border-color: rgba(251, 191, 36, 0.25);
  box-shadow: inset 0 0 20px rgba(251, 191, 36, 0.06);
}

.ma-reward--sparks {
  border-color: rgba(79, 209, 197, 0.25);
  box-shadow: inset 0 0 20px rgba(79, 209, 197, 0.06);
}

.ma-reward-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
}

.ma-reward--xp .ma-reward-icon-wrap {
  background: rgba(251, 191, 36, 0.15);
}

.ma-reward--sparks .ma-reward-icon-wrap {
  background: rgba(79, 209, 197, 0.15);
}

.ma-reward--xp .ma-reward-icon {
  color: #fbbf24;
}

.ma-reward--sparks .ma-reward-icon {
  color: #4fd1c5;
}

.ma-reward-value {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1.1;
  color: #fff;
}

.ma-reward-label {
  margin: 2px 0 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.ma-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 20px 22px;
}

.ma-actions :deep(.v-btn) {
  width: 100%;
  min-height: 46px;
  letter-spacing: 0.2px;
}

.ma-continue {
  text-transform: none;
  color: rgba(255, 255, 255, 0.78) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
  background: rgba(255, 255, 255, 0.03) !important;
}

.ma-share {
  background: linear-gradient(135deg, #f59e0b, #fbbf24) !important;
  color: #0f172a !important;
  font-weight: 800;
  text-transform: none;
  border-radius: 12px !important;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4) !important;
}

@keyframes ma-pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes ma-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 599px) {
  .ma-rewards {
    grid-template-columns: 1fr;
  }
}
</style>
