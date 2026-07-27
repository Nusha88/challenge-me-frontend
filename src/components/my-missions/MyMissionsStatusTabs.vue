<template>
  <div
    class="my-missions-tabs"
    role="tablist"
    :aria-label="t('myChallenges.tabsLabel')"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="my-missions-tab"
      role="tab"
      :aria-selected="modelValue === tab.id"
      :class="{ active: modelValue === tab.id }"
      @click="$emit('update:modelValue', tab.id)"
    >
      <span class="my-missions-tab-label">{{ tab.label }}</span>
      <span class="my-missions-tab-count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'active'
  },
  activeCount: {
    type: Number,
    default: 0
  },
  upcomingCount: {
    type: Number,
    default: 0
  },
  archiveCount: {
    type: Number,
    default: 0
  }
})

defineEmits(['update:modelValue'])

const { t } = useI18n()

const tabs = computed(() => [
  {
    id: 'active',
    label: t('myChallenges.tabs.active'),
    count: props.activeCount
  },
  {
    id: 'upcoming',
    label: t('myChallenges.tabs.upcoming'),
    count: props.upcomingCount
  },
  {
    id: 'archive',
    label: t('myChallenges.tabs.archive'),
    count: props.archiveCount
  }
])
</script>

<style scoped>
.my-missions-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: clamp(18px, 2.5vw, 28px);
  padding: 4px;
  border-radius: 14px;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.my-missions-tab {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--home-text-dim, #94a3b8);
  border-radius: 10px;
  min-height: 44px;
  padding: 8px 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition:
    background 0.2s var(--home-ease, ease),
    color 0.2s var(--home-ease, ease);
}

.my-missions-tab.active {
  background: linear-gradient(
    90deg,
    rgba(126, 70, 196, 0.45),
    rgba(79, 209, 197, 0.28)
  );
  color: var(--home-text, #f1f5f9);
}

.my-missions-tab-count {
  min-width: 1.5rem;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.72rem;
  letter-spacing: 0;
}

.my-missions-tab.active .my-missions-tab-count {
  background: rgba(79, 209, 197, 0.2);
  color: var(--home-teal, #4fd1c5);
}

@media (max-width: 480px) {
  .my-missions-tab {
    flex-direction: column;
    gap: 4px;
    font-size: 0.7rem;
    padding: 8px 4px;
  }
}
</style>
