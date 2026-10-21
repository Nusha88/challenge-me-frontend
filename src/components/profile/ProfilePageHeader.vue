<template>
  <header class="profile-page-header">
    <div class="profile-header-copy">
      <div class="profile-header-title-row">
        <v-icon color="#4FD1C5" size="36" class="profile-header-icon">mdi-account-circle</v-icon>
        <div>
          <h1 class="profile-title">{{ t('profile.pageTitle') }}</h1>
          <p class="profile-subtitle">{{ t('profile.pageSubtitle') }}</p>
        </div>
      </div>
      <p class="profile-lead">{{ t('profile.pageLead') }}</p>
      <div v-if="user" class="profile-meta">
        <span>{{ t('profile.levelLabel') }} {{ user.displayLevel }}</span>
        <span class="meta-dot" aria-hidden="true">·</span>
        <span>{{ user.displayXp }} XP</span>
        <span class="meta-dot" aria-hidden="true">·</span>
        <span>{{ user.daysOnSite }} {{ t('users.daysOnSite') }}</span>
        <span class="meta-dot" aria-hidden="true">·</span>
        <span class="sparks-meta">
          <span class="spark-glyph" aria-hidden="true">✦</span>
          {{ user.sparks ?? 0 }}
        </span>
      </div>
    </div>

    <div v-if="user" class="identity-band">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="d-none"
        @change="$emit('file-change', $event)"
      />

      <div class="identity-avatar">
        <v-hover v-slot="{ isHovering, props: hoverProps }">
          <RankedAvatar
            v-bind="hoverProps"
            :avatar-url="user.avatarUrl"
            :seed="user._id || user.id"
            :initials="user.initials"
            :level="user.displayLevel"
            :dimmed="dimmed"
            :size="112"
            clickable
            :alt="user.name || ''"
            @click="$emit('trigger-upload')"
          >
            <template v-if="isHovering || uploading" #overlay>
              <v-progress-circular v-if="uploading" indeterminate color="white" size="28" />
              <v-icon v-else color="white" size="28">mdi-camera-plus</v-icon>
            </template>
          </RankedAvatar>
        </v-hover>

        <button
          v-if="hasPhoto"
          type="button"
          class="remove-avatar-btn"
          :disabled="uploading"
          @click="$emit('remove-avatar')"
        >
          {{ t('profile.removeAvatar') }}
        </button>
      </div>

      <div class="identity-copy">
        <h2 class="identity-name">{{ user.name }}</h2>
        <div class="identity-chips">
          <v-chip
            :color="user.rankColor"
            class="rank-chip"
            size="small"
          >
            <v-icon start size="16">{{ rankIcon }}</v-icon>
            {{ user.rankName }}
          </v-chip>
        </div>
        <div class="xp-block">
          <div class="xp-labels">
            <span>{{ rankLine }}</span>
            <span>{{ t('profile.levelLabel') }} {{ user.displayLevel }}</span>
          </div>
          <v-progress-linear
            :model-value="user.progressPercent"
            color="#4FD1C5"
            height="8"
            rounded
            class="xp-progress"
          />
          <div class="xp-values">{{ user.displayXp }} / {{ user.xpForNextLevel }} XP</div>
        </div>
      </div>
    </div>

    <v-alert
      v-if="uploadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-4"
      closable
      @click:close="$emit('clear-upload-error')"
    >
      {{ uploadError }}
    </v-alert>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getRank, getRankTier, getRankIcon } from '../../utils/levelSystem'
import RankedAvatar from '../user/RankedAvatar.vue'

const props = defineProps({
  user: { type: Object, default: null },
  uploading: { type: Boolean, default: false },
  uploadError: { type: String, default: '' },
  dimmed: { type: Boolean, default: false }
})

const emit = defineEmits(['trigger-upload', 'remove-avatar', 'file-change', 'clear-upload-error', 'bind-file-input'])

const hasPhoto = computed(() => Boolean(props.user?.avatarUrl))

const { t } = useI18n()
const fileInputRef = ref(null)

const rankIcon = computed(() => getRankIcon(props.user?.displayLevel || 1))
const rankLine = computed(() => {
  const level = props.user?.displayLevel || 1
  const roman = getRank(level)
  const tier = getRankTier(level)
  if (!tier) return `${t('profile.rankLabel')} ${roman}`
  return `${t('profile.rankLabel')} ${roman} · ${t('profile.rankTier', { n: tier })}`
})

watch(fileInputRef, (el) => {
  emit('bind-file-input', el)
}, { immediate: true })
</script>

<style scoped>
.profile-page-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.profile-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.profile-header-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.35));
}

.profile-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.profile-subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.profile-lead {
  margin: 0;
  max-width: 54ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--home-teal, #4fd1c5);
}

.meta-dot {
  opacity: 0.5;
}

.spark-glyph {
  color: #fbbf24;
  margin-right: 2px;
}

.identity-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-top: clamp(24px, 4vw, 36px);
  padding: 24px;
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--home-radius, 16px);
}

.identity-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.remove-avatar-btn {
  padding: 0;
  border: 0;
  background: none;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.remove-avatar-btn:hover:not(:disabled) {
  color: #ff5252;
}

.remove-avatar-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

@media (min-width: 960px) {
  .identity-band {
    flex-direction: row;
    align-items: flex-end;
  }
}

.identity-copy {
  flex: 1;
  min-width: 0;
  width: 100%;
  text-align: center;
}

@media (min-width: 960px) {
  .identity-copy {
    text-align: left;
  }
}

.identity-name {
  margin: 0 0 10px;
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.identity-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 14px;
}

@media (min-width: 960px) {
  .identity-chips {
    justify-content: flex-start;
  }
}

.rank-chip {
  font-weight: 700 !important;
}

.xp-block {
  max-width: 320px;
  margin: 0 auto;
}

@media (min-width: 960px) {
  .xp-block {
    margin: 0;
  }
}

.xp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--home-text-dim, #94a3b8);
  margin-bottom: 6px;
}

.xp-values {
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--home-text-dim, #94a3b8);
}
</style>
