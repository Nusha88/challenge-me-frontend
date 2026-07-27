<template>
  <!-- Both image and text -->
  <template v-if="hasImage && hasText">
    <div class="sc-photo-frame">
      <img
        :src="displayUserImage"
        alt=""
        class="sc-photo"
        :crossorigin="displayUserImage.startsWith('data:') ? undefined : 'anonymous'"
      />
    </div>
    <div ref="textCardRef" class="sc-text-card">
      <p ref="compactTextRef" class="sc-handwritten sc-handwritten--with-image">{{ fittedImageText }}</p>
    </div>
  </template>

  <!-- Image only -->
  <template v-else-if="hasImage">
    <div class="sc-photo-frame sc-photo-frame--large">
      <img
        :src="displayUserImage"
        alt=""
        class="sc-photo"
        :crossorigin="displayUserImage.startsWith('data:') ? undefined : 'anonymous'"
      />
    </div>
  </template>

  <!-- Text only -->
  <template v-else-if="hasText">
    <div class="sc-text-only">
      <Quote :size="40" :stroke-width="1.5" class="sc-text-only-icon" />
      <div ref="largeTextCardRef" class="sc-text-card">
        <p ref="largeTextRef" class="sc-handwritten sc-handwritten--large">{{ fittedLargeText }}</p>
      </div>
    </div>
  </template>

  <!-- Fallback -->
  <template v-else>
    <div class="sc-text-only">
      <Trophy :size="72" :stroke-width="1.5" class="sc-text-only-icon" />
    </div>
  </template>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Quote, Trophy } from 'lucide-vue-next'

defineProps({
  hasImage: { type: Boolean, default: false },
  hasText: { type: Boolean, default: false },
  displayUserImage: { type: String, default: '' },
  fittedImageText: { type: String, default: '' },
  fittedLargeText: { type: String, default: '' }
})

const emit = defineEmits(['bind-refs'])
const textCardRef = ref(null)
const compactTextRef = ref(null)
const largeTextCardRef = ref(null)
const largeTextRef = ref(null)

function emitRefs() {
  emit('bind-refs', {
    textCard: textCardRef.value,
    compactText: compactTextRef.value,
    largeTextCard: largeTextCardRef.value,
    largeText: largeTextRef.value
  })
}

onMounted(emitRefs)
watch([textCardRef, compactTextRef, largeTextCardRef, largeTextRef], emitRefs)
</script>
