<template>
  <v-dialog
    :model-value="modelValue"
    max-width="430"
    transition="dialog-bottom-transition"
    class="install-app-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="install-app-card">
      <div class="install-app-header">
        <div class="install-title-wrap">
          <div class="install-icon-glow">
            <v-icon color="#4FD1C5" size="20">mdi-cellphone-arrow-down</v-icon>
          </div>
          <div>
            <h3 class="install-title">{{ t('installApp.title') }}</h3>
            <p class="install-subtitle">{{ t('installApp.subtitle') }}</p>
          </div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          class="install-close"
          @click="dismiss"
        ></v-btn>
      </div>

      <v-card-text class="install-body">
        <v-window
          v-model="activeSlide"
          class="install-window"
          touch
        >
          <v-window-item
            v-for="(slide, index) in slides"
            :key="slide.id"
            :value="index"
          >
            <div class="install-slide">
              <div class="screenshot-frame">
                <img :src="slide.image" :alt="slide.alt" class="install-screenshot" />
              </div>
              <p class="step-label">{{ slide.label }}</p>
            </div>
          </v-window-item>
        </v-window>

        <div class="install-dots" aria-hidden="true">
          <button
            v-for="(_, index) in slides"
            :key="index"
            type="button"
            :class="['install-dot', { 'is-active': activeSlide === index }]"
            @click="activeSlide = index"
          ></button>
        </div>
      </v-card-text>

      <v-card-actions class="install-actions">
        <v-btn
          v-if="!isLastSlide"
          block
          class="install-next-btn"
          @click="activeSlide += 1"
        >
          {{ t('installApp.next') }}
        </v-btn>
        <v-btn
          v-else
          block
          class="install-got-it-btn"
          @click="complete"
        >
          {{ t('installApp.gotIt') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import installStepShare from '../assets/IMG_8932.jpeg'
import installStepAdd from '../assets/IMG_8933.jpeg'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'completed'])

const { t } = useI18n()
const activeSlide = ref(0)

const slides = computed(() => [
  {
    id: 'share',
    image: installStepShare,
    alt: t('installApp.step1Alt'),
    label: t('installApp.step1')
  },
  {
    id: 'add-home',
    image: installStepAdd,
    alt: t('installApp.step2Alt'),
    label: t('installApp.step2')
  }
])

const isLastSlide = computed(() => activeSlide.value === slides.value.length - 1)

watch(() => props.modelValue, (open) => {
  if (open) {
    activeSlide.value = 0
  }
})

function dismiss() {
  emit('completed')
  emit('update:modelValue', false)
}

function complete() {
  dismiss()
}
</script>

<style scoped>
.install-app-card {
  background: linear-gradient(160deg, #0f172a 0%, #16213e 56%, #1a1a2e 100%) !important;
  border: 1px solid rgba(79, 209, 197, 0.18);
  border-radius: 22px !important;
  color: #fff !important;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55) !important;
  display: flex;
  flex-direction: column;
}

.install-app-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.install-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.install-icon-glow {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(79, 209, 197, 0.12);
  border: 1px solid rgba(79, 209, 197, 0.22);
  box-shadow: 0 0 18px rgba(79, 209, 197, 0.18);
  flex: 0 0 auto;
}

.install-title {
  color: #fff;
  font-size: 1.12rem;
  font-weight: 900;
  line-height: 1.2;
  margin: 0;
}

.install-subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.78rem;
  line-height: 1.35;
  margin: 3px 0 0;
}

.install-close {
  color: rgba(255, 255, 255, 0.55) !important;
}

.install-body {
  padding: 16px 18px 8px !important;
  flex: 0 0 auto;
}

.install-window {
  height: 500px;
  overflow: hidden;
}

.install-window :deep(.v-window__container) {
  height: 100%;
}

.install-window :deep(.v-window-item) {
  height: 100%;
}

.install-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  height: 100%;
  min-height: 500px;
}

.screenshot-frame {
  width: min(100%, 270px);
  height: 400px;
  flex: 0 0 400px;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
}

.install-screenshot {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 20px;
  background: #0f172a;
  user-select: none;
}

.step-label {
  color: rgba(255, 255, 255, 0.86);
  font-size: 0.95rem;
  line-height: 1.45;
  text-align: center;
  margin: 0;
  max-width: 320px;
  min-height: 4.35rem;
  flex: 0 0 auto;
}

.install-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
}

.install-dot {
  width: 8px;
  height: 8px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  cursor: pointer;
  padding: 0;
  transition: width 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.install-dot.is-active {
  width: 22px;
  background: #4FD1C5;
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.7);
}

.install-actions {
  padding: 8px 18px 18px !important;
  min-height: 72px;
  flex: 0 0 auto;
}

.install-next-btn,
.install-got-it-btn {
  min-height: 46px;
  border-radius: 14px !important;
  font-weight: 900;
  text-transform: none;
}

.install-next-btn {
  color: #4FD1C5 !important;
  background: rgba(79, 209, 197, 0.1) !important;
  border: 1px solid rgba(79, 209, 197, 0.26);
}

.install-got-it-btn {
  background: #4FD1C5 !important;
  color: #0F172A !important;
  box-shadow: 0 0 22px rgba(79, 209, 197, 0.32) !important;
}

@media (max-width: 600px) {
  .install-app-card {
    border-radius: 20px !important;
  }

  .install-app-header {
    padding: 16px 16px 8px;
  }

  .install-body {
    padding: 14px 16px 8px !important;
  }

  .install-window,
  .install-slide {
    min-height: 460px;
    height: 460px;
  }

  .screenshot-frame {
    width: min(100%, 245px);
    height: 360px;
    flex-basis: 360px;
  }

  .step-label {
    font-size: 0.88rem;
    min-height: 3.9rem;
  }

  .install-actions {
    padding: 8px 16px 16px !important;
  }
}
</style>
