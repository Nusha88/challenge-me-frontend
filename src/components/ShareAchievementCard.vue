<template>
  <div class="share-card-root">
    <div
      ref="cardRef"
      class="share-card"
      :class="{ 'share-card--final': isFinal }"
    >
      <div class="sc-bg-pattern"></div>

      <header class="sc-header">
        <div class="sc-brand" :class="{ 'sc-brand--final': isFinal }">
          <Zap :size="16" :color="isFinal ? '#FBBF24' : '#4FD1C5'" :stroke-width="2.5" class="sc-brand-icon" />
          <span>IGNITE-ME.APP</span>
        </div>
        <h2 class="sc-headline" :class="{ 'sc-headline--final': isFinal }">{{ headlineText }}</h2>
        <p class="sc-quest-title">{{ questTitle }}</p>
        <p v-if="stepName && !isFinal" class="sc-step-name">{{ stepName }}</p>
      </header>

      <section class="sc-content" :class="{ 'sc-content--final': isFinal }">
        <!-- Legendary mission accomplished -->
        <template v-if="isFinal">
          <div class="sc-final-content">
            <div class="sc-loot-row">
              <div class="sc-loot-badge sc-loot-badge--xp">
                ✨ +{{ xpEarned }} {{ t('challenges.shareCard.lootXp') }}
              </div>
              <div class="sc-loot-badge sc-loot-badge--sparks">
                ⚡ +{{ sparksEarned }} {{ t('challenges.shareCard.lootSparks') }}
              </div>
            </div>

            <div ref="finalReflectionCardRef" class="sc-text-card sc-text-card--final-reflection">
              <p ref="finalReflectionRef" class="sc-handwritten sc-handwritten--final">{{ fittedFinalReflection }}</p>
            </div>

            <div class="sc-stats-grid">
              <p class="sc-stat">
                🎯 {{ t('challenges.shareCard.statsSteps') }}: {{ stepsDisplay }}
              </p>
              <p class="sc-stat">
                📅 {{ t('challenges.shareCard.statsPeriod') }}: {{ missionDates }}
              </p>
            </div>
          </div>
        </template>

        <!-- Both image and text -->
        <template v-else-if="hasImage && hasText">
          <div class="sc-photo-frame">
            <img :src="userImage" alt="" class="sc-photo" crossorigin="anonymous" />
          </div>
          <div ref="textCardRef" class="sc-text-card">
            <p ref="compactTextRef" class="sc-handwritten sc-handwritten--with-image">{{ fittedImageText }}</p>
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
            <Quote :size="40" :stroke-width="1.5" class="sc-text-only-icon" />
            <div ref="largeTextCardRef" class="sc-text-card">
              <p ref="largeTextRef" class="sc-handwritten sc-handwritten--large">{{ fittedLargeText }}</p>
            </div>
          </div>
        </template>

        <!-- Fallback (no content) -->
        <template v-else>
          <div class="sc-text-only">
            <Trophy :size="72" :stroke-width="1.5" class="sc-text-only-icon" />
          </div>
        </template>
      </section>

      <footer class="sc-footer">
        <div class="sc-level-row">
          <p class="sc-level-line">
            <span class="sc-level-num">LVL {{ displayLevel }}</span>
            <span class="sc-level-sep">|</span>
            <span class="sc-level-rank">{{ displayRankTitle }}</span>
          </p>
          <div class="sc-progress">
            <div class="sc-progress-fill"></div>
          </div>
        </div>
      </footer>
    </div>

    <v-btn
      class="sc-share-btn mt-4"
      block
      size="large"
      :loading="sharing"
      @click="shareCard"
    >
      <UserPlus :size="18" :stroke-width="2.5" class="sc-share-btn-icon" />
      {{ t('challenges.shareCard.shareButton') }}
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Zap, Quote, Trophy, UserPlus } from 'lucide-vue-next'
import { toPng } from 'html-to-image'
import { getLevelInfo } from '../utils/levelSystem'

const props = defineProps({
  questTitle: { type: String, default: '' },
  stepName: { type: String, default: '' },
  userText: { type: String, default: '' },
  userImage: { type: String, default: '' },
  userLevel: { type: [Number, String], default: 1 },
  userRankTitle: { type: String, default: '' },
  isFinal: { type: Boolean, default: false },
  xpEarned: { type: [Number, String], default: 0 },
  sparksEarned: { type: [Number, String], default: 0 },
  completedSteps: { type: [Number, String], default: 0 },
  totalSteps: { type: [Number, String], default: 0 },
  missionDates: { type: String, default: '' }
})

const { t } = useI18n()

const cardRef = ref(null)
const textCardRef = ref(null)
const compactTextRef = ref(null)
const largeTextCardRef = ref(null)
const largeTextRef = ref(null)
const finalReflectionCardRef = ref(null)
const finalReflectionRef = ref(null)
const sharing = ref(false)
const fittedImageText = ref('')
const fittedLargeText = ref('')
const fittedFinalReflection = ref('')

const hasImage = computed(() => !!props.userImage)
const hasText = computed(() => !!(props.userText && props.userText.trim()))

function truncateWithEllipsis(text, maxLines, charsPerLine) {
  const normalized = String(text || '').trim()
  if (!normalized) return ''

  const maxChars = maxLines * charsPerLine
  if (normalized.length <= maxChars) return normalized

  let excerpt = normalized.slice(0, maxChars - 1)
  const lastSpace = excerpt.lastIndexOf(' ')
  if (lastSpace > excerpt.length * 0.5) {
    excerpt = excerpt.slice(0, lastSpace)
  }

  return `${excerpt.trimEnd()}...`
}

const headlineText = computed(() =>
  props.isFinal
    ? t('challenges.shareCard.finalHeader')
    : t('challenges.shareCard.header')
)

const textLineLimit = computed(() => (props.isFinal ? 7 : 10))
const textCharsPerLine = computed(() => (props.isFinal ? 30 : 34))
const largeTextLineLimit = computed(() => (props.isFinal ? 6 : 8))
const largeTextCharsPerLine = computed(() => (props.isFinal ? 32 : 36))

const compactUserText = computed(() =>
  hasText.value
    ? truncateWithEllipsis(props.userText, textLineLimit.value, textCharsPerLine.value)
    : ''
)

const largeTextFallback = computed(() =>
  hasText.value
    ? truncateWithEllipsis(props.userText, largeTextLineLimit.value, largeTextCharsPerLine.value)
    : ''
)

const reflectionSource = computed(() => {
  const custom = String(props.userText || '').trim()
  if (custom) return custom
  return t('challenges.shareCard.defaultTriumphQuote')
})

const finalReflectionFallback = computed(() =>
  truncateWithEllipsis(reflectionSource.value, 5, 28)
)

const stepsDisplay = computed(() => {
  const raw = String(props.completedSteps ?? '')
  if (raw.includes('/')) return raw
  const completed = props.completedSteps || props.totalSteps || 0
  const total = props.totalSteps || completed || 0
  return `${completed}/${total}`
})

const xpEarned = computed(() => props.xpEarned ?? 0)
const sparksEarned = computed(() => props.sparksEarned ?? 0)

function fitTextToContainer(full, container, paragraph, fallbackText) {
  if (!container || !paragraph) {
    return fallbackText
  }

  const style = window.getComputedStyle(container)
  const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
  const maxHeight = container.clientHeight - paddingY

  if (maxHeight < 16) {
    return fallbackText
  }

  const fits = (text) => {
    paragraph.textContent = text
    return paragraph.scrollHeight <= maxHeight + 0.5
  }

  if (fits(full)) {
    return full
  }

  let low = 0
  let high = full.length
  let best = ''

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    let candidate = full.slice(0, mid).trimEnd()
    if (mid < full.length) {
      candidate += '...'
    }

    if (fits(candidate)) {
      best = candidate
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return best || fallbackText
}

function fitImageTextContent() {
  if (props.isFinal || !hasImage.value || !hasText.value) {
    fittedImageText.value = ''
    return
  }

  const full = String(props.userText || '').trim()
  fittedImageText.value = compactUserText.value

  if (!textCardRef.value || !compactTextRef.value) return

  fittedImageText.value = fitTextToContainer(
    full,
    textCardRef.value,
    compactTextRef.value,
    compactUserText.value
  )
}

function fitLargeTextContent() {
  if (props.isFinal || hasImage.value || !hasText.value) {
    fittedLargeText.value = ''
    return
  }

  const full = String(props.userText || '').trim()
  fittedLargeText.value = largeTextFallback.value

  if (!largeTextCardRef.value || !largeTextRef.value) return

  fittedLargeText.value = fitTextToContainer(
    full,
    largeTextCardRef.value,
    largeTextRef.value,
    largeTextFallback.value
  )
}

function fitFinalReflectionContent() {
  if (!props.isFinal) {
    fittedFinalReflection.value = ''
    return
  }

  const full = reflectionSource.value
  fittedFinalReflection.value = finalReflectionFallback.value

  if (!finalReflectionCardRef.value || !finalReflectionRef.value) return

  fittedFinalReflection.value = fitTextToContainer(
    full,
    finalReflectionCardRef.value,
    finalReflectionRef.value,
    finalReflectionFallback.value
  )
}

function fitAllTextContent() {
  if (props.isFinal) {
    fitFinalReflectionContent()
    return
  }
  fitImageTextContent()
  fitLargeTextContent()
}

watch(
  () => [
    props.userText,
    props.userImage,
    props.questTitle,
    props.stepName,
    props.isFinal,
    props.xpEarned,
    props.sparksEarned,
    props.completedSteps,
    props.totalSteps,
    props.missionDates
  ],
  () => nextTick(fitAllTextContent),
  { immediate: true }
)

let resizeObserver = null

onMounted(() => {
  nextTick(() => {
    fitAllTextContent()
    requestAnimationFrame(() => {
      fitAllTextContent()
      requestAnimationFrame(fitAllTextContent)
    })
  })

  nextTick(() => {
    if (typeof ResizeObserver !== 'undefined' && cardRef.value) {
      resizeObserver = new ResizeObserver(() => fitAllTextContent())
      resizeObserver.observe(cardRef.value)
    }
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

const displayLevel = computed(() =>
  Math.max(1, Math.floor(Number(props.userLevel) || 1))
)

const displayRankTitle = computed(() => {
  const fromProp = (props.userRankTitle || '').trim()
  if (fromProp) return fromProp

  const { rankKey } = getLevelInfo(displayLevel.value)
  return t(`profile.ranks.${rankKey}`)
})

async function shareCard() {
  if (!cardRef.value) return

  sharing.value = true
  cardRef.value.classList.add('share-card--export')
  if (props.isFinal) {
    cardRef.value.classList.add('share-card--export-final')
  }

  try {
    await nextTick()
    fitAllTextContent()
    await nextTick()

    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    const images = cardRef.value.querySelectorAll('img')
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise((resolve) => {
          img.onload = resolve
          img.onerror = resolve
        })
      })
    )

    const dataUrl = await toPng(cardRef.value, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: 'transparent'
    })

    const link = document.createElement('a')
    link.download = props.isFinal ? 'ignite-mission-accomplished.png' : 'ignite-achievement.png'
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Share failed:', error)
  } finally {
    cardRef.value?.classList.remove('share-card--export')
    cardRef.value?.classList.remove('share-card--export-final')
    sharing.value = false
  }
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
  /* Сделали фон чуть глубже для контраста с неоном */
  background: linear-gradient(160deg, #131320 0%, #0F172A 55%, #1A1A3A 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px 22px;
  color: #fff;
  border: 1px solid rgba(139, 92, 246, 0.2); /* Фиолетовый оттенок границы */
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.sc-bg-pattern {
  position: absolute;
  inset: 0;
  /* Обновили цвета свечения на фоне: Teal + Purple */
  background-image: 
    radial-gradient(circle at 10% 10%, rgba(79, 209, 197, 0.15), transparent 50%),
    radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.15), transparent 50%);
  pointer-events: none;
}

.sc-header {
  position: relative;
  text-align: center;
  z-index: 2;
  flex-shrink: 0;
}

.sc-brand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(79, 209, 197, 0.15);
  border: 1px solid rgba(79, 209, 197, 0.4);
  color: #4FD1C5;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.sc-brand-icon {
  flex-shrink: 0;
}

.sc-headline {
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: 0.5px;
  line-height: 1.2;
  color: #fff;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.sc-quest-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.85);
}

.sc-step-name {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.sc-content {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 0;
  padding: 16px 0;
  z-index: 2;
  overflow: hidden;
}

.sc-content:has(.sc-text-card),
.sc-content:has(.sc-text-only) {
  gap: 10px;
  justify-content: flex-start;
  padding: 8px 0;
}

.sc-photo-frame {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  /* Двойная рамка-градиент для аватара */
  border: 3px solid transparent;
  background: linear-gradient(#0F172A, #0F172A) padding-box,
              linear-gradient(135deg, #4FD1C5, #8B5CF6) border-box;
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.3), 0 0 40px rgba(139, 92, 246, 0.2);
  flex-shrink: 0;
}

.sc-photo-frame--large {
  width: 100%;
  min-height: 220px;
  height: auto;
  flex: 1;
  max-height: 52%;
  border-radius: 20px;
}

.sc-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sc-text-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 12px 12px;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  display: block;
  overflow: hidden;
}

.sc-handwritten {
  font-family: 'Caveat', 'Segoe Script', cursive;
  font-size: 1.25rem;
  line-height: 1.4;
  text-align: center;
  color: #E2E8F0;
  word-break: break-word;
  width: 100%;
  margin: 0;
}

.sc-handwritten--with-image {
  font-size: 1.05rem;
  line-height: 1.35;
}

.sc-handwritten--large {
  font-size: 1.12rem;
  line-height: 1.38;
}

.sc-text-only {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  text-align: center;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.sc-text-only-icon {
  color: rgba(139, 92, 246, 0.5);
  flex-shrink: 0;
}

.sc-share-btn-icon {
  margin-right: 8px;
  flex-shrink: 0;
}

.sc-footer {
  position: relative;
  text-align: center;
  z-index: 2;
  margin-top: auto;
  flex-shrink: 0;
}

.sc-level-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.sc-level-line {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.3px;
  line-height: 1.25;
}

.sc-level-num {
  color: #FBBF24;
}

.sc-level-sep {
  color: rgba(255, 255, 255, 0.35);
  font-weight: 700;
}

.sc-level-rank {
  color: #fff;
}

.sc-progress {
  flex: 1;
  height: 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.sc-progress-fill {
  width: 72%;
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #4FD1C5, #8B5CF6);
}

/* html-to-image: match on-screen card without blur/gradient-border artifacts */
.share-card--export .sc-handwritten--with-image {
  font-size: 1.05rem !important;
  line-height: 1.35 !important;
}

.share-card--export .sc-text-card {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(30, 41, 59, 0.92);
  border-color: rgba(79, 209, 197, 0.25);
  padding: 12px !important;
}

.share-card--export .sc-handwritten--large {
  font-size: 1.05rem !important;
  line-height: 1.38 !important;
}

.share-card--export .sc-text-only-icon {
  width: 40px !important;
  height: 40px !important;
}

.share-card--export .sc-content:has(.sc-text-card),
.share-card--export .sc-content:has(.sc-text-only) {
  justify-content: flex-start !important;
  padding: 8px 0 !important;
}

.share-card--export .sc-content:not(:has(.sc-text-card)):not(:has(.sc-text-only)) {
  justify-content: center !important;
  overflow: hidden !important;
  padding: 10px 0 !important;
}

.share-card--export .sc-photo-frame {
  border: 3px solid #4FD1C5;
  background: transparent;
}

.share-card--export .sc-photo-frame--large {
  border: 2px solid #4FD1C5;
  box-shadow: 0 0 24px rgba(79, 209, 197, 0.35);
}

.share-card--export .sc-headline {
  text-shadow: none;
}

.share-card--final {
  background: linear-gradient(160deg, #1a1030 0%, #0f172a 48%, #2a1505 100%);
  border-color: rgba(245, 158, 11, 0.45);
  box-shadow:
    inset 0 0 24px rgba(0, 0, 0, 0.55),
    0 0 32px rgba(245, 158, 11, 0.12);
}

.share-card--final .sc-bg-pattern {
  background-image:
    radial-gradient(circle at 12% 8%, rgba(251, 191, 36, 0.22), transparent 52%),
    radial-gradient(circle at 88% 92%, rgba(245, 158, 11, 0.18), transparent 48%),
    radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.12), transparent 60%);
}

.share-card--final .sc-header {
  padding-bottom: 2px;
}

.sc-brand--final {
  background: rgba(251, 191, 36, 0.14);
  border-color: rgba(251, 191, 36, 0.45);
  color: #fbbf24;
}

.sc-headline--final {
  font-size: 0.92rem;
  letter-spacing: 0.35px;
  background: linear-gradient(90deg, #fff 0%, #fbbf24 60%, #f59e0b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
}

.share-card--final .sc-quest-title {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.9);
}

.share-card--final .sc-content:has(.sc-text-card) {
  gap: 8px;
  padding: 6px 0;
}

.sc-content--final {
  gap: 8px;
  justify-content: flex-start;
  padding: 6px 0;
  overflow: hidden;
}

.sc-final-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  flex: 1 1 auto;
  gap: 8px;
  overflow: hidden;
}

.sc-loot-row {
  display: flex;
  gap: 8px;
  width: 100%;
  flex-shrink: 0;
}

.sc-loot-badge {
  flex: 1;
  min-width: 0;
  padding: 8px 6px;
  border-radius: 12px;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.2px;
  text-align: center;
  line-height: 1.25;
  border: 1px solid transparent;
}

.sc-loot-badge--xp {
  color: #e9d5ff;
  background: rgba(112, 72, 232, 0.18);
  border-color: rgba(139, 92, 246, 0.35);
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.22);
}

.sc-loot-badge--sparks {
  color: #fef3c7;
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(251, 191, 36, 0.35);
  box-shadow: 0 0 16px rgba(79, 209, 197, 0.15), 0 0 12px rgba(251, 191, 36, 0.18);
}

.sc-text-card--final-reflection {
  flex: 1 1 auto;
  min-height: 0;
  background: rgba(42, 21, 5, 0.45);
  border-color: rgba(251, 191, 36, 0.2);
}

.sc-handwritten--final {
  font-size: 1.02rem;
  line-height: 1.34;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sc-stats-grid {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(251, 191, 36, 0.12);
}

.sc-stat {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-card--final .sc-photo-frame {
  width: 88px;
  height: 88px;
  background: linear-gradient(#120818, #120818) padding-box,
    linear-gradient(135deg, #fbbf24, #f59e0b) border-box;
  box-shadow: 0 0 22px rgba(251, 191, 36, 0.35), 0 0 36px rgba(245, 158, 11, 0.2);
}

.share-card--final .sc-text-card {
  background: rgba(42, 21, 5, 0.55);
  border-color: rgba(251, 191, 36, 0.22);
}

.share-card--final .sc-handwritten--with-image {
  font-size: 0.98rem;
  line-height: 1.32;
}

.share-card--final .sc-handwritten--large {
  font-size: 1.05rem;
  line-height: 1.35;
}

.share-card--final .sc-level-row {
  border-color: rgba(251, 191, 36, 0.18);
  background: rgba(0, 0, 0, 0.32);
}

.share-card--final .sc-progress-fill {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.share-card--export-final .sc-headline--final {
  background: none !important;
  -webkit-background-clip: unset;
  background-clip: unset;
  color: #fbbf24 !important;
}

.share-card--export-final .sc-text-card {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(42, 21, 5, 0.92) !important;
  border-color: rgba(251, 191, 36, 0.35) !important;
}

.share-card--export-final .sc-photo-frame {
  border: 3px solid #fbbf24;
  background: transparent;
}

.share-card--export-final .sc-handwritten--large {
  font-size: 1rem !important;
  line-height: 1.35 !important;
}

.share-card--export-final .sc-content,
.share-card--export-final .sc-final-content {
  overflow: hidden !important;
}

.share-card--export-final .sc-content {
  justify-content: flex-start !important;
  padding: 6px 0 !important;
}

.share-card--export-final .sc-handwritten--final {
  font-size: 0.95rem !important;
  line-height: 1.32 !important;
  -webkit-line-clamp: 4 !important;
  line-clamp: 4 !important;
}

.share-card--export-final .sc-loot-badge {
  font-size: 0.58rem !important;
  padding: 7px 5px !important;
}

.share-card--export-final .sc-stat {
  font-size: 0.62rem !important;
}

.share-card--export-final .sc-text-card--final-reflection {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(42, 21, 5, 0.92) !important;
  border-color: rgba(251, 191, 36, 0.35) !important;
}

.share-card--export-final .sc-content:has(.sc-text-card) {
  justify-content: flex-start !important;
  padding: 6px 0 !important;
}

.sc-share-btn {
  background: linear-gradient(135deg, #7048E8, #8B5CF6) !important;
  color: #fff !important;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: none;
  border-radius: 14px !important;
  box-shadow: 0 4px 15px rgba(112, 72, 232, 0.4);
}
</style>
