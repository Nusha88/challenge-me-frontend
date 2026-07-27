<template>
  <div class="watched-empty">
    <div class="watched-empty-radar" aria-hidden="true">
      <div class="ring"></div>
      <div class="ring"></div>
      <div class="ring"></div>
      <img
        :src="treasureImage"
        :alt="t('home.loggedIn.treasureAlt')"
        class="watched-empty-art"
        width="120"
        height="120"
        loading="lazy"
        decoding="async"
      />
    </div>
    <p class="watched-empty-text">{{ t('watched.empty.text') }}</p>
    <div class="watched-empty-actions">
      <router-link to="/missions" class="watched-empty-primary">
        {{ t('watched.empty.explore') }}
      </router-link>
      <router-link to="/heroes" class="watched-empty-secondary">
        {{ t('watched.empty.findHeroes') }}
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
.watched-empty {
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

.watched-empty-radar {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(79, 209, 197, 0.28);
  border-radius: 50%;
  animation: radar-ring 3s infinite ease-out;
}

.ring:nth-child(2) {
  animation-delay: 1s;
}

.ring:nth-child(3) {
  animation-delay: 2s;
}

@keyframes radar-ring {
  0% {
    transform: scale(0.55);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

.watched-empty-art {
  position: relative;
  z-index: 1;
  width: 120px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(112, 72, 232, 0.35));
}

.watched-empty-text {
  margin: 0;
  max-width: 36ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}

.watched-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.watched-empty-primary,
.watched-empty-secondary {
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

.watched-empty-primary {
  color: #fff;
  background: linear-gradient(135deg, var(--home-teal, #4fd1c5), var(--home-purple, #7048e8));
  box-shadow: var(--home-glow-teal, 0 0 16px rgba(79, 209, 197, 0.28));
}

.watched-empty-primary:hover,
.watched-empty-secondary:hover {
  transform: translateY(-1px);
}

.watched-empty-secondary {
  color: var(--home-text, #f1f5f9);
  border: 1px solid var(--home-border-hi, rgba(79, 209, 197, 0.38));
  background: transparent;
}
</style>
