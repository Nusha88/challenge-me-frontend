<template>
  <div v-if="weeklyRitual" class="main-ritual-section">
    <MainRitualCard
      :template="weeklyRitual"
      :reward-sparks="weeklyRewardSparks"
      @use="$emit('use', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import MainRitualCard from '../MainRitualCard.vue'
import { useWeeklyRitualStore } from '../../stores/weeklyRitual'
import { getMissionTemplateById } from '../../constants/missionTemplates'

defineEmits(['use'])

const weeklyRitualStore = useWeeklyRitualStore()
const { currentWeeklyRitualId } = storeToRefs(weeklyRitualStore)
const { weeklyRewardSparks } = weeklyRitualStore

const weeklyRitual = computed(() => getMissionTemplateById(currentWeeklyRitualId.value))
</script>

<style scoped>
.main-ritual-section {
  margin-bottom: clamp(16px, 2.5vw, 28px);
}

@media (max-width: 600px) {
  .main-ritual-section {
    margin-bottom: 14px;
  }
}
</style>
