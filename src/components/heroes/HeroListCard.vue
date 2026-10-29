<template>
  <v-card
    class="hero-list-card"
    variant="flat"
    role="button"
    tabindex="0"
    @click="$emit('click', user)"
    @keydown.enter.prevent="$emit('click', user)"
    @keydown.space.prevent="$emit('click', user)"
  >
    <div class="hero-list-row">
      <v-badge
        color="#4FD1C5"
        :content="t('users.levelBadge', { level: user.displayLevel })"
        location="bottom right"
        offset-x="5"
        offset-y="5"
        overlap
      >
        <RankedAvatar
          :avatar-url="user.avatarUrl"
          :seed="user._id || user.id"
          :initials="user.initials"
          :level="user.displayLevel"
          :size="48"
          :alt="user.name || ''"
        />
      </v-badge>

      <div class="hero-list-copy">
        <div class="hero-list-top">
          <h4 class="hero-list-name text-truncate">{{ user.name }}</h4>
          <FriendActionButton
            v-if="showFriendAction"
            compact
            :status="friendshipStatus"
            :busy="friendBusy"
            @add="$emit('friend-add', user)"
            @cancel="$emit('friend-cancel', user)"
            @accept="$emit('friend-accept', user)"
            @reject="$emit('friend-reject', user)"
          />
          <v-icon size="18" class="chevron-icon">mdi-chevron-right</v-icon>
        </div>

        <div class="hero-list-stats">
          <span>
            <v-icon size="12" class="stat-icon">mdi-sword</v-icon>
            {{ user.challengeCount || 0 }}
          </span>
          <span>
            <v-icon size="12" class="stat-icon">mdi-star-four-points</v-icon>
            {{ t('users.xpShort', { count: user.displayXp }) }}
          </span>
        </div>

        <v-progress-linear
          :model-value="user.progressPercent"
          height="2"
          :color="user.rankColor"
          class="mt-2"
          rounded
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import RankedAvatar from '../user/RankedAvatar.vue'
import FriendActionButton from '../friends/FriendActionButton.vue'

defineProps({
  user: { type: Object, required: true },
  friendshipStatus: { type: String, default: 'none' },
  friendBusy: { type: Boolean, default: false },
  showFriendAction: { type: Boolean, default: false }
})

defineEmits(['click', 'friend-add', 'friend-cancel', 'friend-accept', 'friend-reject'])

const { t } = useI18n()
</script>

<style scoped>
.hero-list-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.55)) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
  border-radius: var(--home-radius, 16px) !important;
  cursor: pointer;
  transition:
    border-color 0.25s var(--home-ease, ease),
    background 0.25s var(--home-ease, ease);
  padding: 14px;
}

.hero-list-card:hover,
.hero-list-card:focus-visible {
  border-color: var(--home-border-hi, rgba(79, 209, 197, 0.38)) !important;
  background: rgba(79, 209, 197, 0.06) !important;
  outline: none;
}

.hero-list-card:hover .chevron-icon,
.hero-list-card:focus-visible .chevron-icon {
  color: var(--home-teal, #4fd1c5);
  transform: translateX(2px);
}

.hero-list-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-list-copy {
  flex: 1;
  min-width: 0;
}

.hero-list-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.hero-list-name {
  margin: 0;
  color: var(--home-text, #f1f5f9);
  font-weight: 700;
  font-size: 1rem;
}

.chevron-icon {
  color: rgba(79, 209, 197, 0.35);
  transition: all 0.2s var(--home-ease, ease);
  flex-shrink: 0;
}

.hero-list-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.75rem;
}

.stat-icon {
  color: rgba(79, 209, 197, 0.65);
  margin-right: 3px;
}

@media (max-width: 480px) {
  .hero-list-card {
    padding: 10px 12px;
  }

  .hero-list-name {
    font-size: 0.9rem;
  }
}
</style>
