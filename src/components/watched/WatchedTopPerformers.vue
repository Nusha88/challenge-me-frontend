<template>
  <v-card v-if="performers.length > 0" class="sidebar-widget mb-6" variant="flat">
    <div class="widget-header pa-4 d-flex align-center">
      <v-icon color="amber" class="mr-2">mdi-trophy-variant</v-icon>
      <span class="text-overline font-weight-black">{{ t('watched.elitePerformers') }}</span>
    </div>
    <v-card-text class="pa-4 pt-0">
      <div
        v-for="(participant, index) in performers"
        :key="getParticipantUserId(participant) || index"
        class="performer-row d-flex align-center mb-4"
      >
        <div class="rank-badge">{{ index + 1 }}</div>
        <v-avatar size="36" class="mx-3 border-neon">
          <v-img v-if="getParticipantAvatar(participant)" :src="getParticipantAvatar(participant)" />
          <span v-else class="text-caption">{{ getParticipantInitial(participant, t('common.unknown')) }}</span>
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-body-2 performer-name text-truncate">
            {{ getParticipantDisplayName(participant, t('common.unknown')) }}
          </div>
          <v-progress-linear
            :model-value="getParticipantProgressPercentage(participant, participant._cachedChallenge)"
            height="3"
            color="teal-accent-4"
            rounded
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
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
.sidebar-widget {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
}

.widget-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.widget-header .text-overline {
  color: #ffffff !important;
  letter-spacing: 2px;
}

.performer-name {
  color: #ffffff;
  font-weight: 700;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
  font-weight: 900;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.border-neon {
  border: 1px solid rgba(79, 209, 197, 0.3) !important;
}

@media (max-width: 960px) {
  .sidebar-widget {
    border-radius: 16px !important;
    margin-bottom: 12px !important;
  }

  .widget-header {
    padding: 10px 12px !important;
  }

  .performer-row {
    margin-bottom: 8px !important;
  }
}
</style>
