<template>
  <Transition name="sticky-cta">
    <div v-if="visible" class="sticky-cta">
      <div class="sticky-cta-inner">
        <div class="sticky-cta-copy">
          <span class="sticky-cta-title">{{ t('home.landing.finalCta.title') }}</span>
          <span class="sticky-cta-note">{{ t('home.landing.finalCta.note') }}</span>
        </div>
        <LandingPrimaryCta position="sticky" size="default">
          {{ t('home.landing.stickyCta') }}
        </LandingPrimaryCta>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import LandingPrimaryCta from './LandingPrimaryCta.vue'

const { t } = useI18n()

const scrolledPastHero = ref(false)
const finalCtaOnScreen = ref(false)

/* Redundant while the full-size closing CTA is already in view. */
const visible = computed(() => scrolledPastHero.value && !finalCtaOnScreen.value)

let frame = null
let finalCtaObserver = null

/*
 * Appears once the hero CTA has scrolled away, so a visitor reading the middle of
 * the page never has to scroll back up to sign up. Keyed off viewport height
 * rather than a ref into the hero, so the two components stay independent.
 */
function measure() {
  frame = null
  scrolledPastHero.value = window.scrollY > window.innerHeight * 0.9
}

function onScroll() {
  if (frame === null) {
    frame = requestAnimationFrame(measure)
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  measure()

  const finalCta = document.getElementById('lp-final-cta')
  if (!finalCta || typeof IntersectionObserver === 'undefined') return

  finalCtaObserver = new IntersectionObserver(
    ([entry]) => {
      finalCtaOnScreen.value = entry.isIntersecting
    },
    { threshold: 0.25 }
  )
  finalCtaObserver.observe(finalCta)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (frame !== null) cancelAnimationFrame(frame)
  finalCtaObserver?.disconnect()
})
</script>

<style scoped>
.sticky-cta {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1200;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(8, 11, 17, 0.86);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-top: 1px solid rgba(79, 209, 197, 0.2);
}

.sticky-cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  max-width: var(--lp-shell);
  margin: 0 auto;
}

.sticky-cta-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sticky-cta-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sticky-cta-note {
  font-size: 0.68rem;
  color: var(--lp-text-faint);
  line-height: 1.3;
}

.sticky-cta :deep(.lp-cta),
.sticky-cta :deep(.lp-cta-shell) {
  width: auto;
  flex-shrink: 0;
}

.sticky-cta :deep(.lp-cta-button) {
  width: auto;
  font-size: 0.78rem !important;
  min-height: 42px !important;
  padding: 0 18px !important;
  white-space: nowrap;
}

.sticky-cta-enter-active,
.sticky-cta-leave-active {
  transition: transform 0.35s var(--lp-ease), opacity 0.35s var(--lp-ease);
}

.sticky-cta-enter-from,
.sticky-cta-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Desktop keeps the in-page CTAs; a fixed bar there is just clutter. */
@media (min-width: 961px) {
  .sticky-cta {
    display: none;
  }
}
</style>
