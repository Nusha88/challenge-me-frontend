<template>
  <div class="chronicle-empty">
    <img
      :src="treasureImage"
      :alt="t('home.loggedIn.treasureAlt')"
      class="chronicle-empty-art"
      width="140"
      height="140"
      loading="lazy"
      decoding="async"
    />
    <p class="chronicle-empty-text">{{ t('chronicle.empty.text') }}</p>
    <div class="chronicle-empty-actions">
      <router-link to="/heroes" class="chronicle-empty-primary">
        {{ t('chronicle.empty.addFriends') }}
      </router-link>
      <router-link to="/missions/add?privacy=squad" class="chronicle-empty-secondary">
        {{ t('chronicle.empty.createSquad') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import treasureImage from '../../assets/home/treasure-280.webp'

const { t } = useI18n()
</script>

<style scoped>
.chronicle-empty {
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

.chronicle-empty-art {
  width: 140px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(112, 72, 232, 0.35));
}

.chronicle-empty-text {
  margin: 0;
  max-width: 36ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}

.chronicle-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.chronicle-empty-primary,
.chronicle-empty-secondary {
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
  transition:
    transform 0.25s var(--home-ease, ease),
    border-color 0.25s var(--home-ease, ease);
}

.chronicle-empty-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--home-teal, #4fd1c5), var(--home-purple, #7048e8));
  box-shadow: var(--home-glow-teal, 0 0 16px rgba(79, 209, 197, 0.28));
}

.chronicle-empty-primary:hover,
.chronicle-empty-secondary:hover {
  transform: translateY(-1px);
}

.chronicle-empty-secondary {
  color: var(--home-text, #f1f5f9);
  border: 1px solid var(--home-border-hi, rgba(79, 209, 197, 0.38));
  background: transparent;
}
</style>
