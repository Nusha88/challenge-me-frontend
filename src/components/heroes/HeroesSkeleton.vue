<template>
  <div class="heroes-skeleton-wrapper">
    <v-skeleton-loader
      type="heading"
      class="search-bar-skeleton mb-10 rounded-pill"
    />

    <v-row class="mb-10">
      <v-col v-for="n in 3" :key="'top-' + n" cols="12" md="4">
        <v-card class="skeleton-card-dark rounded-xl pt-6">
          <div class="d-flex flex-column align-center">
            <v-skeleton-loader type="avatar" class="mb-4" theme="dark" />
            <v-skeleton-loader type="text, subtitle" class="w-75 mb-4" theme="dark" />
            <v-skeleton-loader type="actions" class="w-100" theme="dark" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col v-for="n in 6" :key="'list-' + n" cols="12" md="4">
        <v-card class="skeleton-card-dark rounded-lg pa-2">
          <v-skeleton-loader type="list-item-avatar" theme="dark" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.heroes-skeleton-wrapper {
  opacity: 0.8;
}

.search-bar-skeleton {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(79, 209, 197, 0.1);
  max-width: 100%;
  height: 56px;
}

.skeleton-card-dark {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(79, 209, 197, 0.1) !important;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

:deep(.v-skeleton-loader__avatar) {
  width: 120px !important;
  height: 120px !important;
  margin: 0 auto;
}

:deep(.v-skeleton-loader__text),
:deep(.v-skeleton-loader__subtitle) {
  background: rgba(255, 255, 255, 0.05) !important;
  margin-left: auto;
  margin-right: auto;
}

:deep(.v-skeleton-loader__bone::after) {
  background: linear-gradient(90deg, transparent, rgba(79, 209, 197, 0.08), transparent) !important;
}
</style>
