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
  background-color: #f5f5f7;
  position: relative;
  overflow-x: hidden;
}

body::before,
body::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  pointer-events: none;
  z-index: 0;
}

body::before {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, rgba(75, 0, 130, 0.2) 50%, transparent 70%);
  top: -200px;
  left: -200px;
}

body::after {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, rgba(30, 144, 255, 0.4) 0%, rgba(138, 43, 226, 0.2) 50%, transparent 70%);
  bottom: -300px;
  right: -200px;
}

#app {
  width: 100%;
  height: 100vh;
  margin-left: 0;
  margin-right: 0;
  position: relative;
  z-index: 1;
}

@media (min-width: 960px) {
  #app {
    max-width: 1500px;
    margin-left: auto;
    margin-right: auto;
  }
}

@media (max-width: 959px) {
  #app {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  
  body::before {
    width: 400px;
    height: 400px;
    top: -150px;
    left: -150px;
  }
  
  body::after {
    width: 500px;
    height: 500px;
    bottom: -200px;
    right: -150px;
  }
}

/* Global styles for input fields */
:deep(.v-field) {
  border-radius: 12px !important;
}

:deep(.v-field__input) {
  border-radius: 12px !important;
}

:deep(.v-text-field .v-field),
:deep(.v-autocomplete .v-field),
:deep(.v-select .v-field),
:deep(.v-textarea .v-field) {
  border-radius: 12px !important;
}
</style>
