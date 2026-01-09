<template>
  <div class="home-logged-in-container">
    <div class="greeting-section">
      <h1 class="greeting-title">
        {{ t('home.loggedIn.greeting', { name: userName }) }}
        <span class="wave-icon">👋</span>
      </h1>
      <p class="motivational-text">{{ t('home.loggedIn.motivational') }}</p>
    </div>
    
    <DailyChecklist />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import DailyChecklist from './DailyChecklist.vue'

const { t } = useI18n()

const userName = ref('')

function readStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

function updateUser() {
  const user = readStoredUser()
  userName.value = user?.name || ''
}

onMounted(() => {
  updateUser()
  window.addEventListener('auth-changed', updateUser)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', updateUser)
})
</script>

<style scoped>
.home-logged-in-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 1.5em 1em;
  gap: 2em;
}

@media (min-width: 400px) {
  .home-logged-in-container {
    padding: 2em 1em;
  }
}

@media (min-width: 600px) {
  .home-logged-in-container {
    padding: 2.5em 1.5em;
    gap: 2.5em;
  }
}

@media (min-width: 960px) {
  .home-logged-in-container {
    padding: 3em 24px;
    gap: 3em;
  }
}

.greeting-section {
  width: 100%;
  max-width: 800px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75em;
}

.greeting-title {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5em;
}

@media (min-width: 400px) {
  .greeting-title {
    font-size: 2rem;
  }
}

@media (min-width: 600px) {
  .greeting-title {
    font-size: 2.5rem;
  }
}

@media (min-width: 960px) {
  .greeting-title {
    font-size: 3rem;
  }
}

.wave-icon {
  font-size: 1em;
  display: inline-block;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(20deg);
  }
  75% {
    transform: rotate(-20deg);
  }
}

.motivational-text {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.7);
  margin: 0;
  font-weight: 500;
}

@media (min-width: 400px) {
  .motivational-text {
    font-size: 1.1rem;
  }
}

@media (min-width: 600px) {
  .motivational-text {
    font-size: 1.25rem;
  }
}

@media (min-width: 960px) {
  .motivational-text {
    font-size: 1.35rem;
  }
}
</style>
