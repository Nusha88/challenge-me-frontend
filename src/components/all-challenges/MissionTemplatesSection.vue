<template>
  <div class="mission-templates-section">
    <MissionSectionDivider
      :label="t('allChallenges.templates.title')"
      icon="mdi-lightning-bolt-outline"
      :count="templates.length"
    />

    <div class="templates-carousel">
      <button
        v-show="canScrollLeft"
        type="button"
        class="carousel-btn carousel-btn--prev"
        :aria-label="t('allChallenges.templates.prev')"
        @click="scrollByCard(-1)"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </button>

      <div
        ref="trackRef"
        class="templates-track"
        tabindex="0"
        :aria-label="t('allChallenges.templates.title')"
        @scroll="onScroll"
      >
        <div
          v-for="template in templates"
          :key="template.id"
          class="templates-slide"
        >
          <MissionTemplateCard
            :template="template"
            :is-weekly-ritual="isWeeklyRitual(template.id)"
            :participants="getParticipants(template.id)"
            @use="launchTemplate"
          />
        </div>
      </div>

      <button
        v-show="canScrollRight"
        type="button"
        class="carousel-btn carousel-btn--next"
        :aria-label="t('allChallenges.templates.next')"
        @click="scrollByCard(1)"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MissionSectionDivider from '../MissionSectionDivider.vue'
import MissionTemplateCard from './MissionTemplateCard.vue'
import { getMissionTemplates } from '../../constants/missionTemplates'
import { useWeeklyRitualStore } from '../../stores/weeklyRitual'
import { useMissionTemplateLaunch } from '../../composables/useMissionTemplateLaunch'
import { useTemplateParticipants } from '../../composables/useTemplateParticipants'

const { t } = useI18n()
const { isWeeklyRitual } = useWeeklyRitualStore()
const { launchTemplate } = useMissionTemplateLaunch()
const { getParticipants } = useTemplateParticipants()

const templates = computed(() => getMissionTemplates())

const trackRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
let scrollFrame = null

function updateScrollState() {
  const track = trackRef.value
  if (!track) return

  const maxScroll = track.scrollWidth - track.clientWidth
  canScrollLeft.value = track.scrollLeft > 8
  canScrollRight.value = track.scrollLeft < maxScroll - 8
}

function onScroll() {
  if (scrollFrame !== null) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = null
    updateScrollState()
  })
}

function getSlideStep() {
  const track = trackRef.value
  const slide = track?.querySelector('.templates-slide')
  if (!slide) return track?.clientWidth || 0
  const styles = window.getComputedStyle(track)
  const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0
  return slide.getBoundingClientRect().width + gap
}

function scrollByCard(direction) {
  const track = trackRef.value
  if (!track) return

  track.scrollBy({
    left: getSlideStep() * direction,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth'
  })
}

onMounted(async () => {
  await nextTick()
  updateScrollState()
  window.addEventListener('resize', updateScrollState)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollState)
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
})
</script>

<style scoped>
.mission-templates-section {
  margin-bottom: clamp(16px, 2.5vw, 28px);
  min-width: 0;
  max-width: 100%;
}

.templates-carousel {
  position: relative;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  contain: inline-size;
}

.templates-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(280px, 320px);
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 8px 4px 12px;
  touch-action: pan-x;
}

.templates-track::-webkit-scrollbar {
  display: none;
}

.templates-slide {
  min-width: 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.templates-slide :deep(.mission-template-card) {
  width: 100%;
  height: 100%;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  background: rgba(13, 17, 28, 0.82);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.carousel-btn--prev {
  left: 4px;
}

.carousel-btn--next {
  right: 4px;
}

@media (max-width: 600px) {
  .mission-templates-section {
    margin-bottom: 14px;
  }

  .templates-track {
    grid-auto-columns: 82%;
    gap: 12px;
    padding-inline-end: 20px;
  }

  .carousel-btn {
    display: none;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .templates-track {
    grid-auto-columns: minmax(260px, 46%);
  }
}
</style>
