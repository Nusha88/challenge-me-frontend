<template>
  <section class="lp-section">
    <div class="lp-shell faq-shell">
      <header class="lp-section-head lp-section-head--center reveal">
        <p class="lp-eyebrow">{{ t('home.landing.faq.eyebrow') }}</p>
        <h2 class="lp-h2">{{ t('home.landing.faq.title') }}</h2>
      </header>

      <v-expansion-panels
        v-model="openPanel"
        variant="accordion"
        class="faq-panels reveal reveal-1"
      >
        <v-expansion-panel
          v-for="item in items"
          :key="item"
          :value="item"
          class="faq-panel"
          elevation="0"
        >
          <v-expansion-panel-title class="faq-question">
            {{ t(`home.landing.faq.${item}Question`) }}
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            {{ t(`home.landing.faq.${item}Answer`) }}
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { GOALS, reachGoal } from '../../services/analytics'

const { t } = useI18n()

const items = ['free', 'download', 'privacy', 'alone', 'fail']

const openPanel = ref(null)

watch(openPanel, (value) => {
  if (value) reachGoal(GOALS.FAQ_OPEN, { question: value })
})
</script>

<style scoped>
.faq-shell {
  max-width: 820px;
}

.faq-panels {
  border-radius: var(--lp-radius) !important;
  overflow: hidden;
  border: 1px solid var(--lp-border);
  background: transparent;
}

.faq-panel {
  background: rgba(255, 255, 255, 0.02) !important;
  color: var(--lp-text) !important;
  border-bottom: 1px solid var(--lp-border);
}

.faq-panel:last-child {
  border-bottom: none;
}

.faq-question {
  font-size: 0.95rem !important;
  font-weight: 700;
  color: #fff !important;
  min-height: 58px !important;
  padding-inline: clamp(16px, 2.4vw, 24px) !important;
}

.faq-question :deep(.v-expansion-panel-title__overlay) {
  background: rgba(79, 209, 197, 0.06);
}

.faq-answer {
  font-size: 0.88rem;
  line-height: 1.7;
  color: var(--lp-text-dim) !important;
}

.faq-answer :deep(.v-expansion-panel-text__wrapper) {
  padding: 0 clamp(16px, 2.4vw, 24px) 18px;
}

.faq-panels :deep(.v-expansion-panel__shadow) {
  display: none;
}

.faq-panels :deep(.v-expansion-panel-title__icon .v-icon) {
  color: var(--lp-teal) !important;
}

@media (max-width: 600px) {
  .faq-question {
    font-size: 0.87rem !important;
    min-height: 52px !important;
  }

  .faq-answer {
    font-size: 0.81rem;
  }
}
</style>
