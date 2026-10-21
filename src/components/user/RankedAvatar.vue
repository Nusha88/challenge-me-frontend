<template>
  <div
    class="ranked-avatar"
    :class="{
      'is-dimmed': dimmed,
      'is-clickable': clickable
    }"
    :style="rootStyle"
  >
    <div class="ranked-avatar-ring">
      <div class="ranked-avatar-face">
        <img
          v-if="faceSrc"
          :src="faceSrc"
          :alt="alt"
        >
        <span v-else class="ranked-avatar-initials">{{ initials || '?' }}</span>
        <div v-if="$slots.overlay" class="ranked-avatar-overlay">
          <slot name="overlay" />
        </div>
      </div>
    </div>
    <div
      v-if="tier > 0"
      class="ranked-avatar-stars"
      aria-hidden="true"
    >
      <span
        v-for="n in tier"
        :key="n"
        class="ranked-avatar-star"
      >✦</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getLevelInfo, getRankTier } from '../../utils/levelSystem'
import { getShadowAvatarDataUri } from '../../utils/shadowAvatar'

const props = defineProps({
  avatarUrl: { type: String, default: '' },
  seed: { type: [String, Number], default: '' },
  initials: { type: String, default: '?' },
  alt: { type: String, default: '' },
  size: { type: [Number, String], default: 48 },
  level: { type: Number, default: 1 },
  dimmed: { type: Boolean, default: false },
  clickable: { type: Boolean, default: false }
})

function colorWithAlpha(hex, alpha) {
  const raw = String(hex || '').replace('#', '')
  if (raw.length !== 6) return `rgba(33, 150, 243, ${alpha})`
  const n = parseInt(raw, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const sizePx = computed(() => Math.max(24, Number(props.size) || 48))
const info = computed(() => getLevelInfo(props.level))
const tier = computed(() => getRankTier(props.level))
const faceSrc = computed(() => {
  if (props.avatarUrl) return props.avatarUrl
  if (props.seed) return getShadowAvatarDataUri(props.seed, info.value.color)
  return ''
})

const rootStyle = computed(() => {
  const color = info.value.color
  return {
    '--avatar-size': `${sizePx.value}px`,
    '--avatar-color': color,
    '--avatar-ring': colorWithAlpha(color, 0.72),
    '--avatar-glow': colorWithAlpha(color, 0.45),
    '--star-size': `${Math.max(8, Math.round(sizePx.value * 0.14))}px`
  }
})
</script>

<style scoped>
.ranked-avatar {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  width: var(--avatar-size);
  flex-shrink: 0;
}

.ranked-avatar-ring {
  width: var(--avatar-size);
  height: var(--avatar-size);
  border-radius: 50%;
  padding: 3px;
  background: radial-gradient(circle at 30% 25%, var(--avatar-glow), transparent 58%);
  box-shadow:
    0 0 0 2px var(--avatar-ring),
    0 0 16px var(--avatar-glow);
  transition: box-shadow 0.25s ease, filter 0.25s ease, opacity 0.25s ease;
}

.ranked-avatar-face {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: #1a1a2e;
}

.ranked-avatar-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ranked-avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #4fd1c5;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  font-size: calc(var(--avatar-size) * 0.32);
}

.ranked-avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
}

.ranked-avatar-stars {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-top: 4px;
  min-height: var(--star-size);
  line-height: 1;
}

.ranked-avatar-star {
  font-size: var(--star-size);
  color: var(--avatar-color);
  text-shadow: 0 0 8px var(--avatar-glow);
}

.is-clickable {
  cursor: pointer;
}

.is-dimmed .ranked-avatar-ring {
  box-shadow:
    0 0 0 2px rgba(148, 163, 184, 0.35),
    0 0 8px rgba(15, 23, 42, 0.4);
  filter: saturate(0.35);
  opacity: 0.72;
}

.is-dimmed .ranked-avatar-star {
  color: #64748b;
  text-shadow: none;
  opacity: 0.55;
}
</style>
