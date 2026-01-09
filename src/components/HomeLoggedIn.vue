<template>
  <div class="home-logged-in-container">
    <h1 class="home-logged-in-title">{{ t('home.welcome') }}</h1>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.home-logged-in-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2em 1em;
}

@media (min-width: 600px) {
  .home-logged-in-container {
    padding: 3em 1.5em;
  }
}

@media (min-width: 960px) {
  .home-logged-in-container {
    padding: 4em 24px;
  }
}

.home-logged-in-title {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  color: rgba(0, 0, 0, 0.87);
  margin: 0;
  text-align: center;
}

@media (min-width: 600px) {
  .home-logged-in-title {
    font-size: 3rem;
  }
}

@media (min-width: 960px) {
  .home-logged-in-title {
    font-size: 4rem;
  }
}
</style>
