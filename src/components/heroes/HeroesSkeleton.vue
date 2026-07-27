<template>
  <div class="heroes-skeleton-wrapper">
    <v-row class="mb-6">
      <v-col v-for="n in 3" :key="'top-' + n" cols="12" md="4">
        <v-card class="skeleton-card rounded-xl pt-6" variant="flat">
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
        <v-card class="skeleton-card skeleton-card--list rounded-lg pa-2" variant="flat">
          <v-skeleton-loader type="list-item-avatar" theme="dark" />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.heroes-skeleton-wrapper {
  opacity: 0.85;
}

.skeleton-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.55)) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.skeleton-card--list {
  min-height: 72px;
}

:deep(.v-skeleton-loader__avatar) {
  width: 96px !important;
  height: 96px !important;
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
