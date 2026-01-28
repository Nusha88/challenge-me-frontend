<template>
  <v-card class="main-ritual-hero mb-8" theme="dark">
    <v-img
      :src="challenge?.imageUrl || 'https://images.unsplash.com/photo-149485981460c-3834b3a25b5c?auto=format&fit=crop&q=80&w=1200'"
      cover
      class="align-end"
      gradient="to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%"
    >
      <v-card-text class="hero-content pa-8">
        <div class="d-flex flex-column gap-2">
          
          <div class="d-flex align-center gap-3">
            <v-chip
              color="teal-accent-4"
              variant="flat"
              label
              size="small"
              class="font-weight-black"
            >
              {{ t('challenges.typeHabitLabel') }}
            </v-chip>
            <span class="text-overline text-teal-lighten-3 ml-2">{{ t('challenges.mainRitualOfWeek') }}</span>
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
                  <v-img 
                    v-if="getParticipantAvatarUrl(participant)" 
                    :src="getParticipantAvatarUrl(participant)" 
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
              prepend-icon="mdi-check-circle"
              size="large"
              rounded="xl"
              class="px-8 ml-3 joined-btn"
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
  challenge: { type: Object, default: null },
  currentUserId: { type: String, default: null },
  joining: { type: Boolean, default: false }
})

const emit = defineEmits(['join'])
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

<style scoped>
/* Ограничиваем высоту баннера, чтобы он не был "слишком большим" */
.main-ritual-hero {
  height: 400px !important;
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(79, 209, 197, 0.15);
}

.hero-content {
  max-width: 800px;
  padding: 32px !important; 
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

.text-h3 {
  font-size: 2.5rem !important;
  line-height: 1.1;
  letter-spacing: -0.01em !important;
}

/* Статистика героев (аватарки и текст) */
.social-stats {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.social-stats strong {
  color: #4FD1C5; /* Бирюзовый акцент из твоего кода */
}

/* Кнопка принять вызов */
.join-btn {
  font-weight: 800 !important;
  text-transform: none !important;
  letter-spacing: 0.5px;
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.4) !important;
  transition: all 0.3s ease;
}

/* Твоя новая кнопка JOINED */
.joined-btn {
  background: white !important; 
  color: #1a202c !important;    
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 1 !important;        
  box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
}

.joined-btn :deep(.v-btn__prepend) {
  color: #4FD1C5;
}
/* --- Стили для планшетов (max-width: 960px) --- */
@media (max-width: 960px) {
  .main-ritual-hero {
    height: 380px !important;
  }
  .text-h3 {
    font-size: 2.2rem !important;
  }
}

/* --- Стили для мобильных (max-width: 600px) --- */
@media (max-width: 600px) {
  .main-ritual-hero {
    height: 340px !important; /* Фиксируем высоту, чтобы не "раздувало" */
    border-radius: 16px !important;
  }

  .hero-content {
    padding: 16px !important; /* Уменьшаем внутренние отступы контента */
    padding-bottom: 24px !important;
  }

  .text-h3 {
    font-size: 1.5rem !important; /* Компактный заголовок */
    line-height: 1.2;
    margin-bottom: 12px !important;
  }

  /* Статистика (8 heroes in line) */
  .social-stats {
    padding: 4px 10px;
    border-radius: 16px;
    margin-bottom: 8px; /* Добавляем отступ, если кнопки встанут друг под друга */
  }

  .participants-text {
    font-size: 0.8rem !important;
    margin-left: 6px !important;
  }

  .participants-avatars :deep(.v-avatar) {
    size: 24px !important; /* Уменьшаем аватарки */
    width: 24px !important;
    height: 24px !important;
  }

  /* Кнопки действий */
  .stats-actions-row {
    flex-direction: column; /* Складываем элементы в колонку */
    align-items: flex-start !important;
    gap: 12px !important;
  }

  .join-btn, .joined-btn {
    width: auto; /* Не на всю ширину, а по контенту */
    height: 44px !important; /* Чуть ниже высоту */
    padding: 0 20px !important;
    font-size: 0.85rem !important;
  }
}

/* --- Совсем маленькие экраны (max-width: 400px) --- */
@media (max-width: 400px) {
  .main-ritual-hero {
    height: 300px !important;
  }
  
  .text-h3 {
    font-size: 1.35rem !important;
  }
  
  .social-stats {
    display: none; /* Можно скрыть аватарки на экстремально маленьких экранах */
  }
}
</style>