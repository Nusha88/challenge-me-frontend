<template>
  <HomeContent v-if="!isLoggedIn" />
  <HomeLoggedIn v-else />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import HomeContent from './HomeContent.vue'
import HomeLoggedIn from './HomeLoggedIn.vue'

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