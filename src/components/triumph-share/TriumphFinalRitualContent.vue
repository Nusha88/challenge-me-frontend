<template>
  <div class="sc-final-content sc-final-content--ritual">
    <div class="sc-loot-row">
      <div class="sc-loot-badge sc-loot-badge--xp">
        ✨ +{{ xpEarned }} {{ t('challenges.shareCard.lootXp') }}
      </div>
      <div class="sc-loot-badge sc-loot-badge--sparks">
        ⚡ +{{ sparksEarned }} {{ t('challenges.shareCard.lootSparks') }}
      </div>
    </div>

    <div class="sc-ritual-hero">
      <div class="sc-ritual-icon" :class="tierIconClass">{{ tierIcon }}</div>
      <p class="sc-ritual-tier">{{ tierStatusLabel }}</p>
      <div class="sc-accuracy-badge">
        🎯 {{ t('challenges.shareCard.accuracy') }}: {{ accuracy }}%
      </div>
    </div>

    <div ref="reflectionCardRef" class="sc-text-card sc-text-card--ritual-reflection">
      <p ref="reflectionTextRef" class="sc-handwritten sc-handwritten--ritual">{{ reflectionText }}</p>
    </div>

    <div class="sc-stats-grid">
      <p class="sc-stat">
        🔥 {{ t('challenges.shareCard.statsDiscipline') }}: {{ disciplineDisplay }}
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

defineProps({
  xpEarned: { type: [Number, String], default: 0 },
  sparksEarned: { type: [Number, String], default: 0 },
  accuracy: { type: [Number, String], default: 0 },
  disciplineDisplay: { type: String, default: '' },
  missionDates: { type: String, default: '' },
  reflectionText: { type: String, default: '' },
  tierIcon: { type: String, default: '🔥' },
  tierIconClass: { type: String, default: '' },
  tierStatusLabel: { type: String, default: '' }
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
