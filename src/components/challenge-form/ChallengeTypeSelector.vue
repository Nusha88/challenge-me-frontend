<template>
  <div class="challenge-type-section">
    <div class="challenge-type-grid" role="tablist" :aria-label="t('challenges.launch.title')">
      <button
        type="button"
        class="type-card type-card--ritual"
        role="tab"
        :aria-selected="modelValue === CHALLENGE_TYPES.HABIT"
        :class="{ 'is-active': modelValue === CHALLENGE_TYPES.HABIT }"
        @click="select(CHALLENGE_TYPES.HABIT)"
      >
        <div class="icon-box">
          <v-icon size="28">mdi-fire</v-icon>
        </div>
        <div class="text-block">
          <h3 class="type-title">{{ t('challenges.typeHabit') }}</h3>
          <p class="type-description">{{ t('challenges.typeHabitDescription') }}</p>
        </div>
        <v-icon
          v-if="modelValue === CHALLENGE_TYPES.HABIT"
          class="selection-check"
          size="22"
        >
          mdi-check-circle
        </v-icon>
      </button>

      <button
        type="button"
        class="type-card type-card--quest"
        role="tab"
        :aria-selected="modelValue === CHALLENGE_TYPES.RESULT"
        :class="{ 'is-active': modelValue === CHALLENGE_TYPES.RESULT }"
        @click="select(CHALLENGE_TYPES.RESULT)"
      >
        <div class="icon-box">
          <v-icon size="28">mdi-sword</v-icon>
        </div>
        <div class="text-block">
          <h3 class="type-title">{{ t('challenges.typeResult') }}</h3>
          <p class="type-description">{{ t('challenges.typeResultDescription') }}</p>
        </div>
        <v-icon
          v-if="modelValue === CHALLENGE_TYPES.RESULT"
          class="selection-check"
          size="22"
        >
          mdi-check-circle
        </v-icon>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { CHALLENGE_TYPES } from '../../constants/challengeTypes'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

function select(type) {
  if (props.modelValue !== type) {
    emit('update:modelValue', type)
  }
}
</script>

<style scoped>
.challenge-type-section {
  width: 100%;
  margin-bottom: clamp(16px, 2.5vw, 24px);
}

.challenge-type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 600px) {
  .challenge-type-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

.type-card {
  appearance: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--home-radius, 22px);
  padding: 16px 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  font-family: inherit;
  color: inherit;
  transition:
    border-color 0.25s var(--home-ease, ease),
    background 0.25s var(--home-ease, ease),
    transform 0.25s var(--home-ease, ease);
}

.type-card .icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.05));
  color: var(--home-text-dim, #94a3b8);
}

.type-card .type-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
  letter-spacing: 0.02em;
}

.type-card .type-description {
  margin: 0;
  font-size: 0.8rem;
  color: var(--home-text-dim, #94a3b8);
  line-height: 1.4;
}

.type-card .selection-check {
  color: var(--home-teal, #4fd1c5);
}

.type-card--ritual.is-active {
  border-color: rgba(112, 72, 232, 0.55);
  background: rgba(112, 72, 232, 0.12);
}

.type-card--ritual.is-active .icon-box {
  background: var(--home-purple, #7048e8);
  color: #fff;
}

.type-card--ritual.is-active .selection-check {
  color: var(--home-purple, #a78bfa);
}

.type-card--quest.is-active {
  border-color: rgba(79, 209, 197, 0.5);
  background: rgba(79, 209, 197, 0.1);
}

.type-card--quest.is-active .icon-box {
  background: var(--home-teal, #4fd1c5);
  color: #0d111c;
}

.type-card:hover:not(.is-active) {
  transform: translateY(-1px);
  border-color: var(--home-border-hi, rgba(79, 209, 197, 0.28));
}

@media (max-width: 600px) {
  .type-card {
    padding: 14px;
  }

  .type-card .icon-box {
    width: 42px;
    height: 42px;
  }
}
</style>
