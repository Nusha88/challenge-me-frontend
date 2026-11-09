<template>
  <div class="sc-final-content">
    <div class="sc-loot-row">
      <div class="sc-loot-badge sc-loot-badge--xp">
        ✨ +{{ xpEarned }} {{ t('challenges.shareCard.lootXp') }}
      </div>
      <div class="sc-loot-badge sc-loot-badge--sparks">
        ⚡ +{{ sparksEarned }} {{ t('challenges.shareCard.lootSparks') }}
      </div>
    </div>

    <div v-if="coverImage" class="sc-photo-frame sc-photo-frame--cover">
      <img
        :src="coverImage"
        alt=""
        class="sc-photo"
        :crossorigin="coverImage.startsWith('data:') ? undefined : 'anonymous'"
      />
    </div>
    <div v-else class="sc-quest-hero">
      <Trophy :size="64" :stroke-width="1.5" class="sc-quest-hero-icon" />
    </div>

    <div
      v-if="reflectionText"
      ref="reflectionCardRef"
      class="sc-text-card sc-text-card--final-reflection"
    >
      <p ref="reflectionTextRef" class="sc-handwritten sc-handwritten--final">{{ reflectionText }}</p>
    </div>

    <div class="sc-stats-grid">
      <p class="sc-stat">
        🎯 {{ t('challenges.shareCard.statsSteps') }}: {{ stepsDisplay }}
      </p>
      <p class="sc-stat">
        📅 {{ t('challenges.shareCard.statsPeriod') }}: {{ missionDates }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trophy } from 'lucide-vue-next'

defineProps({
  xpEarned: { type: [Number, String], default: 0 },
  sparksEarned: { type: [Number, String], default: 0 },
  stepsDisplay: { type: String, default: '' },
  missionDates: { type: String, default: '' },
  reflectionText: { type: String, default: '' },
  coverImage: { type: String, default: '' }
})

const emit = defineEmits(['bind-refs'])
const { t } = useI18n()
const reflectionCardRef = ref(null)
const reflectionTextRef = ref(null)

function emitRefs() {
  emit('bind-refs', {
    card: reflectionCardRef.value,
    text: reflectionTextRef.value
  })
}

onMounted(emitRefs)
watch([reflectionCardRef, reflectionTextRef], emitRefs)
</script>
