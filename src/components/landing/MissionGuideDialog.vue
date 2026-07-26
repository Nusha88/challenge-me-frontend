<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    scrollable
    transition="dialog-bottom-transition"
    content-class="mission-guide-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="guide-card">
      <div class="guide-header">
        <div class="guide-header-main">
          <span class="lp-icon-tile guide-header-tile" :class="isQuest ? 'lp-icon-tile--purple' : ''">
            <v-icon>{{ isQuest ? 'mdi-sword' : 'mdi-star-four-points-outline' }}</v-icon>
          </span>
          <h3 class="guide-title">{{ t(`home.landing.missions.${type}.guideTitle`) }}</h3>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          class="guide-close"
          :aria-label="t('common.close')"
          @click="$emit('update:modelValue', false)"
        />
      </div>

      <v-card-text class="guide-body">
        <div class="guide-media">
          <video
            v-if="videoSrc"
            ref="videoRef"
            :key="type"
            class="guide-video"
            :class="{ 'is-ready': videoReady }"
            :src="videoSrc"
            autoplay
            loop
            muted
            playsinline
            preload="metadata"
            @canplay="videoReady = true"
          />
          <div v-if="!videoReady" class="guide-media-placeholder">
            <v-progress-circular indeterminate size="26" width="2" color="#4FD1C5" />
            <span>{{ t('home.landing.missions.guideLoading') }}</span>
          </div>
        </div>

        <p class="guide-caption">{{ t(`home.landing.missions.${type}.description`) }}</p>
      </v-card-text>

      <v-card-actions class="guide-actions">
        <LandingPrimaryCta :position="`guide_${type}`" block size="large">
          {{ t('home.landing.missions.guideCta') }}
        </LandingPrimaryCta>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LandingPrimaryCta from './LandingPrimaryCta.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  type: { type: String, default: 'ritual' }
})

defineEmits(['update:modelValue'])

const { t } = useI18n()

const videoRef = ref(null)
const videoSrc = ref('')
const videoReady = ref(false)

const isQuest = computed(() => props.type === 'quest')

/*
 * The walkthrough clips are several megabytes each. Importing them dynamically
 * keeps them out of the landing page's asset graph entirely, so nothing is
 * fetched until a visitor actually asks to see one.
 */
const loaders = {
  ritual: () => import('../../assets/ritual.mp4'),
  quest: () => import('../../assets/quest.mp4')
}

let requestToken = 0

async function loadVideo(type) {
  const token = ++requestToken
  videoReady.value = false
  videoSrc.value = ''

  const load = loaders[type]
  if (!load) return

  try {
    const module = await load()
    // A different type may have been requested while this import was in flight.
    if (token !== requestToken) return
    videoSrc.value = module.default
  } catch {
    // Leaving videoSrc empty keeps the placeholder visible rather than breaking
    // the dialog; the surrounding copy still explains the mission type.
  }
}

watch(
  () => [props.modelValue, props.type],
  ([open, type]) => {
    if (open) {
      loadVideo(type)
      return
    }

    requestToken += 1
    videoRef.value?.pause()
    videoSrc.value = ''
    videoReady.value = false
  },
  { immediate: true }
)
</script>

<style scoped>
:deep(.mission-guide-dialog) {
  width: min(520px, calc(100vw - 24px)) !important;
  max-width: 520px !important;
}

.guide-card {
  background: #0d1119 !important;
  color: var(--lp-text, #f1f5f9) !important;
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 20px !important;
  overflow: hidden;
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.guide-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.guide-header-tile {
  margin-bottom: 0;
  width: 36px;
  height: 36px;
}

.guide-header-tile .v-icon {
  font-size: 19px !important;
}

.guide-title {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  line-height: 1.3;
}

.guide-close {
  color: rgba(255, 255, 255, 0.6) !important;
  flex-shrink: 0;
}

.guide-body {
  padding: 14px 16px !important;
}

.guide-media {
  position: relative;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(79, 209, 197, 0.22);
  background: #080b11;
}

.guide-video {
  display: block;
  width: 100%;
  max-height: 52vh;
  height: auto;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.guide-video.is-ready {
  opacity: 1;
}

.guide-media-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.78rem;
  color: var(--lp-text-faint, #64748b);
}

.guide-caption {
  margin: 14px 0 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--lp-text-dim, #94a3b8);
}

.guide-actions {
  padding: 4px 16px 18px !important;
}

@media (max-width: 600px) {
  .guide-video {
    max-height: 42vh;
  }

  .guide-media {
    min-height: 150px;
  }
}
</style>
