<template>
  <div class="mission-section-divider" :class="{ 'is-flush-top': flushTop }">
    <span class="mission-section-divider-label">
      <v-icon :icon="icon" size="14" />
      {{ label }}
      <span v-if="count" class="mission-section-divider-count">{{ count }}</span>
    </span>
    <span class="mission-section-divider-line"></span>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'mdi-archive-outline'
  },
  count: {
    type: Number,
    default: 0
  },
  flushTop: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.mission-section-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 32px 0 16px;
}

.mission-section-divider.is-flush-top {
  margin-top: 0;
}

.mission-section-divider-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.mission-section-divider-count {
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.55);
}

/* Линия гаснет к правому краю, чтобы разделитель не спорил с карточками */
.mission-section-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.16) 0%,
    rgba(255, 255, 255, 0.04) 60%,
    transparent 100%
  );
}

@media (max-width: 600px) {
  .mission-section-divider {
    margin: 24px 0 12px;
  }

  .mission-section-divider.is-flush-top {
    margin-top: 0;
  }
}
</style>
