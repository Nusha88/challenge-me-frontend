<template>
  <v-card class="hero-card-standard-dark pa-4" @click="$emit('click', user)">
    <div class="d-flex align-center">
      <v-badge
        color="teal-accent-4"
        :content="t('users.levelBadge', { level: user.displayLevel })"
        location="bottom right"
        offset-x="5"
        offset-y="5"
        overlap
      >
        <v-avatar size="50" class="border-neon-dim">
          <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover />
          <span v-else class="avatar-initials font-weight-bold">{{ user.initials }}</span>
        </v-avatar>
      </v-badge>

      <div class="ml-4 flex-grow-1 min-width-0">
        <div class="d-flex justify-space-between align-center">
          <h4 class="hero-name-small text-truncate">{{ user.name }}</h4>
          <v-icon size="18" class="chevron-icon">mdi-chevron-right</v-icon>
        </div>

        <div class="d-flex mt-1 gap-4">
          <span class="text-caption grey-text">
            <v-icon size="12" class="stat-icon-dim">mdi-sword</v-icon>
            {{ user.challengeCount }}
          </span>
          <span class="text-caption grey-text">
            <v-icon size="12" class="stat-icon-dim">mdi-fire</v-icon>
            {{ t('users.daysShort', { count: user.daysOnSite }) }}
          </span>
          <span class="text-caption grey-text">
            <v-icon size="12" class="stat-icon-dim">mdi-star-four-points</v-icon>
            {{ t('users.xpShort', { count: user.displayXp }) }}
          </span>
        </div>

        <v-progress-linear
          :model-value="user.progressPercent"
          height="2"
          :color="user.rankColor"
          class="mt-2 opacity-50"
          rounded
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  user: { type: Object, required: true }
})

defineEmits(['click'])

const { t } = useI18n()
</script>

<style scoped>
.hero-card-standard-dark {
  position: relative;
  background: rgba(30, 30, 45, 0.4) !important;
  border: 1px solid rgba(79, 209, 197, 0.1) !important;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hero-card-standard-dark:hover {
  background: rgba(79, 209, 197, 0.08) !important;
  border-color: rgba(79, 209, 197, 0.5) !important;
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.1) !important;
}

.hero-card-standard-dark:hover .chevron-icon {
  color: #4fd1c5 !important;
  transform: translateX(3px);
}

.chevron-icon {
  color: rgba(79, 209, 197, 0.3);
  transition: all 0.2s ease;
}

.hero-name-small {
  color: #ffffff !important;
  font-weight: 700;
  font-size: 1.1rem;
}

.grey-text {
  color: rgba(255, 255, 255, 0.5) !important;
}

.stat-icon-dim {
  color: rgba(79, 209, 197, 0.6);
  margin-right: 4px;
}

.border-neon-dim {
  border: 2px solid rgba(79, 209, 197, 0.2);
  background: #0f172a !important;
}

.avatar-initials {
  color: #ffffff;
}

@media (max-width: 480px) {
  .hero-card-standard-dark {
    padding: 8px 12px !important;
  }

  .hero-card-standard-dark :deep(.v-avatar) {
    width: 40px !important;
    height: 40px !important;
  }

  .hero-name-small {
    font-size: 0.9rem !important;
  }
}
</style>
