<template>
  <section class="lp-section why-section">
    <div class="lp-shell why-shell">
      <header class="lp-section-head reveal">
        <p class="lp-eyebrow">{{ t('home.landing.why.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('home.landing.why.title') }}</h2>
        <p class="lp-lead">{{ t('home.landing.why.lead') }}</p>
      </header>

      <!--
        Clip wrapper keeps the track's scroll width from expanding the page.
        Without it, negative/percentage flex math on mobile creates document-level
        horizontal scroll.
      -->
      <div class="why-carousel">
        <ul
          ref="trackRef"
          class="why-track"
          tabindex="0"
          :aria-label="t('home.landing.why.title')"
          @scroll="onScroll"
        >
          <li
            v-for="(insight, index) in insights"
            :key="insight.id"
            v-spotlight
            class="lp-card lp-card--spotlight why-card reveal"
            :class="`reveal-${Math.min(index + 1, 5)}`"
          >
            <span class="lp-icon-tile" :class="insight.tone">
              <v-icon>{{ insight.icon }}</v-icon>
            </span>

            <h3 class="lp-card-title">{{ t(`home.landing.why.${insight.id}.title`) }}</h3>

            <p class="why-problem">{{ t(`home.landing.why.${insight.id}.problem`) }}</p>

            <div class="why-solution">
              <span class="why-solution-label">
                <v-icon size="14">mdi-arrow-right-bottom</v-icon>
                {{ t('home.landing.why.solutionLabel') }}
              </span>
              <p class="lp-card-text">{{ t(`home.landing.why.${insight.id}.solution`) }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="why-dots" role="tablist" :aria-label="t('home.landing.why.title')">
        <button
          v-for="(insight, index) in insights"
          :key="`dot-${insight.id}`"
          type="button"
          class="why-dot"
          role="tab"
          :aria-selected="index === activeIndex"
          :aria-label="t(`home.landing.why.${insight.id}.title`)"
          @click="scrollTo(index)"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { vSpotlight } from '../../composables/useSpotlight'

const { t } = useI18n()

const insights = [
  { id: 'motivation', icon: 'mdi-lightning-bolt-outline', tone: '' },
  { id: 'social', icon: 'mdi-bullhorn-outline', tone: 'lp-icon-tile--purple' },
  { id: 'together', icon: 'mdi-account-group-outline', tone: '' },
  { id: 'privacy', icon: 'mdi-shield-lock-outline', tone: 'lp-icon-tile--purple' },
  { id: 'scale', icon: 'mdi-stairs-up', tone: 'lp-icon-tile--gold' }
]

const trackRef = ref(null)
const activeIndex = ref(0)
let scrollFrame = null
let mediaQuery = null

function syncActiveFromScroll() {
  scrollFrame = null
  const track = trackRef.value
  if (!track) return

  const cards = track.children
  if (!cards.length) return

  const trackLeft = track.scrollLeft
  let nearest = 0
  let nearestDistance = Infinity

  for (let i = 0; i < cards.length; i += 1) {
    const distance = Math.abs(cards[i].offsetLeft - trackLeft)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = i
    }
  }

  activeIndex.value = nearest
}

function onScroll() {
  if (scrollFrame !== null) return
  scrollFrame = requestAnimationFrame(syncActiveFromScroll)
}

function scrollTo(index) {
  const track = trackRef.value
  const card = track?.children?.[index]
  if (!card) return

  card.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    inline: 'start',
    block: 'nearest'
  })
  activeIndex.value = index
}

function onBreakpointChange() {
  // Leaving mobile resets scroll so a mid-carousel position does not leave the
  // first card clipped when the layout switches back to a grid.
  if (mediaQuery && !mediaQuery.matches && trackRef.value) {
    trackRef.value.scrollLeft = 0
    activeIndex.value = 0
  }
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 639px)')
  mediaQuery.addEventListener('change', onBreakpointChange)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onBreakpointChange)
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
})
</script>

<style scoped>
.why-section,
.why-shell,
.why-carousel {
  min-width: 0;
  max-width: 100%;
}

.why-carousel {
  width: 100%;
}

.why-track {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(12px, 1.8vw, 20px);
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 640px) {
  .why-track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* Five cards over two columns would leave the last one half-width and orphaned. */
  .why-card:last-child {
    grid-column: 1 / -1;
  }
}

/*
 * Three across, then the remaining two centred underneath. A six-column track
 * with two-column cards is what makes the second row line up under the first.
 */
@media (min-width: 1000px) {
  .why-track {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .why-card {
    grid-column: span 2;
  }

  .why-card:nth-child(4) {
    grid-column: 2 / span 2;
  }

  .why-card:nth-child(5) {
    grid-column: 4 / span 2;
  }
}

/*
 * Mobile carousel via grid columns, not flex-basis percentages. Flex items with
 * a % basis contribute that size to the parent's min-content width and blow the
 * page out sideways; grid-auto-columns resolve against the track's own width.
 */
@media (max-width: 639px) {
  .why-section {
    overflow-x: clip;
  }

  .why-carousel {
    overflow: hidden;
    /* Contain inline size so the track's scroll width cannot widen ancestors. */
    contain: inline-size;
  }

  .why-track {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 88%;
    grid-template-columns: none;
    gap: 12px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-inline-end: 12px;
  }

  .why-track::-webkit-scrollbar {
    display: none;
  }

  .why-card {
    box-sizing: border-box;
    width: auto;
    max-width: none;
    min-width: 0;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  .why-card:last-child {
    grid-column: auto;
  }
}

.why-card {
  display: flex;
  flex-direction: column;
}

.why-problem {
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--lp-text-dim);
  margin: 0 0 14px;
}

.why-solution {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--lp-border);
}

.why-solution-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lp-teal);
  margin-bottom: 6px;
}

.why-solution-label .v-icon {
  color: var(--lp-teal) !important;
}

.why-solution .lp-card-text {
  color: #cbd5e1;
}

.why-dots {
  display: none;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

@media (max-width: 639px) {
  .why-dots {
    display: flex;
  }
}

.why-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  cursor: pointer;
  transition: width 0.25s var(--lp-ease), background 0.25s var(--lp-ease);
}

.why-dot[aria-selected='true'] {
  width: 22px;
  background: var(--lp-teal);
}

.why-dot:focus-visible {
  outline: 2px solid rgba(79, 209, 197, 0.8);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .why-dot {
    transition: none;
  }
}
</style>
