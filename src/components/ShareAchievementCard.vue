<template>
  <div class="share-card-root">
    <div ref="cardRef" class="share-card">
      <div class="sc-bg-pattern"></div>

      <header class="sc-header">
        <div class="sc-brand">
          <v-icon size="16" color="#0F172A">mdi-flash</v-icon>
          <span>IGNITE-ME.APP</span>
        </div>
        <h2 class="sc-headline">{{ t('challenges.shareCard.header') }}</h2>
        <p class="sc-quest-title">{{ questTitle }}</p>
        <p v-if="stepName" class="sc-step-name">{{ stepName }}</p>
      </header>

      <section class="sc-content">
        <!-- Both image and text -->
        <template v-if="hasImage && hasText">
          <div class="sc-photo-frame">
            <img :src="userImage" alt="" class="sc-photo" crossorigin="anonymous" />
          </div>
          <div class="sc-text-card">
            <p class="sc-handwritten">{{ userText }}</p>
          </div>
        </template>

        <!-- Image only -->
        <template v-else-if="hasImage">
          <div class="sc-photo-frame sc-photo-frame--large">
            <img :src="userImage" alt="" class="sc-photo" crossorigin="anonymous" />
          </div>
        </template>

        <!-- Text only -->
        <template v-else-if="hasText">
          <div class="sc-text-only">
            <v-icon size="56" class="sc-text-only-icon">mdi-format-quote-open</v-icon>
            <p class="sc-handwritten sc-handwritten--large">{{ userText }}</p>
          </div>
        </template>

        <!-- Fallback (no content) -->
        <template v-else>
          <div class="sc-text-only">
            <v-icon size="72" class="sc-text-only-icon">mdi-trophy</v-icon>
          </div>
        </template>
      </section>

      <footer class="sc-footer">
        <div class="sc-level-row">
          <span class="sc-level-badge">LVL {{ userLevel }}</span>
          <div class="sc-progress">
            <div class="sc-progress-fill"></div>
          </div>
        </div>
        <div class="sc-cta">{{ t('challenges.shareCard.joinCta') }}</div>
      </footer>
    </div>

    <v-btn
      class="sc-share-btn mt-4"
      block
      size="large"
      :loading="sharing"
      @click="shareCard"
    >
      <v-icon start>mdi-share-variant</v-icon>
      {{ t('challenges.shareCard.shareButton') }}
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toBlob } from 'html-to-image'

const props = defineProps({
  questTitle: { type: String, default: '' },
  stepName: { type: String, default: '' },
  userText: { type: String, default: '' },
  userImage: { type: String, default: '' },
  userLevel: { type: [Number, String], default: 1 }
})

const { t } = useI18n()

const cardRef = ref(null)
const sharing = ref(false)

const hasImage = computed(() => !!props.userImage)
const hasText = computed(() => !!(props.userText && props.userText.trim()))

async function generateBlob() {
  if (!cardRef.value) return null
  return toBlob(cardRef.value, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#0F172A'
  })
}

async function shareCard() {
  sharing.value = true
  try {
    const blob = await generateBlob()
    if (!blob) return

    const file = new File([blob], 'ignite-achievement.png', { type: 'image/png' })
    const shareData = {
      title: props.questTitle || 'Ignite',
      text: `${props.questTitle} — ${t('challenges.shareCard.header')}`,
      files: [file]
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share(shareData)
    } else {
      downloadBlob(blob)
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error('Share failed:', error)
    }
  } finally {
    sharing.value = false
  }
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'ignite-achievement.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

defineExpose({ shareCard })
</script>

<style scoped>
.share-card-root {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.share-card {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(160deg, #1A1A2E 0%, #0F172A 55%, #16213E 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px 22px;
  color: #fff;
  border: 1px solid rgba(79, 209, 197, 0.25);
}

.sc-bg-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 20% 15%, rgba(79, 209, 197, 0.18), transparent 42%),
    radial-gradient(circle at 85% 80%, rgba(112, 72, 232, 0.22), transparent 45%);
  pointer-events: none;
}

.sc-header {
  position: relative;
  text-align: center;
}

.sc-brand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #4FD1C5;
  color: #0F172A;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.sc-headline {
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  line-height: 1.15;
  color: #4FD1C5;
  text-transform: uppercase;
}

.sc-quest-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin-top: 8px;
  color: #fff;
}

.sc-step-name {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.sc-content {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: 0;
  padding: 18px 0;
}

.sc-photo-frame {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #4FD1C5;
  box-shadow: 0 0 28px rgba(79, 209, 197, 0.55);
  flex-shrink: 0;
}

.sc-photo-frame--large {
  width: 100%;
  height: 100%;
  border-radius: 18px;
  border: 2px solid #4FD1C5;
}

.sc-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sc-text-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(79, 209, 197, 0.3);
  border-radius: 16px;
  padding: 16px 18px;
  max-width: 100%;
}

.sc-handwritten {
  font-family: 'Caveat', 'Segoe Script', cursive;
  font-size: 1.35rem;
  line-height: 1.35;
  text-align: center;
  color: #fff;
  word-break: break-word;
}

.sc-handwritten--large {
  font-size: 1.7rem;
}

.sc-text-only {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 0 8px;
}

.sc-text-only-icon {
  color: rgba(79, 209, 197, 0.45) !important;
}

.sc-footer {
  position: relative;
  text-align: center;
}

.sc-level-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.sc-level-badge {
  font-size: 0.72rem;
  font-weight: 900;
  color: #0F172A;
  background: #FBBF24;
  border-radius: 8px;
  padding: 4px 10px;
  flex-shrink: 0;
}

.sc-progress {
  flex: 1;
  height: 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.sc-progress-fill {
  width: 72%;
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #4FD1C5, #7048E8);
}

.sc-cta {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #0F172A;
  background: #4FD1C5;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 6px 18px rgba(79, 209, 197, 0.35);
}

.sc-share-btn {
  background: #7048E8 !important;
  color: #fff !important;
  font-weight: 800;
  text-transform: none;
  border-radius: 12px !important;
}
</style>
