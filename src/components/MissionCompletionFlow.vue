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
    @invite-mission="openInviteFromTriumph"
  />

  <MissionInviteModal
    v-model="inviteDialogOpen"
    :invite-url="inviteUrl"
    :card-data="inviteCardData"
  />
</template>

<script setup>
import { computed } from 'vue'
import MissionAccomplishedModal from './MissionAccomplishedModal.vue'
import MissionContinueSoloModal from './MissionContinueSoloModal.vue'
import ShareAchievementModal from './ShareAchievementModal.vue'
import MissionInviteModal from './mission-invite/MissionInviteModal.vue'
import { useMissionCompletionFlow } from '../composables/useMissionCompletionFlow'
import { useMissionInvite } from '../composables/useMissionInvite'

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
  handleSoloContinuation,
  activeChallenge
} = useMissionCompletionFlow()

const {
  inviteDialogOpen,
  inviteUrl,
  inviteCardData,
  openInviteCardDialog
} = useMissionInvite({
  challenge: computed(() => activeChallenge.value),
  isOwner: () => true,
  isParticipant: () => true,
  progressStats: computed(() => ({
    overallCompletionPercent: 0,
    progressPercentage: 0,
    totalDays: shareCardData.totalDays || 0,
    daysOnPath: shareCardData.completedDays || 0,
    completedDays: shareCardData.completedDays || 0,
    progressDone: shareCardData.completedSteps || 0,
    progressTotal: shareCardData.totalSteps || 0
  }))
})

function openInviteFromTriumph() {
  shareCardOpen.value = false
  openInviteCardDialog()
}
</script>
