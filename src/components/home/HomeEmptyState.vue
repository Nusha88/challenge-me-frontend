<template>
  <div class="home-empty-state">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :alt="imageAlt"
      class="home-empty-art"
      width="140"
      height="140"
      loading="lazy"
      decoding="async"
    />
    <p v-if="text" class="home-empty-text">{{ text }}</p>
    <div v-if="primaryLabel || secondaryLabel || actionLabel" class="home-empty-actions">
      <router-link
        v-if="primaryLabel && primaryTo"
        :to="primaryTo"
        class="home-empty-primary"
      >
        {{ primaryLabel }}
      </router-link>
      <router-link
        v-if="secondaryLabel && secondaryTo"
        :to="secondaryTo"
        class="home-empty-secondary"
      >
        {{ secondaryLabel }}
      </router-link>
      <button
        v-if="actionLabel"
        type="button"
        class="home-empty-primary"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  imageSrc: { type: String, default: '' },
  imageAlt: { type: String, default: '' },
  text: { type: String, default: '' },
  primaryLabel: { type: String, default: '' },
  primaryTo: { type: String, default: '' },
  secondaryLabel: { type: String, default: '' },
  secondaryTo: { type: String, default: '' },
  actionLabel: { type: String, default: '' }
})

defineEmits(['action'])
</script>

<style scoped>
.home-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  padding: 20px 12px 8px;
}

.home-empty-art {
  width: 140px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(112, 72, 232, 0.35));
}

.home-empty-text {
  margin: 0;
  max-width: 32ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.92rem;
  line-height: 1.55;
}

.home-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.home-empty-primary,
.home-empty-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition:
    transform 0.25s var(--home-ease, ease),
    box-shadow 0.25s var(--home-ease, ease),
    border-color 0.25s var(--home-ease, ease);
}

.home-empty-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--home-teal, #4fd1c5), var(--home-purple, #7048e8));
  box-shadow: var(--home-glow-teal, 0 0 16px rgba(79, 209, 197, 0.28));
}

.home-empty-primary:hover {
  transform: translateY(-1px);
}

.home-empty-secondary {
  color: var(--home-text, #f1f5f9);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.home-empty-secondary:hover {
  border-color: var(--home-border-hi, rgba(79, 209, 197, 0.38));
  color: #fff;
}
</style>
