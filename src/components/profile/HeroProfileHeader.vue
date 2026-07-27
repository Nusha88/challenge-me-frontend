<template>
  <header class="hero-profile-header">
    <router-link to="/heroes" class="back-link">
      <v-icon size="18">mdi-arrow-left</v-icon>
      {{ t('profile.backToHeroes') }}
    </router-link>

    <div v-if="user" class="hero-identity">
      <v-avatar size="120" class="hero-avatar">
        <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover />
        <div v-else class="avatar-gen">{{ user.initials }}</div>
      </v-avatar>

      <div class="hero-copy">
        <h1 class="hero-name">{{ user.name }}</h1>
        <p class="hero-subtitle">
          {{ user.rankName || t('profile.heroProfileSubtitle') }}
        </p>

        <div class="hero-meta">
          <v-chip :color="user.rankColor" size="small" class="rank-chip">
            <v-icon start size="16">{{ rankIcon }}</v-icon>
            {{ t('profile.levelLabel') }} {{ user.displayLevel }}
          </v-chip>
          <span class="meta-badge">
            <v-icon size="14">mdi-sword</v-icon>
            {{ user.challengeCount ?? 0 }}
          </span>
          <span class="meta-badge">
            <v-icon size="14">mdi-calendar-check</v-icon>
            {{ user.daysOnSite }} {{ t('users.daysOnSite') }}
          </span>
          <span class="meta-badge sparks">
            <span class="spark-glyph" aria-hidden="true">✦</span>
            {{ user.sparks ?? 0 }}
          </span>
        </div>

        <div class="xp-block">
          <div class="xp-labels">
            <span>{{ t('profile.rankLabel') }} {{ rankRoman }}</span>
            <span>{{ user.displayXp }} / {{ user.xpForNextLevel }} XP</span>
          </div>
          <v-progress-linear
            :model-value="user.progressPercent"
            color="#4FD1C5"
            height="8"
            rounded
          />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getRank, getRankIcon } from '../../utils/levelSystem'

const props = defineProps({
  user: { type: Object, default: null }
})

const { t } = useI18n()

const rankIcon = computed(() => getRankIcon(props.user?.displayLevel || 1))
const rankRoman = computed(() => getRank(props.user?.displayLevel || 1))
</script>

<style scoped>
.hero-profile-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--home-teal, #4fd1c5);
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.hero-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--home-radius, 16px);
}

@media (min-width: 960px) {
  .hero-identity {
    flex-direction: row;
    align-items: flex-end;
  }
}

.hero-avatar {
  border: 3px solid rgba(79, 209, 197, 0.35) !important;
  background: #1a1a2e;
  flex-shrink: 0;
}

.avatar-gen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  color: #4fd1c5;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.hero-copy {
  flex: 1;
  min-width: 0;
  width: 100%;
  text-align: center;
}

@media (min-width: 960px) {
  .hero-copy {
    text-align: left;
  }
}

.hero-name {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.hero-subtitle {
  margin: 6px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
}

@media (min-width: 960px) {
  .hero-meta {
    justify-content: flex-start;
  }
}

.rank-chip {
  font-weight: 700 !important;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--home-text-dim, #94a3b8);
}

.meta-badge.sparks {
  color: #fbbf24;
}

.spark-glyph {
  font-size: 0.85rem;
}

.xp-block {
  max-width: 360px;
  margin: 16px auto 0;
}

@media (min-width: 960px) {
  .xp-block {
    margin: 16px 0 0;
  }
}

.xp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--home-text-dim, #94a3b8);
  margin-bottom: 6px;
}
</style>
