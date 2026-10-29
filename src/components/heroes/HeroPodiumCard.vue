<template>
  <v-card
    :class="['hero-podium-card', `rank-${rank}`]"
    variant="flat"
    role="button"
    tabindex="0"
    @click="$emit('click', user)"
    @keydown.enter.prevent="$emit('click', user)"
    @keydown.space.prevent="$emit('click', user)"
  >
    <div
      v-if="showFriendAction"
      class="podium-friend"
      @click.stop
      @keydown.stop
    >
      <FriendActionButton
        compact
        :status="friendshipStatus"
        :busy="friendBusy"
        @add="$emit('friend-add', user)"
        @cancel="$emit('friend-cancel', user)"
        @accept="$emit('friend-accept', user)"
        @reject="$emit('friend-reject', user)"
      />
    </div>
    <v-card-text class="hero-podium-body">
      <div class="avatar-wrapper">
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
          <RankedAvatar
            :avatar-url="user.avatarUrl"
            :seed="user._id || user.id"
            :initials="user.initials"
            :level="user.displayLevel"
            :size="96"
            :alt="user.name || ''"
          />
        </v-badge>
      </div>

      <h3 class="hero-name">{{ user.name }}</h3>
      <div class="hero-rank-tag" :style="{ color: user.rankColor }">
        {{ podiumRankLine }}
      </div>

      <div class="xp-block">
        <div class="xp-meta">
          <span>{{ t('users.levelShort', { level: user.displayLevel }) }}</span>
          <span class="xp-value">{{ t('users.xpShort', { count: user.displayXp }) }}</span>
        </div>
        <v-progress-linear
          :model-value="user.progressPercent"
          :color="user.rankColor"
          height="8"
          rounded
          class="hero-xp-bar"
        />
      </div>

    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getRankTier } from '../../utils/levelSystem'
import RankedAvatar from '../user/RankedAvatar.vue'
import FriendActionButton from '../friends/FriendActionButton.vue'

const props = defineProps({
  user: { type: Object, required: true },
  rank: { type: Number, required: true },
  friendshipStatus: { type: String, default: 'none' },
  friendBusy: { type: Boolean, default: false },
  showFriendAction: { type: Boolean, default: false }
})

defineEmits(['click', 'friend-add', 'friend-cancel', 'friend-accept', 'friend-reject'])

const { t } = useI18n()

const badgeColor = computed(() => {
  if (props.rank === 1) return 'amber-accent-4'
  if (props.rank === 2) return 'blue-grey-lighten-4'
  return 'orange-darken-4'
})

const podiumRankLine = computed(() => {
  const tier = getRankTier(props.user?.displayLevel || 1)
  if (!tier) return props.user?.rankName || ''
  return `${props.user?.rankName} · ${t('profile.rankTier', { n: tier })}`
})
</script>

<style scoped>
.hero-podium-card {
  position: relative;
  background: var(--home-surface, rgba(22, 27, 40, 0.55)) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
  border-radius: var(--home-radius, 22px) !important;
  transition:
    border-color 0.25s var(--home-ease, ease),
    transform 0.25s var(--home-ease, ease);
  overflow: hidden;
  cursor: pointer;
}

.hero-podium-card:hover,
.hero-podium-card:focus-visible {
  transform: translateY(-4px);
  border-color: var(--home-border-hi, rgba(79, 209, 197, 0.38)) !important;
  outline: none;
}

.rank-1 {
  border-color: rgba(255, 215, 0, 0.35) !important;
}

.rank-2 {
  border-color: rgba(192, 192, 192, 0.3) !important;
}

.rank-3 {
  border-color: rgba(205, 127, 50, 0.3) !important;
}

.podium-friend {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 12;
}

.hero-podium-body {
  text-align: center;
  padding: clamp(20px, 3vw, 28px) 16px 20px !important;
}

.avatar-wrapper {
  position: relative;
  display: inline-flex;
  margin-bottom: 12px;
  padding-top: 18px;
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

.hero-name {
  margin: 8px 0 0;
  color: var(--home-text, #f1f5f9);
  font-size: 1.25rem;
  font-weight: 800;
}

.hero-rank-tag {
  margin-top: 4px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.xp-block {
  margin: 16px 8px 12px;
}

.xp-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--home-text-dim, #94a3b8);
}

.xp-value {
  color: var(--home-text, #f1f5f9);
}

.hero-xp-bar {
  background: rgba(255, 255, 255, 0.06) !important;
}

@media (max-width: 600px) {
  .hero-avatar {
    width: 72px !important;
    height: 72px !important;
  }

  .hero-name {
    font-size: 1.05rem;
  }
}
</style>
