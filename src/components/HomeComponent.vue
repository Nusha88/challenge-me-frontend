<template>
  <div class="home-container">
    <div class="content-wrapper">
      <h1 class="text-h3 mb-6">{{ t('home.welcome') }}</h1>
      <v-card class="welcome-card">
        <v-card-text>
          <p class="text-h5 mb-4">{{ t('home.description') }}</p>
          <p class="text-body-1 mb-0">
            {{ t('navigation.addChallenge') }} · {{ t('navigation.myChallenges') }} · {{ t('navigation.allChallenges') }}
          </p>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.home-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
}

.welcome-card {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  width: 100%;
}
</style> 