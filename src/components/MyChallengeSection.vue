<template>
  <div :class="gridClass">
    <ChallengeCard
      v-for="challenge in challenges"
      :key="challenge._id"
      :challenge="challenge"
      :current-user-id="currentUserId"
      :show-join-button="showJoinButton"
      :joining-id="joiningId"
      :leaving-id="leavingId"
      :watching-id="watchingId"
      :is-watched="!!challenge.isWatched"
      :disabled="disabled"
      @click="forwardChallengeClick"
      @join="forwardJoin"
      @leave="forwardLeave"
      @watch="forwardWatch"
      @unwatch="forwardUnwatch"
      @owner-navigated="forwardOwnerNavigated"
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
  joiningId: {
    type: [String, Number],
    default: null
  },
  leavingId: {
    type: [String, Number],
    default: null
  },
  watchingId: {
    type: [String, Number],
    default: null
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'challenge-click',
  'join',
  'leave',
  'watch',
  'unwatch',
  'owner-navigated'
])

function forwardChallengeClick(event) {
  if (props.disabled) return
  emit('challenge-click', event)
}

function forwardJoin(event) {
  if (props.disabled) return
  emit('join', event)
}

function forwardLeave(event) {
  if (props.disabled) return
  emit('leave', event)
}

function forwardWatch(event) {
  if (props.disabled) return
  emit('watch', event)
}

function forwardUnwatch(event) {
  if (props.disabled) return
  emit('unwatch', event)
}

function forwardOwnerNavigated() {
  if (props.disabled) return
  emit('owner-navigated')
}
</script>
