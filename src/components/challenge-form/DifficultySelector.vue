<template>
  <div class="difficulty-section" :class="{ 'difficulty-section--disabled': disabled }">
    <p class="field-label mb-4">{{ t('challenges.difficultyTitle') }}</p>

    <div class="diff-cards-container">
      <div
        class="diff-option easy"
        :class="{ active: difficulty === 'easy' }"
        @click="!disabled && (difficulty = 'easy')"
      >
        <div class="diff-icon">
          <v-icon>mdi-leaf</v-icon>
        </div>
        <div class="diff-content">
          <span class="diff-name">{{ t('challenges.difficultyEasy') }}</span>
          <span class="diff-xp">+50 XP</span>
        </div>
        <v-icon class="check-icon" size="20">mdi-check-circle</v-icon>
      </div>

      <div
        class="diff-option normal"
        :class="{ active: difficulty === 'medium' }"
        @click="!disabled && (difficulty = 'medium')"
      >
        <div class="diff-icon">
          <v-icon>mdi-sword</v-icon>
        </div>
        <div class="diff-content">
          <span class="diff-name">{{ t('challenges.difficultyMedium') }}</span>
          <span class="diff-xp">+150 XP</span>
        </div>
        <v-icon class="check-icon" size="20">mdi-check-circle</v-icon>
      </div>

      <div
        class="diff-option heroic"
        :class="{ active: difficulty === 'heroic' }"
        @click="!disabled && (difficulty = 'heroic')"
      >
        <div class="diff-icon">
          <v-icon>mdi-fire</v-icon>
        </div>
        <div class="diff-content">
          <span class="diff-name">{{ t('challenges.difficultyHeroic') }}</span>
          <span class="diff-xp">+500 XP</span>
        </div>
        <v-icon class="check-icon" size="20">mdi-check-circle</v-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  disabled: { type: Boolean, default: false }
})

const difficulty = defineModel('difficulty', { type: String, default: 'medium' })

const { t } = useI18n()
</script>

<style scoped>
.difficulty-section--disabled {
  opacity: 0.65;
  pointer-events: none;
}
</style>
