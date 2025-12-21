<template>
  <div class="home-container">
    <div class="content-wrapper">
      <div class="home-grid" :class="{ 'logged-in-layout': isLoggedIn }">
        <div class="home-left">
          <h1 class="home-title">{{ t('home.title') }}</h1>
          <p class="home-subtitle">{{ t('home.subtitle') }}</p>
          <GradientButton :to="isLoggedIn ? '/challenges/add' : '/login'">
            {{ t('home.createFirstChallenge') }}
          </GradientButton>
        </div>
        <div class="home-right">
          <img :src="homePagePicture" alt="ChallengeMe" class="home-page-image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import homePagePicture from '../assets/home-page-picture.png'
import GradientButton from './GradientButton.vue'

const { t } = useI18n()
const isLoggedIn = ref(!!localStorage.getItem('token'))

function updateAuthState() {
  isLoggedIn.value = !!localStorage.getItem('token')
}

onMounted(() => {
  window.addEventListener('auth-changed', updateAuthState)
  updateAuthState()
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', updateAuthState)
})
</script>

<style scoped>
.home-container {
  min-height: auto;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0 1em;
  padding-top: 1em;
}

@media (min-width: 600px) {
  .home-container {
    padding: 0 1.5em;
    padding-top: 1.5em;
  }
}

@media (min-width: 960px) {
  .home-container {
    padding: 0 24px;
    padding-top: 2em;
  }
}

.content-wrapper {
  width: 100%;
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5em;
  align-items: center;
}

@media (min-width: 600px) {
  .home-grid {
    gap: 2em;
  }
}

@media (min-width: 960px) {
  .home-grid {
    grid-template-columns: 1fr 1fr;
    gap: 2em;
  }
  
  .home-grid.logged-in-layout {
    grid-template-columns: 1fr;
    gap: 2em;
  }
  
  .home-grid.logged-in-layout .home-left {
    text-align: center;
  }
  
  .home-grid.logged-in-layout .home-right {
    display: flex;
    justify-content: center;
  }
}

.home-left {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.home-grid.logged-in-layout .home-left {
  text-align: center;
  align-items: center;
}

.home-grid.logged-in-layout .home-left .gradient-button {
  align-self: center;
}

.home-title {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
}

@media (min-width: 600px) {
  .home-title {
    font-size: 3rem;
  }
}

@media (min-width: 960px) {
  .home-title {
    font-size: 4rem;
  }
}

.home-subtitle {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

@media (min-width: 600px) {
  .home-subtitle {
    font-size: 1.25rem;
  }
}

.gradient-button {
  width: 100%;
  max-width: 400px;
}

@media (min-width: 600px) {
  .gradient-button {
    font-size: 0.95rem;
  }
}

.home-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-page-image {
  width: 100%;
  height: auto;
  max-width: 120%;
  object-fit: contain;
  border-radius: 16px;
  transform: scale(1.2);
}

.home-grid.logged-in-layout .home-page-image {
  max-width: 60%;
  transform: scale(1);
}

@media (max-width: 959px) {
  .home-page-image {
    transform: scale(1);
    max-width: 100%;
  }
  
  .home-grid.logged-in-layout .home-page-image {
    max-width: 80%;
  }
}

.auth-buttons-mobile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.sign-up-button {
  border-radius: 24px !important;
  background: linear-gradient(135deg, #4161E1 0%, #4869DB 100%) !important;
}

.login-button {
  border-radius: 24px !important;
  background-color: transparent !important;
  color: #3C60E8 !important;
  border-color: #3C60E8 !important;
}

.login-button :deep(.v-btn__content) {
  color: #3C60E8 !important;
}
</style> 