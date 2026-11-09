<template>
  <section class="campaign-folder" :class="{ 'is-flush': flushTop }">
    <button type="button" class="folder-head" @click="open = !open">
      <div>
        <p class="folder-kicker">{{ t('campaigns.kicker') }}</p>
        <h3 class="folder-title">{{ campaign.title }}</h3>
        <p v-if="dayLabel" class="folder-meta">
          {{ t('campaigns.dayProgress', { current: dayLabel.current, total: dayLabel.total }) }}
        </p>
      </div>
      <div class="folder-head-actions">
        <router-link
          v-if="campaignId"
          class="folder-open"
          :to="{ path: `/missions/campaigns/${campaignId}` }"
          @click.stop
        >
          {{ t('campaigns.open') }}
        </router-link>
        <v-icon class="folder-toggle">{{ open ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </div>
    </button>

    <div v-if="open" class="folder-body">
      <ChallengeCard
        v-for="challenge in missions"
        :key="challenge._id"
        :challenge="challenge"
        :current-user-id="currentUserId"
        class="folder-card"
        @click="$emit('challenge-click', challenge)"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ChallengeCard from '../ChallengeCard.vue'
import { campaignDayLabel } from '../../utils/campaigns'

const props = defineProps({
  campaign: { type: Object, required: true },
  missions: { type: Array, default: () => [] },
  currentUserId: { type: String, default: '' },
  flushTop: { type: Boolean, default: false }
})

defineEmits(['challenge-click'])

const { t } = useI18n()
const open = ref(true)
const dayLabel = computed(() => campaignDayLabel(props.campaign))
const campaignId = computed(() => String(props.campaign?._id || props.campaign?.id || ''))
</script>

<style scoped>
.campaign-folder {
  margin-top: 20px;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: 20px;
  background: var(--home-surface, rgba(22, 27, 40, 0.45));
  overflow: hidden;
}

.campaign-folder.is-flush {
  margin-top: 0;
}

.folder-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  background: transparent;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.folder-kicker {
  margin: 0;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.folder-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.folder-open {
  color: var(--home-teal, #4fd1c5);
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
}

.folder-toggle {
  color: var(--home-text, #f1f5f9) !important;
}

.folder-title {
  margin: 2px 0 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.folder-meta {
  margin: 4px 0 0;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.85rem;
}

.folder-body {
  padding: 0 12px 14px;
}

.folder-card {
  margin-top: 10px;
}
</style>
