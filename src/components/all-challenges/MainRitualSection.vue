<template>
  <div v-if="weeklyRitual" class="main-ritual-section">
    <MainRitualCard
      :template="weeklyRitual"
      :reward-sparks="weeklyRewardSparks"
      :is-joined="isJoined"
      :current-day="currentDay"
      :total-days="totalDays"
      :can-check-in="canCheckIn"
      :checking-in="checkingIn"
      :companions-count="companionsCount"
      :visible-companions="visibleCompanions"
      :hidden-companions-count="hiddenCompanionsCount"
      @use="$emit('use', $event)"
      @check-in="checkInToday"
      @open="openJoinedChallenge"
      @open-hero="openHero"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import MainRitualCard from '../MainRitualCard.vue'
import { useWeeklyRitualStore } from '../../stores/weeklyRitual'
import { useWeeklyRitualStatus } from '../../composables/useWeeklyRitualStatus'
import { useDemoMode } from '../../composables/useDemoMode'
import { getMissionTemplateById } from '../../constants/missionTemplates'
import { openMissionDetails } from '../../utils/openMissionDetails'

defineEmits(['use'])

const router = useRouter()
const { requireAuthOrPrompt } = useDemoMode()
const weeklyRitualStore = useWeeklyRitualStore()
const { currentWeeklyRitualId } = storeToRefs(weeklyRitualStore)
const { weeklyRewardSparks } = weeklyRitualStore

const {
  isJoined,
  joinedChallenge,
  currentDay,
  totalDays,
  canCheckIn,
  checkingIn,
  companionsCount,
  visibleCompanions,
  hiddenCompanionsCount,
  checkInToday
} = useWeeklyRitualStatus()

const weeklyRitual = computed(() => getMissionTemplateById(currentWeeklyRitualId.value))

function openJoinedChallenge() {
  if (!joinedChallenge.value) return
  openMissionDetails({ challenge: joinedChallenge.value })
}

function openHero(userId) {
  if (!userId) return
  if (!requireAuthOrPrompt()) return
  router.push(`/heroes/${userId}`)
}
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
