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

      <v-hover v-slot="{ isHovering, props: hoverProps }">
        <v-avatar
          size="112"
          v-bind="hoverProps"
          class="identity-avatar clickable"
          @click="$emit('trigger-upload')"
        >
          <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover />
          <div v-else class="avatar-gen">{{ user.initials }}</div>
          <v-fade-transition>
            <div
              v-if="isHovering || uploading"
              class="avatar-overlay d-flex align-center justify-center"
            >
              <v-progress-circular v-if="uploading" indeterminate color="white" size="28" />
              <v-icon v-else color="white" size="28">mdi-camera-plus</v-icon>
            </div>
          </v-fade-transition>
        </v-avatar>
      </v-hover>

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
            <span>{{ t('profile.rankLabel') }} {{ rankRoman }}</span>
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
import { getRank, getRankIcon } from '../../utils/levelSystem'

const props = defineProps({
  user: { type: Object, default: null },
  uploading: { type: Boolean, default: false },
  uploadError: { type: String, default: '' }
})

const emit = defineEmits(['trigger-upload', 'file-change', 'clear-upload-error', 'bind-file-input'])

const { t } = useI18n()
const fileInputRef = ref(null)

const rankIcon = computed(() => getRankIcon(props.user?.displayLevel || 1))
const rankRoman = computed(() => getRank(props.user?.displayLevel || 1))

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

@media (min-width: 960px) {
  .identity-band {
    flex-direction: row;
    align-items: flex-end;
  }
}

.identity-avatar {
  border: 3px solid rgba(79, 209, 197, 0.35) !important;
  background: #1a1a2e;
  position: relative;
  overflow: hidden;
}

.identity-avatar.clickable {
  cursor: pointer;
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

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
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
