<template>
  <div class="challenge-type-section mb-4">
    <div class="challenge-type-grid">
      <div
        class="type-card habit-style"
        :class="{ 'is-active': modelValue === CHALLENGE_TYPES.HABIT }"
        @click="select(CHALLENGE_TYPES.HABIT)"
      >
        <div class="type-card-content">
          <div class="icon-box">
            <v-icon size="32">mdi-sync</v-icon>
          </div>
          <div class="text-block">
            <h3 class="type-title">{{ t('challenges.typeHabit') }}</h3>
            <div class="type-description">{{ t('challenges.typeHabitDescription') }}</div>
          </div>
          <div class="selection-indicator">
            <v-icon v-if="modelValue === CHALLENGE_TYPES.HABIT">mdi-check-circle</v-icon>
            <div v-else class="empty-circle"></div>
          </div>
        </div>
      </div>

      <div
        class="type-card result-style"
        :class="{ 'is-active': modelValue === CHALLENGE_TYPES.RESULT }"
        @click="select(CHALLENGE_TYPES.RESULT)"
      >
        <div class="type-card-content">
          <div class="icon-box">
            <v-icon size="32">mdi-medal-outline</v-icon>
          </div>
          <div class="text-block">
            <h3 class="type-title">{{ t('challenges.typeResult') }}</h3>
            <div class="type-description">{{ t('challenges.typeResultDescription') }}</div>
          </div>
          <div class="selection-indicator">
            <v-icon v-if="modelValue === CHALLENGE_TYPES.RESULT">mdi-check-circle</v-icon>
            <div v-else class="empty-circle"></div>
          </div>
        </div>
      </div>
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
}

.challenge-type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

@media (max-width: 600px) {
  .challenge-type-grid {
    grid-template-columns: 1fr;
  }
}

.type-card {
  position: relative;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.type-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.type-card .icon-box {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.5);
}

.type-card .type-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-card .type-description {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
  margin: 0;
}

.type-card .selection-indicator {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
}

.type-card .selection-indicator .empty-circle {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
}

.type-card .selection-indicator .v-icon {
  font-size: 26px;
  color: inherit;
}

.type-card.habit-style.is-active {
  border-color: #7048E8 !important;
  background: rgba(112, 72, 232, 0.1) !important;
  box-shadow: 0 0 20px rgba(112, 72, 232, 0.2) !important;
}

.type-card.habit-style.is-active .icon-box {
  background: #7e46c4;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(126, 70, 196, 0.3);
}

.type-card.habit-style.is-active .selection-indicator .v-icon {
  color: #7e46c4 !important;
}

.type-card.result-style.is-active {
  border-color: #4FD1C5 !important;
  background: rgba(79, 209, 197, 0.1) !important;
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.2);
}

.type-card.result-style.is-active .icon-box {
  background: #4FD1C5;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(79, 209, 197, 0.3);
}

.type-card.result-style.is-active .selection-indicator .v-icon {
  color: #4FD1C5 !important;
}

.type-card:hover:not(.is-active) {
  transform: translateY(-4px);
  border-color: #e2e8f0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}
</style>
