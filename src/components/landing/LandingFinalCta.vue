<template>
  <section class="lp-section">
    <div class="lp-shell">
      <!-- id is read by LandingStickyCta so the bar can hide once this is on screen. -->
      <div id="lp-final-cta" class="final-cta reveal">
        <span class="final-cta-aura" aria-hidden="true"></span>

        <h2 class="final-cta-title">{{ t('home.landing.finalCta.title') }}</h2>
        <p class="final-cta-text">{{ t('home.landing.finalCta.text') }}</p>

        <LandingPrimaryCta position="final" :note="t('home.landing.finalCta.note')">
          {{ t('home.landing.finalCta.button') }}
        </LandingPrimaryCta>

        <button type="button" class="final-cta-demo" @click="startDemoFromLanding">
          {{ t('home.landing.secondaryCta') }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import LandingPrimaryCta from './LandingPrimaryCta.vue'
import { GOALS, reachGoal } from '../../services/analytics'
import { useDemoMode } from '../../composables/useDemoMode'

const { t } = useI18n()
const router = useRouter()
const { startDemo } = useDemoMode()

function startDemoFromLanding() {
  reachGoal(GOALS.LANDING_SECONDARY_CLICK, { position: 'final', action: 'demo' })
  startDemo()
  router.push('/today')
}
</script>

<style scoped>
.final-cta {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: clamp(40px, 7vw, 80px) clamp(20px, 4vw, 48px);
  border-radius: clamp(20px, 3vw, 30px);
  border: 1px solid rgba(79, 209, 197, 0.22);
  background:
    radial-gradient(90% 120% at 50% 0%, rgba(79, 209, 197, 0.14), transparent 62%),
    rgba(16, 20, 30, 0.7);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
}

.final-cta-aura {
  position: absolute;
  bottom: -45%;
  width: 60%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(112, 72, 232, 0.3), transparent 68%);
  filter: blur(60px);
  pointer-events: none;
}

.final-cta-title {
  position: relative;
  font-size: clamp(1.5rem, 3.6vw, 2.4rem);
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
  color: #fff;
  text-wrap: balance;
}

.final-cta-text {
  position: relative;
  font-size: clamp(0.92rem, 1.6vw, 1.05rem);
  line-height: 1.6;
  color: var(--lp-text-dim);
  margin: 0 0 28px;
  max-width: 48ch;
  text-wrap: pretty;
}

.final-cta-demo {
  position: relative;
  margin-top: 14px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--lp-teal);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.final-cta-demo:hover {
  color: #7ee8dd;
}
</style>
