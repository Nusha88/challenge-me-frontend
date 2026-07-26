<template>
  <div class="lp-cta" :class="{ 'lp-cta--block': block }">
    <div class="lp-cta-shell">
      <span class="lp-cta-ring" aria-hidden="true"></span>
      <GradientButton
        :to="SIGN_UP_ROUTE"
        :block="block"
        :size="size"
        class="lp-cta-button"
        @click="handleClick"
      >
        <slot />
      </GradientButton>
    </div>
    <p v-if="note" class="lp-cta-note">{{ note }}</p>
  </div>
</template>

<script setup>
import GradientButton from '../GradientButton.vue'
import { GOALS, reachGoal } from '../../services/analytics'
import { SIGN_UP_ROUTE } from './landingLinks'

const props = defineProps({
  /** Identifies which CTA on the page was used, so the funnel can be split by position. */
  position: { type: String, required: true },
  note: { type: String, default: '' },
  block: { type: Boolean, default: false },
  size: { type: String, default: 'x-large' }
})

function handleClick() {
  reachGoal(GOALS.LANDING_CTA_CLICK, { position: props.position })
}
</script>

<style scoped>
.lp-cta {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 100%;
}

.lp-cta--block {
  display: flex;
  width: 100%;
}

.lp-cta-shell {
  position: relative;
  display: inline-flex;
  max-width: 100%;
}

.lp-cta--block .lp-cta-shell {
  width: 100%;
}

.lp-cta-ring {
  position: absolute;
  inset: -2px;
  border-radius: 26px;
  padding: 2px;
  background: conic-gradient(
    from var(--lp-angle),
    transparent 25%,
    #4fd1c5,
    #a62ee8,
    transparent 75%
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  opacity: 0.85;
  pointer-events: none;
  animation: lp-cta-spin 5s linear infinite;
}

@keyframes lp-cta-spin {
  to {
    --lp-angle: 360deg;
  }
}

.lp-cta-button {
  position: relative;
  max-width: 100%;
  white-space: normal;
}

.lp-cta-note {
  margin: 0;
  font-size: 0.76rem;
  color: var(--lp-text-faint, #64748b);
  letter-spacing: 0.02em;
  text-align: center;
}

@media (max-width: 600px) {
  .lp-cta,
  .lp-cta-shell {
    width: 100%;
  }

  .lp-cta-button {
    width: 100%;
    font-size: 0.86rem !important;
    letter-spacing: 0.06em;
    min-height: 48px !important;
    height: auto !important;
    padding: 10px 20px !important;
  }
}
</style>
