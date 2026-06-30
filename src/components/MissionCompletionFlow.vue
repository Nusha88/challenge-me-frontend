<template>
  <MissionAccomplishedModal
    v-model="missionAccomplishedOpen"
    :quest-title="missionAccomplishedData.questTitle"
    :xp-gained="missionAccomplishedData.xpGained"
    :sparks-gained="missionAccomplishedData.sparksGained"
    :tier="missionAccomplishedData.tier"
    :completion-rate="missionAccomplishedData.completionRate"
    :personal-done="missionAccomplishedData.personalDone"
    :personal-total="missionAccomplishedData.personalTotal"
    :badge="missionAccomplishedData.badge"
    @share="openFinalShareCard"
  />

  <MissionContinueSoloModal
    v-model="soloContinuationOpen"
    :suggested-end-date="soloSuggestedEndDate"
    :remaining-days="soloRemainingDays"
    :min-custom-date="soloMinCustomDate"
    :loading="soloContinuationLoading"
    @continue="handleSoloContinuation"
  />

  <ShareAchievementModal
    v-model="shareCardOpen"
    :quest-title="shareCardData.questTitle"
    :step-name="shareCardData.stepName"
    :user-text="shareCardData.userText"
    :user-image="shareCardData.userImage"
    :user-image-data-url="shareCardData.userImageDataUrl"
    :user-level="shareCardData.userLevel"
    :user-rank-title="shareCardData.userRankTitle"
    :is-final="shareCardData.isFinal"
    :xp-earned="shareCardData.xpEarned"
    :sparks-earned="shareCardData.sparksEarned"
    :completed-steps="shareCardData.completedSteps"
    :total-steps="shareCardData.totalSteps"
    :mission-dates="shareCardData.missionDates"
    :mission-type="shareCardData.missionType"
    :completed-days="shareCardData.completedDays"
    :total-days="shareCardData.totalDays"
    :completion-tier="shareCardData.completionTier"
  />
</template>

<script setup>
import MissionAccomplishedModal from './MissionAccomplishedModal.vue'
import MissionContinueSoloModal from './MissionContinueSoloModal.vue'
import ShareAchievementModal from './ShareAchievementModal.vue'
import { useMissionCompletionFlow } from '../composables/useMissionCompletionFlow'

const {
  missionAccomplishedOpen,
  shareCardOpen,
  soloContinuationOpen,
  soloContinuationLoading,
  missionAccomplishedData,
  shareCardData,
  soloSuggestedEndDate,
  soloRemainingDays,
  soloMinCustomDate,
  openFinalShareCard,
  handleSoloContinuation
} = useMissionCompletionFlow()
</script>
