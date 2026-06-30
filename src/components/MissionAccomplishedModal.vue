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
        <div class="ma-trophy-wrap" :class="{ 'ma-trophy-wrap--dim': isExtinguished }">
          <Trophy :size="34" :stroke-width="1.8" class="ma-trophy-icon" />
        </div>
        <h2 class="ma-title">{{ headerTitle }}</h2>
        <p class="ma-subtitle">{{ headerSubtitle }}</p>
        <p v-if="questTitle" class="ma-quest-title">{{ questTitle }}</p>

        <div v-if="tierLabel" class="ma-tier-chip mt-3">
          <span class="ma-tier-icon">{{ tierIcon }}</span>
          <span>{{ tierLabel }}</span>
          <span v-if="completionRate != null" class="ma-tier-rate">{{ completionRate }}%</span>
        </div>

        <template v-if="step === 'reflection'">
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
        </template>
      </div>

      <v-card-text v-if="step === 'rewards'" class="ma-body">
        <template v-if="isExtinguished">
          <p class="ma-support-text">{{ t('challenges.missionAccomplished.extinguishedSupport') }}</p>
          <p class="ma-support-subtext">{{ t('challenges.missionAccomplished.extinguishedReframe') }}</p>
        </template>

        <template v-else>
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

          <div v-if="badge" class="ma-badge-row" :class="{ 'is-visible': rewardsVisible }">
            🏅 {{ t(`challenges.missionTiers.badges.${badge}`) }}
          </div>
        </template>
      </v-card-text>

      <div class="ma-actions">
        <v-btn
          v-if="step === 'reflection'"
          class="ma-share"
          block
          size="large"
          @click="goToRewards"
        >
          {{ t('challenges.missionAccomplished.next') }}
        </v-btn>

        <template v-else>
          <v-btn
            v-if="!isExtinguished"
            class="ma-share"
            block
            size="large"
            @click="shareTriumph"
          >
            {{ t('challenges.missionAccomplished.shareTriumph') }}
          </v-btn>
          <v-btn variant="outlined" class="ma-continue" block size="large" @click="close">
            {{ t('challenges.missionAccomplished.continue') }}
          </v-btn>
        </template>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles, Trophy, Zap } from 'lucide-vue-next'
import { MISSION_TIERS } from '../utils/missionParticipation'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  questTitle: { type: String, default: '' },
  xpGained: { type: Number, default: 0 },
  sparksGained: { type: Number, default: 0 },
  tier: { type: String, default: '' },
  completionRate: { type: Number, default: null },
  personalDone: { type: Number, default: null },
  personalTotal: { type: Number, default: null },
  badge: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'share'])

const { t } = useI18n()
const step = ref('reflection')
const rewardsVisible = ref(false)
const userReflection = ref('')

const isExtinguished = computed(() => props.tier === MISSION_TIERS.EXTINGUISHED)

const tierLabel = computed(() => {
  if (!props.tier) return ''
  return t(`challenges.missionTiers.${props.tier}`)
})

const tierIcon = computed(() => {
  switch (props.tier) {
    case MISSION_TIERS.PERFECT: return '🔥'
    case MISSION_TIERS.BRIGHT: return '✨'
    case MISSION_TIERS.SUSTAINED: return '🕯️'
    case MISSION_TIERS.EXTINGUISHED: return '💨'
    default: return '🏆'
  }
})

const headerTitle = computed(() => {
  if (isExtinguished.value && step.value === 'rewards') {
    return t('challenges.missionAccomplished.extinguishedTitle')
  }
  return t('challenges.missionAccomplished.title')
})

const headerSubtitle = computed(() => {
  if (props.personalDone != null && props.personalTotal != null) {
    return t('challenges.missionAccomplished.personalStats', {
      done: props.personalDone,
      total: props.personalTotal
    })
  }
  return t('challenges.missionAccomplished.subtitle')
})

watch(
  () => props.modelValue,
  (open) => {
    step.value = 'reflection'
    rewardsVisible.value = false
    if (open) {
      userReflection.value = ''
    }
  }
)

function goToRewards() {
  step.value = 'rewards'
  rewardsVisible.value = false
  requestAnimationFrame(() => {
    rewardsVisible.value = true
  })
}

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

.ma-trophy-wrap--dim {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow: none;
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
}

.ma-subtitle {
  margin: 10px 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.72);
}

.ma-quest-title {
  margin: 8px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.ma-tier-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.28);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.ma-tier-rate {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 700;
}

.ma-reflection :deep(.v-field) {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.ma-reflection :deep(textarea) {
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.88rem;
}

.ma-body {
  position: relative;
  z-index: 1;
  padding: 8px 24px 12px !important;
}

.ma-support-text {
  margin: 0;
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.88);
}

.ma-support-subtext {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.85rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.58);
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

.ma-reward--xp { border-color: rgba(251, 191, 36, 0.25); }
.ma-reward--sparks { border-color: rgba(79, 209, 197, 0.25); }

.ma-reward-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  flex-shrink: 0;
}

.ma-reward--xp .ma-reward-icon-wrap { background: rgba(251, 191, 36, 0.15); }
.ma-reward--sparks .ma-reward-icon-wrap { background: rgba(79, 209, 197, 0.15); }
.ma-reward--xp .ma-reward-icon { color: #fbbf24; }
.ma-reward--sparks .ma-reward-icon { color: #4fd1c5; }

.ma-reward-value {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  color: #fff;
}

.ma-reward-label {
  margin: 2px 0 0;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.ma-badge-row {
  margin-top: 14px;
  text-align: center;
  font-size: 0.88rem;
  font-weight: 800;
  color: #fbbf24;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.ma-badge-row.is-visible {
  opacity: 1;
  transform: translateY(0);
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
}

@keyframes ma-pop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 599px) {
  .ma-rewards { grid-template-columns: 1fr; }
}
</style>
