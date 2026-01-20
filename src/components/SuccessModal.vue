<template>
  <v-dialog v-model="showModal" persistent max-width="450">
    <v-card class="success-forge-card pa-6 text-center rounded-xl">
      <div class="triumph-icon-wrapper mb-4">
        <v-icon size="64" color="#7e46c4">mdi-fire</v-icon>
        <div class="confetti-placeholder"></div>
      </div>

      <v-card-title class="text-h5 font-weight-black mb-2">
        {{ t('challenges.successModal.title') }}
      </v-card-title>
      
      <v-card-text class="text-body-1 text-grey-darken-1 mb-6">
        <span v-html="successMessage"></span>
      </v-card-text>

      <div v-if="isPublic" class="link-share-zone pa-4 mb-6">
        <p class="text-caption font-weight-bold text-uppercase mb-2" style="color: #94a3b8;">
          {{ t('challenges.successModal.inviteAllies') }}
        </p>
        <div class="d-flex align-center gap-2 link-display">
          <span class="text-truncate flex-grow-1">{{ shareLink }}</span>
          <v-btn 
            icon="mdi-content-copy" 
            variant="text" 
            size="small" 
            color="#7e46c4"
            @click="copyLink"
          ></v-btn>
        </div>
      </div>

      <v-btn
        block
        size="x-large"
        class="go-to-mission-btn mb-3"
        @click="navigateToMission"
      >
        {{ t('challenges.successModal.goToFirstTask') }}
      </v-btn>
      
      <v-btn
        variant="text"
        color="#64748b"
        @click="addAnotherMission"
      >
        {{ t('challenges.successModal.backToDashboard') }}
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  challengeId: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'addAnother'])
const router = useRouter()
const { t } = useI18n()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const shareLink = computed(() => {
  if (props.challengeId) {
    // Use current origin or default to production URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://challenge-me-space.netlify.app'
    return `${baseUrl}/missions/edit/${props.challengeId}`
  }
  return 'https://challenge-me-space.netlify.app/missions/edit/...'
})

const successMessage = computed(() => {
  const message = t('challenges.successModal.message')
  // Remove the title placeholder entirely
  return message.replace('{title}', '')
})

function copyLink() {
  navigator.clipboard.writeText(shareLink.value).then(() => {
    // You can add a snackbar notification here if needed
    console.log('Link copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy link:', err)
  })
}

function navigateToMission() {
  if (props.challengeId) {
    router.push(`/missions/${props.challengeId}`)
  } else {
    router.push('/missions/my')
  }
  closeModal()
}

function closeModal() {
  showModal.value = false
}

function addAnotherMission() {
  emit('addAnother')
  closeModal()
}
</script>

<style scoped>
.success-forge-card {
  background: #ffffff;
  border: 4px solid rgba(126, 70, 196, 0.1);
  box-shadow: 0 25px 50px -12px rgba(126, 70, 196, 0.25) !important;
}

.triumph-icon-wrapper {
  position: relative;
  display: inline-block;
  animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.link-share-zone {
  background: #f8fafc;
  border: 1px dashed #7e46c4;
  border-radius: 16px;
}

.link-share-zone .link-display {
  font-family: 'Monaco', monospace;
  font-size: 0.9rem;
  color: #7e46c4;
  background: #fff;
  padding: 8px 12px;
  border-radius: 10px;
}

.go-to-mission-btn {
  background: linear-gradient(135deg, #7e46c4 0%, #6b39a8 100%) !important;
  color: white !important;
  font-weight: 800 !important;
  border-radius: 16px !important;
  letter-spacing: 0.5px;
}

@keyframes bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); opacity: 1; }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}
</style>
