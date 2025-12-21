<script setup>
import MainLayout from './components/MainLayout.vue'
</script>

<template>
  <MainLayout />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
  margin-left: 0;
  margin-right: 0;
}

@media (max-width: 959px) {
  #app {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
}

/* Global styles can go here */
</style>
