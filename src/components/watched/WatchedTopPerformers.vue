<template>
  <section v-if="performers.length > 0" class="watched-rail-block">
    <MissionSectionDivider
      :label="t('watched.sections.topPerformers')"
      icon="mdi-trophy-variant"
      :count="performers.length"
      flush-top
    />
    <div class="watched-rail-panel">
      <div
        v-for="(participant, index) in performers"
        :key="getParticipantUserId(participant) || index"
        class="performer-row"
      >
        <div class="rank-badge">{{ index + 1 }}</div>
        <v-avatar size="36" class="performer-avatar">
          <v-img v-if="getParticipantAvatar(participant)" :src="getParticipantAvatar(participant)" />
          <span v-else class="text-caption">{{ getParticipantInitial(participant, t('common.unknown')) }}</span>
        </v-avatar>
        <div class="performer-meta">
          <div class="performer-name text-truncate">
            {{ getParticipantDisplayName(participant, t('common.unknown')) }}
          </div>
          <v-progress-linear
            :model-value="getParticipantProgressPercentage(participant, participant._cachedChallenge)"
            height="3"
            color="#4FD1C5"
            rounded
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import MissionSectionDivider from '../MissionSectionDivider.vue'
import { getParticipantUserId } from '../../utils/challengeMembership'
import {
  getParticipantAvatar,
  getParticipantDisplayName,
  getParticipantInitial,
  getParticipantProgressPercentage
} from '../../utils/challengeProgress'

defineProps({
  performers: { type: Array, default: () => [] }
})

const { t } = useI18n()
</script>

<style scoped>
.watched-rail-block {
  margin-bottom: 8px;
}

.watched-rail-panel {
  padding: 14px;
  border-radius: var(--home-radius, 22px);
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.performer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.performer-row:last-child {
  margin-bottom: 0;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 193, 7, 0.12);
  color: var(--home-gold, #ffc107);
  font-weight: 900;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.performer-avatar {
  border: 1px solid rgba(79, 209, 197, 0.28) !important;
  flex-shrink: 0;
}

.performer-meta {
  flex: 1;
  min-width: 0;
}

.performer-name {
  color: var(--home-text, #f1f5f9);
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 6px;
}
</style>
