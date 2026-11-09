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
    :payload="shareCardData"
    @dismiss="handleShareModalDismiss"
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
  handleShareModalDismiss,
  handleSoloContinuation
} = useMissionCompletionFlow()
</script>
