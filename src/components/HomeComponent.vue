<template>
  <div class="home-container">
    <div class="content-wrapper">
      <h1 class="text-h3 mb-6">Welcome to XHappyDays</h1>
      <v-card class="welcome-card">
        <v-card-text>
          <p class="text-h5 mb-4">Your personal happiness tracker</p>
          <p class="text-body-1 mb-6">Choose a section from the sidebar to get started:</p>
          <v-list class="mt-4">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-bolt" color="primary" size="large"></v-icon>
              </template>
              <v-list-item-title class="text-h6">Energy - Track your daily energy levels</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-clock" color="primary" size="large"></v-icon>
              </template>
              <v-list-item-title class="text-h6">Past - Review your historical data</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-calendar" color="primary" size="large"></v-icon>
              </template>
              <v-list-item-title class="text-h6">Future - Plan your upcoming activities</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
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

.v-list-item {
  margin: 8px 0;
}
</style> 