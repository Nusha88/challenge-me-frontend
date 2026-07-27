<template>
  <section v-if="challenges.length" class="my-challenge-section" :class="{ 'is-archive': layout === 'archive' }">
    <MissionSectionDivider
      v-if="title"
      :label="title"
      :icon="icon"
      :count="count || challenges.length"
      :flush-top="flushTop"
    />

    <div class="my-challenge-grid" :class="`my-challenge-grid--${layout}`">
      <ChallengeCard
        v-for="challenge in challenges"
        :key="challenge._id"
        :challenge="challenge"
        :current-user-id="currentUserId"
        :show-join-button="showJoinButton"
        :show-extend-button="showExtendButton"
        :disabled="disabled"
        show-habit-tracker
        @click="forwardChallengeClick"
        @update="$emit('update')"
        @extended="forwardExtended"
      />
    </div>
  </section>
</template>

<script setup>
import ChallengeCard from './ChallengeCard.vue'
import MissionSectionDivider from './MissionSectionDivider.vue'

const props = defineProps({
  challenges: {
    type: Array,
    default: () => []
  },
  layout: {
    type: String,
    default: 'archive',
    validator: (value) => ['quests', 'rituals', 'archive'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'mdi-flag-outline'
  },
  count: {
    type: Number,
    default: 0
  },
  flushTop: {
    type: Boolean,
    default: false
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

<style scoped>
.my-challenge-section.is-archive {
  opacity: 0.92;
}

.my-challenge-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

@media (min-width: 600px) {
  .my-challenge-grid {
    gap: 24px;
  }

  .my-challenge-grid--quests,
  .my-challenge-grid--rituals,
  .my-challenge-grid--archive {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .my-challenge-grid--rituals,
  .my-challenge-grid--archive {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
