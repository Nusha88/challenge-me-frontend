<template>
  <v-card 
    class="main-ritual-hero mb-10" 
    theme="dark"
    @click="$emit('click', challenge)"
    elevation="0"
  >
    <v-img
      :src="challenge?.imageUrl || 'https://images.unsplash.com/photo-149485981460c-3834b3a25b5c?auto=format&fit=crop&q=80&w=1200'"
      cover
      class="hero-image-wrapper align-center justify-center"
    >
      <div class="hero-overlay"></div>

      <v-card-text class="hero-content d-flex flex-column align-center text-center">
        
        <div class="ritual-badge-container mb-6">
          <v-chip
            :style="{ backgroundColor: '#7048E8', color: '#FFFFFF' }"
            variant="flat"
            label
            size="small"
            class="ritual-chip px-4 font-weight-black"
          >
            <v-icon start size="14">mdi-star</v-icon>
            {{ t('challenges.typeHabitLabel').toUpperCase() }}
          </v-chip>
          <span class="ritual-subtitle">{{ t('challenges.mainRitualOfWeek') }}</span>
        </div>

        <h1 class="ritual-title mb-6">
          {{ challenge?.title || t('challenges.defaultRitualTitle') }}
        </h1>

        <div class="actions-wrapper">
          <div class="social-panel d-flex align-center py-2 px-6">
            <v-avatar-group density="comfortable">
              <v-avatar 
                v-for="(participant, index) in displayedParticipants" 
                :key="index"
                size="36"
                border="2"
                :color="getParticipantColor(participant)"
                class="participant-avatar"
              >
                <v-img v-if="getParticipantAvatarUrl(participant)" :src="getParticipantAvatarUrl(participant)" />
                <span v-else class="text-caption font-weight-bold">{{ getParticipantInitial(participant) }}</span>
              </v-avatar>
            </v-avatar-group>
            
            <div class="ml-4 text-left">
              <div class="stats-count">{{ participantCount }} {{ t('challenges.heroesInLine') }}</div>
              <div class="stats-label">Waiting for you</div>
            </div>

            <v-divider vertical class="mx-6 my-2" color="rgba(255,255,255,0.2)"></v-divider>

            <v-btn
              v-if="canJoin"
              color="teal-accent-3"
              height="54"
              rounded="xl"
              class="join-btn px-8"
              :loading="joining"
              @click.stop="handleJoin"
            >
              <template v-slot:prepend>
                <v-icon class="join-icon">mdi-flash</v-icon>
              </template>
              {{ t('challenges.acceptChallenge') }}
            </v-btn>

            <v-btn
              v-else-if="isParticipant"
              variant="flat"
              color="white"
              height="54"
              rounded="xl"
              class="joined-btn px-8"
            >
              <v-icon start color="teal-accent-4">mdi-check-decagram</v-icon>
              {{ t('challenges.joined') }}
            </v-btn>
          </div>
        </div>

      </v-card-text>
    </v-img>
  </v-card>
</template>

<style scoped>
.main-ritual-hero {
  height: 480px !important;
  border-radius: 32px !important;
  overflow: hidden;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.main-ritual-hero:hover {
  transform: scale(1.01);
}

.hero-image-wrapper {
  height: 100%;
}

/* Затемнение фона */
.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 900px !important;
}

/* Бейдж и подпись */
.ritual-badge-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ritual-chip {
  box-shadow: 0 0 15px rgba(20, 255, 236, 0.4);
}

.ritual-subtitle {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 12px;
  font-weight: 700;
  color: #4FD1C5;
}

/* Заголовок */
.ritual-title {
  font-size: 3.5rem !important;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -2px !important;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

/* Стеклянная панель управления */
.social-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 60px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.stats-count {
  font-weight: 800;
  font-size: 16px;
  color: #fff;
}

.stats-label {
  font-size: 11px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

/* Кнопки */
.join-btn {
  font-weight: 900 !important;
  font-size: 16px !important;
  letter-spacing: 0;
  color: #000 !important;
  box-shadow: 0 10px 25px rgba(20, 255, 236, 0.3) !important;
  transition: all 0.3s ease;
}

.join-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(20, 255, 236, 0.5) !important;
}

.join-icon {
  animation: bolt-glow 1.5s infinite alternate;
}

@keyframes bolt-glow {
  from { opacity: 0.5; transform: scale(1); }
  to { opacity: 1; transform: scale(1.2); }
}

/* --- Адаптивность --- */
@media (max-width: 960px) {
  .ritual-title { font-size: 2.8rem !important; }
  .social-panel { flex-wrap: wrap; border-radius: 24px; justify-content: center; }
}

@media (max-width: 600px) {
  .main-ritual-hero { height: 420px !important; }
  .ritual-title { font-size: 2rem !important; letter-spacing: -1px !important; }
  .social-panel {
    padding: 16px !important;
    flex-direction: column;
    width: 100%;
  }
  .v-divider { display: none; }
  .ml-4 { text-align: center !important; margin: 12px 0 !important; }
  .join-btn, .joined-btn { width: 100%; }
}
</style>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  challenge: { type: Object, default: null },
  currentUserId: { type: String, default: null },
  joining: { type: Boolean, default: false }
})

const emit = defineEmits(['join', 'click'])
const { t } = useI18n()

const participantCount = computed(() => props.challenge?.participants?.length || 0)
const displayedParticipants = computed(() => props.challenge?.participants?.slice(0, 3) || [])

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
  const seed = (participant.userId?._id || participant._id || 'default').toString()
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${Math.abs(hash % 360)}, 65%, 55%)`
}

function getParticipantAvatarUrl(participant) { return participant.userId?.avatar || participant.avatar || null }
function getParticipantName(participant) { return participant.userId?.name || participant.name || t('common.unknown') }
function getParticipantInitial(participant) { return getParticipantName(participant).charAt(0).toUpperCase() }
function handleJoin() { if (props.challenge) emit('join', props.challenge) }
</script>