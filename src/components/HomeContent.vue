<template>
  <div ref="rootRef" class="landing-page">
    <div class="landing-backdrop" aria-hidden="true">
      <span class="landing-stars"></span>
      <span class="landing-aurora landing-aurora--teal"></span>
      <span class="landing-aurora landing-aurora--purple"></span>
    </div>

    <main class="landing-content">
      <LandingHero />
      <LandingProofBar />
      <LandingWhySection />
      <LandingMissionTypes />
      <LandingRewards />
      <LandingPrivacy />
      <LandingScreens />
      <LandingPwa />
      <LandingFounder />
      <LandingFaq />
      <LandingFinalCta />
    </main>

    <LandingFooter />
    <LandingStickyCta />
  </div>
</template>

<script setup>
import LandingHero from './landing/LandingHero.vue'
import LandingProofBar from './landing/LandingProofBar.vue'
import LandingWhySection from './landing/LandingWhySection.vue'
import LandingMissionTypes from './landing/LandingMissionTypes.vue'
import LandingRewards from './landing/LandingRewards.vue'
import LandingPrivacy from './landing/LandingPrivacy.vue'
import LandingScreens from './landing/LandingScreens.vue'
import LandingPwa from './landing/LandingPwa.vue'
import LandingFounder from './landing/LandingFounder.vue'
import LandingFaq from './landing/LandingFaq.vue'
import LandingFinalCta from './landing/LandingFinalCta.vue'
import LandingFooter from './landing/LandingFooter.vue'
import LandingStickyCta from './landing/LandingStickyCta.vue'
import { useReveal } from '../composables/useReveal'
import { useScrollDepth } from '../composables/useScrollDepth'

// A single observer drives the scroll-reveal for every section below.
const { rootRef } = useReveal()

useScrollDepth()
</script>

<style scoped>
.landing-page {
  position: relative;
  min-height: 100vh;
  background-color: #0b0d12;
  color: #f1f5f9;
  overflow-x: clip;
  font-family: 'Plus Jakarta Sans', 'Montserrat', sans-serif;
}

.landing-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.landing-stars {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.05) 1px, transparent 0);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 70%);
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 70%);
}

.landing-aurora {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}

.landing-aurora--teal {
  top: -12%;
  right: -8%;
  width: min(560px, 70vw);
  aspect-ratio: 1;
  background: radial-gradient(circle, rgba(79, 209, 197, 0.16), transparent 68%);
}

.landing-aurora--purple {
  top: 42%;
  left: -14%;
  width: min(620px, 80vw);
  aspect-ratio: 1;
  background: radial-gradient(circle, rgba(112, 72, 232, 0.14), transparent 68%);
}

.landing-content {
  position: relative;
  z-index: 1;
}

/* Keeps the last section clear of the fixed mobile CTA bar. */
@media (max-width: 960px) {
  .landing-page {
    padding-bottom: 76px;
  }
}
</style>
