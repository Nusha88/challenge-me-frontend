<template>
  <div class="demo-banner">
    <p class="demo-banner-text">{{ t('demo.bannerText') }}</p>
    <v-btn
      class="demo-banner-cta"
      size="small"
      variant="flat"
      :to="registerTo"
    >
      {{ t('demo.saveHero') }}
    </v-btn>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  registerTo: {
    type: String,
    default: '/register?from=demo'
  }
})

const { t } = useI18n()
</script>

<style scoped>
.demo-banner {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -8px -10px 12px;
  padding: 10px 14px;
  background: linear-gradient(90deg, rgba(112, 72, 232, 0.22), rgba(79, 209, 197, 0.16));
  border: 1px solid rgba(112, 72, 232, 0.35);
  border-radius: 14px;
}

.demo-banner-text {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.88);
}

.demo-banner-cta {
  flex-shrink: 0;
  background: linear-gradient(135deg, #7048E8, #4FD1C5) !important;
  color: #fff !important;
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.01em;
}

@media (min-width: 960px) {
  .demo-banner {
    margin: -8px 0 16px;
  }
}

@media (max-width: 600px) {
  .demo-banner {
    gap: 8px;
    padding: 8px 10px;
  }

  .demo-banner-text {
    font-size: 0.78rem;
    line-height: 1.3;
  }
}
</style>
