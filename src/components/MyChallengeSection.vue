<template>
  <div :class="gridClass">
    <ChallengeCard
      v-for="challenge in challenges"
      :key="challenge._id"
      :challenge="challenge"
      :current-user-id="currentUserId"
      :show-join-button="showJoinButton"
      :show-extend-button="showExtendButton"
      :disabled="disabled"
      @click="forwardChallengeClick"
      @update="$emit('update')"
      @extended="forwardExtended"
    />
  </div>
</template>

<script setup>
import ChallengeCard from './ChallengeCard.vue'

const props = defineProps({
  challenges: {
    type: Array,
    default: () => []
  },
  gridClass: {
    type: String,
    default: 'challenges-grid'
  },
  currentUserId: {
    type: String,
    default: null
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showExtendButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['challenge-click', 'update', 'extended'])

function forwardChallengeClick(event) {
  if (props.disabled) return
  emit('challenge-click', event)
}

function forwardExtended(challenge) {
  emit('extended', challenge)
}
</script>
