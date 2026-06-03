<template>
  <v-dialog
    :model-value="modelValue"
    max-width="450"
    persistent
    overlay-color="#1A1A2E"
    overlay-opacity="0.8"
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="completion-dialog-card overflow-visible">
      <div class="glow-bg"></div>

      <v-btn
        icon
        variant="text"
        class="dialog-close-btn"
        size="small"
        @click="$emit('close')"
      >
        <v-icon color="white">mdi-close</v-icon>
      </v-btn>

      <v-card-text class="text-center pa-8 pt-12">
        <div class="completion-icon-wrapper mb-6">
          <div class="icon-circle">
            <v-icon size="60" color="white">mdi-rocket-launch</v-icon>
          </div>
        </div>

        <h2 class="completion-title mb-3 leading-tight">
          {{ t('home.loggedIn.completionDialog.title') }}
        </h2>

        <p class="completion-message mb-8 px-4">
          {{ t('home.loggedIn.completionDialog.message') }}
        </p>

        <v-btn
          block
          height="64"
          class="celebration-button mb-4 text-none"
          elevation="0"
          :loading="generatingImage"
          @click="$emit('generate-image')"
        >
          <v-icon left class="mr-2">mdi-share-variant</v-icon>
          {{ t('home.loggedIn.generateCompletionImage') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: Boolean, default: false },
  generatingImage: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'close', 'generate-image'])

const { t } = useI18n()
</script>

<style scoped>
.completion-dialog-card {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 2px solid rgba(126, 70, 196, 0.3) !important;
  border-radius: 32px !important;
  position: relative;
  overflow: visible !important;
}

.glow-bg {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(79, 209, 197, 0.15) 0%, rgba(126, 70, 196, 0.1) 50%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

.icon-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #7E46C4 0%, #4FD1C5 100%);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 15px 35px rgba(126, 70, 196, 0.4);
  animation: float 3s ease-in-out infinite;
}

.completion-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 900;
  font-size: 1.85rem;
  color: #FFFFFF;
  text-shadow: 0 0 15px rgba(79, 209, 197, 0.2);
}

.completion-message {
  font-size: 1rem;
  color: #D1D5DB;
  line-height: 1.6;
}

.celebration-button {
  background: linear-gradient(90deg, #7E46C4 0%, #4FD1C5 100%) !important;
  color: white !important;
  border-radius: 18px !important;
  font-weight: 800 !important;
  font-size: 1.1rem !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  box-shadow: 0 10px 25px rgba(126, 70, 196, 0.3) !important;
  border: none !important;
}

.celebration-button:hover {
  transform: scale(1.03) translateY(-3px);
  box-shadow: 0 15px 35px rgba(79, 209, 197, 0.4) !important;
  filter: brightness(1.1);
}

.dialog-close-btn {
  position: absolute !important;
  top: 16px !important;
  right: 16px !important;
  z-index: 10 !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s ease !important;
}

.dialog-close-btn:hover {
  color: #FFFFFF !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
  transform: scale(1.1);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
</style>
