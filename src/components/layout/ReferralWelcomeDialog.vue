<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="referral-welcome-card">
      <v-card-text class="text-center pa-8">
        <div class="welcome-icon-wrap mb-4">
          <v-icon size="36" color="#4FD1C5">mdi-gift</v-icon>
        </div>
        <h3 class="welcome-title mb-3">{{ welcomeTitle }}</h3>
        <p class="welcome-text mb-6">{{ welcomeHook }}</p>

        <div class="reward-chip mb-6">
          <v-icon size="20" color="#4FD1C5">mdi-diamond-stone</v-icon>
          <span>{{ rewardAmount }}</span>
          <span class="sparks-icon">✦</span>
        </div>

        <v-btn
          block
          height="48"
          class="welcome-cta-btn mb-3"
          @click="$emit('start-mission')"
        >
          {{ t('referral.welcomeCta') }}
        </v-btn>
        <v-btn
          block
          variant="text"
          class="welcome-dismiss-btn"
          @click="$emit('dismiss')"
        >
          {{ t('referral.welcomeDismiss') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  variant: {
    type: String,
    default: 'signup',
    validator: (value) => ['referral', 'signup'].includes(value)
  }
})

defineEmits(['update:modelValue', 'start-mission', 'dismiss'])

const { t } = useI18n()

const isReferral = computed(() => props.variant === 'referral')

const welcomeTitle = computed(() => (
  isReferral.value ? t('referral.welcomeTitle') : t('referral.welcomeTitleSignup')
))

const welcomeHook = computed(() => (
  isReferral.value ? t('referral.welcomeHook') : t('referral.welcomeHookSignup')
))

const rewardAmount = computed(() => (isReferral.value ? 50 : 100))
</script>

<style scoped>
.referral-welcome-card {
  background: #131323 !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
}

.welcome-icon-wrap {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.25);
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.2);
}

.welcome-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 1.2rem;
}

.welcome-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.reward-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 12px;
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.25);
  font-weight: 800;
  color: #ffc107;
}

.sparks-icon {
  font-size: 0.8rem;
  filter: drop-shadow(0 0 4px rgba(255, 193, 7, 0.45));
}

.welcome-cta-btn {
  background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%) !important;
  color: #0F172A !important;
  font-weight: 800 !important;
  border-radius: 12px !important;
}

.welcome-dismiss-btn {
  color: rgba(255, 255, 255, 0.55) !important;
  text-transform: none !important;
}
</style>
