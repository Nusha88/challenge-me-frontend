<template>
  <v-card class="main-ritual-hero mb-8" theme="dark">
    <v-img
      :src="challenge?.imageUrl || 'https://images.unsplash.com/photo-149485981460c-3834b3a25b5c?auto=format&fit=crop&q=80&w=1200'"
      cover
      class="align-end"
      gradient="to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%"
    >
      <v-card-text class="hero-content pa-8">
        <div class="d-flex flex-column gap-2">
          
          <div class="d-flex align-center gap-3">
            <v-chip
              color="teal-accent-3"
              variant="flat"
              label
              size="small"
              class="font-weight-black"
            >
              {{ t('challenges.typeHabitLabel') }}
            </v-chip>
            <span class="text-overline text-teal-lighten-3">{{ t('challenges.mainRitualOfWeek') }}</span>
          </div>

          <h1 class="text-h3 font-weight-bold mb-2">{{ challenge?.title || t('challenges.defaultRitualTitle') }}</h1>

          <div class="d-flex align-center flex-wrap gap-6 mt-4 stats-actions-row">
            <div class="social-stats d-flex align-center">
              <v-avatar-group density="comfortable" class="participants-avatars">
                <v-avatar 
                  v-for="(participant, index) in displayedParticipants" 
                  :key="index"
                  size="32"
                  :color="getParticipantColor(participant)"
                >
                  <img 
                    v-if="getParticipantAvatarUrl(participant)" 
                    :src="getParticipantAvatarUrl(participant)" 
                    :alt="getParticipantName(participant)"
                  />
                  <span v-else>{{ getParticipantInitial(participant) }}</span>
                </v-avatar>
              </v-avatar-group>
              <span class="ml-4 text-body-1 participants-text">
                <strong>{{ participantCount }} {{ t('challenges.heroesInLine') }}</strong>
              </span>
            </div>

            <v-btn
              v-if="canJoin"
              color="teal-accent-4"
              size="large"
              rounded="xl"
              class="px-8 join-btn"
              elevation="8"
              :loading="joining"
              @click="handleJoin"
            >
              {{ t('challenges.acceptChallenge') }}
            </v-btn>
            <v-btn
              v-else-if="isParticipant"
              color="grey"
              size="large"
              rounded="xl"
              class="px-8"
              variant="outlined"
              disabled
            >
              {{ t('challenges.joined') }}
            </v-btn>
          </div>

        </div>
      </v-card-text>
    </v-img>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  challenge: {
    type: Object,
    default: null
  },
  currentUserId: {
    type: String,
    default: null
  },
  joining: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['join'])

const { t } = useI18n()

const participantCount = computed(() => {
  return props.challenge?.participants?.length || 0
})

const displayedParticipants = computed(() => {
  if (!props.challenge?.participants) return []
  return props.challenge.participants.slice(0, 3)
})

const isParticipant = computed(() => {
  if (!props.currentUserId || !props.challenge?.participants) return false
  return props.challenge.participants.some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === props.currentUserId.toString()
  })
})

const canJoin = computed(() => {
  if (!props.currentUserId || !props.challenge) return false
  if (isParticipant.value) return false
  const ownerId = props.challenge.owner?._id || props.challenge.owner
  return ownerId !== props.currentUserId
})

function getParticipantColor(participant) {
  const userId = participant.userId?._id || participant.userId || participant._id || participant
  const name = participant.userId?.name || participant.name || ''
  const seed = userId?.toString() || name
  
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash % 360)
  const saturation = 60 + (Math.abs(hash) % 20)
  const lightness = 50 + (Math.abs(hash) % 15)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function getParticipantAvatarUrl(participant) {
  return participant.userId?.avatar || participant.avatar || null
}

function getParticipantName(participant) {
  return participant.userId?.name || participant.name || t('common.unknown')
}

function getParticipantInitial(participant) {
  const name = getParticipantName(participant)
  return name.charAt(0).toUpperCase()
}

function handleJoin() {
  if (props.challenge) {
    emit('join', props.challenge)
  }
}
</script>

<style scoped>
/* Ограничиваем высоту баннера */
.main-ritual-hero {
  height: 400px !important;
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(79, 209, 197, 0.15);
}

/* Контент внутри стал компактнее */
.hero-content {
  max-width: 700px;
  padding: 24px !important; 
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Уменьшили размер заголовка */
.text-h3 {
  font-size: 2.5rem !important;
  line-height: 1.1;
  letter-spacing: -0.01em !important;
}

.join-btn {
  font-weight: 800 !important;
  text-transform: none !important;
  letter-spacing: 0.5px;
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.4) !important;
  transition: all 0.3s ease;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(79, 209, 197, 0.6) !important;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }

.stats-actions-row {
  flex-wrap: wrap;
}

.social-stats {
  flex-wrap: wrap;
}

.participants-text {
  white-space: nowrap;
}

/* Tablet styles */
@media (max-width: 960px) {
  .main-ritual-hero {
    height: 360px !important;
  }
  
  .hero-content {
    padding: 20px !important;
    max-width: 100%;
  }
  
  .text-h3 {
    font-size: 2rem !important;
  }
  
  .stats-actions-row {
    gap: 16px !important;
  }
  
  .join-btn {
    width: 100%;
    max-width: 300px;
  }
}

/* Mobile styles */
@media (max-width: 600px) {
  .main-ritual-hero {
    height: 320px !important;
    border-radius: 16px !important;
  }
  
  .hero-content {
    padding: 16px !important;
  }
  
  .text-h3 {
    font-size: 1.75rem !important;
    margin-bottom: 8px !important;
  }
  
  .stats-actions-row {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 12px !important;
    margin-top: 12px !important;
  }
  
  .social-stats {
    width: 100%;
    flex-wrap: nowrap;
  }
  
  .participants-avatars {
    flex-shrink: 0;
  }
  
  .participants-text {
    font-size: 0.875rem !important;
    margin-left: 8px !important;
    white-space: normal;
  }
  
  .join-btn {
    width: 100%;
    max-width: none;
    font-size: 0.9rem !important;
    padding: 0 24px !important;
  }
  
  .gap-3 {
    gap: 8px !important;
  }
  
  .gap-6 {
    gap: 16px !important;
  }
}

/* Small mobile styles */
@media (max-width: 400px) {
  .main-ritual-hero {
    height: 280px !important;
  }
  
  .hero-content {
    padding: 12px !important;
  }
  
  .text-h3 {
    font-size: 1.5rem !important;
  }
  
  .participants-text {
    font-size: 0.75rem !important;
  }
}
</style>
