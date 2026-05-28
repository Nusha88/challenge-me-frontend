<template>
  <div class="header-section text-left mb-10 reveal-animation">
    <div class="d-flex align-center mb-1">
      <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-compass-rose</v-icon>
      <h1 class="page-title-dark">{{ t('allChallenges.title') }}</h1>
    </div>
    <div class="text-overline text-teal-accent-4 tracking-widest ml-13">
      {{ t('allChallenges.subtitle') }}
    </div>
    <p class="journal-subtitle-dark mt-2">{{ t('allChallenges.description') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
