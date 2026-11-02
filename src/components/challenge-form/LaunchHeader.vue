<template>
  <header class="launch-header" :class="{ 'launch-header--campaign': campaignSlot }">
    <v-btn
      v-if="campaignSlot"
      icon="mdi-chevron-left"
      variant="text"
      class="back-btn"
      :to="{ name: 'campaign-detail', params: { id: campaignId } }"
    />
    <div class="launch-header-copy">
      <div class="launch-header-title-row">
        <v-icon
          v-if="!campaignSlot"
          color="#4FD1C5"
          size="36"
          class="launch-header-icon"
        >
          mdi-rocket-launch
        </v-icon>
        <div>
          <p v-if="campaignSlot" class="launch-kicker">
            {{ campaignTitle || t('campaigns.kicker') }}
          </p>
          <h1 class="launch-title">{{ title }}</h1>
          <p v-if="!campaignSlot" class="launch-subtitle">
            {{ t('challenges.launch.subtitle') }}
          </p>
        </div>
      </div>
      <p v-if="lead" class="launch-lead">{{ lead }}</p>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDateForLocale, getInclusiveDaysBetween } from '../../utils/dateUtils'

const props = defineProps({
  campaignContext: { type: Object, default: null }
})

const { t, locale } = useI18n()

const campaignSlot = computed(() => props.campaignContext?.slot || '')
const campaignId = computed(() => props.campaignContext?.id || '')
const campaignTitle = computed(() => props.campaignContext?.campaign?.title || '')

const title = computed(() => {
  if (campaignSlot.value === 'shared') return t('campaigns.sharedSlot')
  if (campaignSlot.value === 'personal') return t('campaigns.personalSlot')
  return t('challenges.launch.title')
})

const lead = computed(() => {
  if (!campaignSlot.value) return t('challenges.launch.description')
  const campaign = props.campaignContext?.campaign
  if (!campaign?.startDate) return ''
  return t('campaigns.slotRange', {
    count: getInclusiveDaysBetween(campaign.startDate, campaign.endDate),
    date: formatDateForLocale(campaign.startDate, locale.value)
  })
})
</script>

<style scoped>
.launch-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.launch-header--campaign {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  flex-shrink: 0;
  color: #fff !important;
}

.launch-header-copy {
  min-width: 0;
}

.launch-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.launch-header--campaign .launch-header-title-row {
  margin-bottom: 0;
}

.launch-header-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.35));
}

.launch-kicker {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--home-teal, #4fd1c5);
}

.launch-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.launch-subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.launch-lead {
  margin: 6px 0 0;
  max-width: 54ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}
</style>
