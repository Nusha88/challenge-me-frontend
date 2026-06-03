<template>
  <div>
    <div class="greeting-section">
      <div class="greeting-content">
        <h1 class="greeting-title">
          <span class="greeting-text">{{ t('home.loggedIn.greeting', { name: userName }) }}</span>
          <span class="wave-icon">👋</span>
        </h1>
        <p v-if="!hasTodayCompletedTasks" class="motivational-text">{{ motivationalMessage }}</p>
        <p v-else class="motivational-text">{{ motivationalMessageCompleted }}</p>
        <button v-if="showInspirationButton" class="inspiration-btn" @click="$emit('inspiration')">
          <Sparkles :size="16" class="inspiration-btn-icon" />
          {{ t('home.loggedIn.needInspiration') }}
        </button>
      </div>
      <div class="artifact-container">
        <img src="@/assets/crystal.png" alt="Rocket" class="magic-artifact" />
        <div class="artifact-glow"></div>
      </div>
    </div>

    <div
      v-if="showMobileStreak"
      class="streak-display-mobile d-md-none"
      :class="{ 'streak-yesterday': !hasTodayCompletedTasks && yesterdayStreakDays > 0 }"
    >
      <i class="mdi mdi-fire"></i>
      <span>{{ streakLabel }} {{ streakDaysText }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles } from 'lucide-vue-next'

const props = defineProps({
  userName: { type: String, default: '' },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  motivationalMessage: { type: String, default: '' },
  motivationalMessageCompleted: { type: String, default: '' },
  showInspirationButton: { type: Boolean, default: false },
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  streakDaysText: { type: String, default: '' }
})

defineEmits(['inspiration'])

const { t } = useI18n()

const showMobileStreak = computed(() => {
  return props.yesterdayStreakDays > 0 || props.displayStreakDays > 0
})

const streakLabel = computed(() => {
  if (!props.hasTodayCompletedTasks && props.yesterdayStreakDays > 0) {
    return props.yesterdayStreakDays
  }
  return props.displayStreakDays
})
</script>

<style scoped>
.greeting-section {
  width: 100%;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: center;
}

.greeting-content {
  flex: 1;
  text-align: left;
  padding-left: 20px;
  border-left: 4px solid;
  border-image: linear-gradient(to bottom, #4FD1C5, rgba(112, 72, 232, 0.5)) 1;
}

@media (max-width: 959px) {
  .greeting-section {
    margin-bottom: 0;
    flex-direction: column;
    gap: 1rem;
  }

  .greeting-content {
    width: 100%;
  }
}

.greeting-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.greeting-text {
  background: linear-gradient(90deg, #4FD1C5 0%, #7048E8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

@media (min-width: 400px) {
  .greeting-title { font-size: 2rem; }
}

@media (min-width: 600px) {
  .greeting-title { font-size: 2.5rem; }
}

@media (min-width: 960px) {
  .greeting-title { font-size: 3rem; }
}

.wave-icon {
  font-size: 1em;
  display: inline-block;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(20deg); }
  75% { transform: rotate(-20deg); }
}

.motivational-text {
  font-size: 0.95rem;
  font-weight: 300;
  color: #636E72;
  line-height: 1.4;
  font-style: italic;
  margin: 0;
}

@media (min-width: 400px) {
  .motivational-text { font-size: 1.1rem; }
}

@media (min-width: 600px) {
  .motivational-text { font-size: 1.25rem; }
}

@media (min-width: 960px) {
  .motivational-text { font-size: 1.35rem; }
}

.inspiration-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-top: 12px;
  background: rgba(112, 72, 232, 0.05);
  color: #7048E8;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1.5px dashed rgba(112, 72, 232, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.inspiration-btn:hover {
  background: rgba(112, 72, 232, 0.1);
  border-color: #7048E8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(112, 72, 232, 0.15);
}

.inspiration-btn-icon {
  opacity: 0.8;
  transition: transform 0.3s ease;
}

.inspiration-btn:hover .inspiration-btn-icon {
  transform: rotate(15deg) scale(1.1);
  opacity: 1;
}

.streak-display-mobile {
  width: 100%;
  background: rgba(255, 140, 66, 0.1) !important;
  border: 1px solid rgba(255, 140, 66, 0.4) !important;
  color: #FF8C42 !important;
  padding: 8px 16px;
  border-radius: 14px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.streak-display-mobile.streak-yesterday {
  background: rgba(255, 140, 66, 0.05) !important;
  border: 1px solid rgba(255, 140, 66, 0.2) !important;
  opacity: 0.7;
  filter: grayscale(0.3);
}

.streak-display-mobile span,
.streak-display-mobile i {
  color: #FF8C42 !important;
  font-weight: 800;
}

.streak-display-mobile i {
  font-size: 18px;
  filter: drop-shadow(0 0 5px rgba(255, 140, 66, 0.6));
}

.artifact-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.magic-artifact {
  width: 320px;
  filter: drop-shadow(0 0 20px rgba(112, 72, 232, 0.4)) sepia(20%) saturate(120%);
  animation: floatArtifact 6s ease-in-out infinite;
  mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
}

.artifact-glow {
  position: absolute;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(79, 209, 197, 0.15) 0%, rgba(112, 72, 232, 0.1) 70%);
  filter: blur(40px);
  z-index: -1;
  animation: pulseGlow 4s ease-in-out infinite;
}

@keyframes floatArtifact {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.02); }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}
</style>
