<template>
  <v-card
    :class="['hero-card-premium', `rank-${rank}`]"
    @click="$emit('click', user)"
  >
    <v-card-text class="text-center pt-8">
      <div class="avatar-wrapper mb-4">
        <div :class="['rank-crown-badge', `rank-color-${rank}`]">
          <v-icon size="16">mdi-crown</v-icon>
          <span>#{{ rank }}</span>
        </div>
        <v-badge
          bordered
          :color="badgeColor"
          icon="mdi-check-decagram"
          location="bottom right"
          offset-x="10"
          offset-y="10"
        >
          <v-avatar size="110" class="hero-avatar-main shadow-glow">
            <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover />
            <div v-else class="avatar-gen-dark">{{ user.initials }}</div>
          </v-avatar>
        </v-badge>
      </div>

      <h3 class="hero-name-premium mt-4">{{ user.name }}</h3>
      <div class="hero-rank-tag text-overline" :style="{ color: user.rankColor }">
        {{ user.rankName }}
      </div>

      <div class="px-6 py-4">
        <div class="xp-container-dark">
          <div class="d-flex justify-space-between text-overline mb-1">
            <span class="grey-text">{{ t('users.levelShort', { level: user.displayLevel }) }}</span>
            <span class="xp-value font-weight-bold">{{ t('users.xpShort', { count: user.displayXp }) }}</span>
          </div>
          <v-progress-linear
            :model-value="user.progressPercent"
            :color="user.rankColor"
            height="8"
            rounded
            class="hero-xp-bar"
          />
        </div>
      </div>

      <div class="d-flex justify-center gap-4 mt-2">
        <div class="hero-mini-stat">
          <v-icon size="14" color="teal-accent-4">mdi-sword</v-icon>
          <span>{{ user.challengeCount || 0 }}</span>
        </div>
        <div class="hero-mini-stat">
          <v-icon size="14" color="teal-accent-4">mdi-calendar-check</v-icon>
          <span>{{ t('users.daysShort', { count: user.daysOnSite || 0 }) }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  user: { type: Object, required: true },
  rank: { type: Number, required: true }
})

defineEmits(['click'])

const { t } = useI18n()

const badgeColor = computed(() => {
  if (props.rank === 1) return 'amber-accent-4'
  if (props.rank === 2) return 'blue-grey-lighten-4'
  return 'orange-darken-4'
})
</script>

<style scoped>
.hero-card-premium {
  position: relative;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
  cursor: pointer;
}

.hero-card-premium:hover {
  transform: translateY(-8px) scale(1.02);
  background: rgba(255, 255, 255, 0.06) !important;
}

.rank-1 {
  border-color: rgba(255, 215, 0, 0.3) !important;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.1) !important;
}

.rank-2 {
  border-color: rgba(192, 192, 192, 0.3) !important;
  box-shadow: 0 0 30px rgba(192, 192, 192, 0.1) !important;
}

.rank-3 {
  border-color: rgba(205, 127, 50, 0.3) !important;
  box-shadow: 0 0 30px rgba(205, 127, 50, 0.1) !important;
}

.rank-crown-badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 12px;
  border-radius: 0 0 12px 12px;
  font-size: 10px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}

.rank-color-1 { background: #ffd700; color: #000; }
.rank-color-2 { background: #c0c0c0; color: #000; }
.rank-color-3 { background: #cd7f32; color: #fff; }

.hero-name-premium {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 800;
}

.grey-text {
  color: rgba(255, 255, 255, 0.5) !important;
}

.xp-value {
  color: #ffffff;
}

.hero-xp-bar {
  background: rgba(255, 255, 255, 0.05) !important;
}

.avatar-gen-dark {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 900;
  color: #4fd1c5;
}

.hero-avatar-main {
  border: 4px solid rgba(255, 255, 255, 0.05);
}

.shadow-glow {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.hero-mini-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
}

@media (max-width: 600px) {
  .hero-avatar-main {
    width: 80px !important;
    height: 80px !important;
  }

  .hero-name-premium {
    font-size: 1.2rem !important;
  }

  .hero-xp-bar {
    height: 4px !important;
  }
}
</style>
