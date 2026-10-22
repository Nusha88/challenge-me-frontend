<template>
  <v-dialog
    :model-value="modelValue"
    max-width="440"
    persistent
    scrollable
    :retain-focus="false"
    overlay-color="#0b0d12"
    overlay-opacity="0.82"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="completion-dialog-card">
      <div class="glow-bg" aria-hidden="true"></div>

      <v-btn
        icon
        variant="text"
        class="dialog-close-btn"
        size="small"
        :aria-label="t('home.loggedIn.completionDialog.close')"
        @click="emit('close')"
      >
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>

      <v-card-text class="completion-body pa-6 pt-10">
        <header class="celebrate-strip text-center mb-4">
          <h2 class="completion-title">
            {{ t('home.loggedIn.completionDialog.conqueredTitle') }}
          </h2>
          <p class="completion-message">
            {{ t('home.loggedIn.completionDialog.congrats', { name: displayName }) }}
          </p>
          <p class="sparks-hint">
            {{ t('home.loggedIn.completionDialog.sparksHint') }}
          </p>
        </header>

        <div class="preview-frame">
          <div class="preview-scaler">
            <VictoryHeroCard
              ref="heroCardRef"
              :user-name="payload.userName"
              :avatar-url="payload.avatarUrl"
              :user-id="payload.userId"
              :xp="payload.xp"
              :streak-days="payload.streakDays"
              :completed-count="payload.completedCount"
              :total-count="payload.totalCount"
              :referral-link="payload.referralLink"
            />
          </div>
        </div>

        <v-btn
          block
          height="52"
          class="share-primary text-none"
          elevation="0"
          :loading="sharing"
          :disabled="sharing || saving"
          @click="emit('share')"
        >
          <v-icon start size="20">mdi-share-variant</v-icon>
          {{ t('home.loggedIn.completionDialog.shareWin') }}
        </v-btn>

        <v-btn
          block
          class="secondary-btn text-none"
          variant="outlined"
          height="44"
          :loading="saving"
          :disabled="saving || sharing"
          @click="emit('save')"
        >
          <v-icon start size="18">mdi-download</v-icon>
          {{ t('home.loggedIn.completionDialog.saveImage') }}
        </v-btn>

        <p v-if="statusMessage" class="status-msg" :class="{ success: sparksClaimed }">
          {{ statusMessage }}
        </p>
        <p v-if="shareError" class="share-error">
          {{ shareError }}
        </p>

        <button type="button" class="later-link" @click="emit('close')">
          {{ t('home.loggedIn.completionDialog.close') }}
        </button>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import VictoryHeroCard from './VictoryHeroCard.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sharing: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  shareError: { type: String, default: '' },
  statusMessage: { type: String, default: '' },
  sparksClaimed: { type: Boolean, default: false },
  payload: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'update:modelValue',
  'close',
  'share',
  'save'
])

const { t } = useI18n()
const heroCardRef = ref(null)

const displayName = computed(() => props.payload?.userName || t('profile.ranks.explorer'))

defineExpose({
  getCardElement: () => heroCardRef.value?.getCardElement?.() || null
})
</script>

<style scoped>
.completion-dialog-card {
  background: rgba(15, 18, 28, 0.96) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(126, 70, 196, 0.45) !important;
  border-radius: 24px !important;
  position: relative;
  max-height: min(92vh, 820px);
  overflow: hidden;
}

.glow-bg {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 240px;
  background: radial-gradient(
    circle,
    rgba(79, 209, 197, 0.16) 0%,
    rgba(126, 70, 196, 0.12) 45%,
    transparent 70%
  );
  z-index: 0;
  pointer-events: none;
}

.completion-body {
  position: relative;
  z-index: 1;
  max-height: min(92vh, 820px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.celebrate-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.completion-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  text-shadow: 0 0 15px rgba(79, 209, 197, 0.2);
}

.completion-message {
  font-size: 0.95rem;
  color: #d1d5db;
  line-height: 1.4;
  margin: 0;
}

.sparks-hint {
  font-size: 0.8rem;
  color: rgba(79, 209, 197, 0.9);
  margin: 2px 0 0;
  font-weight: 600;
}

.preview-frame {
  width: 216px;
  height: 384px;
  margin: 0 auto 18px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #0b0d12;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
}

.preview-scaler {
  width: 540px;
  height: 960px;
  transform: scale(0.4);
  transform-origin: top left;
}

.share-primary {
  background: linear-gradient(90deg, #7e46c4 0%, #4fd1c5 100%) !important;
  color: white !important;
  border-radius: 14px !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 25px rgba(126, 70, 196, 0.3) !important;
  margin-bottom: 10px;
}

.share-primary:hover:not(.v-btn--disabled) {
  filter: brightness(1.06);
}

.secondary-btn {
  border-color: rgba(79, 209, 197, 0.45) !important;
  color: #e5e7eb !important;
  border-radius: 12px !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
  margin-bottom: 8px;
}

.status-msg {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: rgba(209, 213, 219, 0.9);
  text-align: center;
  line-height: 1.4;
}

.status-msg.success {
  color: #4fd1c5;
  font-weight: 700;
}

.share-error {
  color: #fca5a5;
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: center;
  margin: 8px 0 0;
}

.later-link {
  display: block;
  width: 100%;
  margin: 10px 0 4px;
  padding: 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.later-link:hover {
  color: rgba(255, 255, 255, 0.85);
}

.dialog-close-btn {
  position: absolute !important;
  top: 12px !important;
  right: 12px !important;
  z-index: 10 !important;
  color: rgba(255, 255, 255, 0.7) !important;
}
</style>
