<template>
  <div class="heroes-empty">
    <img
      :src="treasureImage"
      :alt="t('home.loggedIn.treasureAlt')"
      class="heroes-empty-art"
      width="140"
      height="140"
      loading="lazy"
      decoding="async"
    />
    <p class="heroes-empty-text">{{ text }}</p>
    <div class="heroes-empty-actions">
      <button
        v-if="hasSearch"
        type="button"
        class="heroes-empty-secondary"
        @click="$emit('clear-search')"
      >
        {{ t('users.clearSearch') }}
      </button>
      <router-link
        v-else
        to="/missions"
        class="heroes-empty-primary"
      >
        {{ t('users.explore') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import treasureImage from '../../assets/home/treasure-280.webp'

defineProps({
  text: { type: String, required: true },
  hasSearch: { type: Boolean, default: false }
})

defineEmits(['clear-search'])

const { t } = useI18n()
</script>

<style scoped>
.heroes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  padding: clamp(28px, 5vw, 48px) 16px;
  border-radius: var(--home-radius, 22px);
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.heroes-empty-art {
  width: 140px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(112, 72, 232, 0.35));
}

.heroes-empty-text {
  margin: 0;
  max-width: 36ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}

.heroes-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.heroes-empty-primary,
.heroes-empty-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  font-family: inherit;
  cursor: pointer;
  transition:
    transform 0.25s var(--home-ease, ease),
    border-color 0.25s var(--home-ease, ease);
}

.heroes-empty-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--home-teal, #4fd1c5), var(--home-purple, #7048e8));
  box-shadow: var(--home-glow-teal, 0 0 16px rgba(79, 209, 197, 0.28));
}

.heroes-empty-primary:hover,
.heroes-empty-secondary:hover {
  transform: translateY(-1px);
}

.heroes-empty-secondary {
  color: var(--home-text, #f1f5f9);
  border: 1px solid var(--home-border-hi, rgba(79, 209, 197, 0.38));
  background: transparent;
}
</style>
