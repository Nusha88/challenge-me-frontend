<template>
  <div class="heroes-toolbar">
    <v-text-field
      :model-value="modelValue"
      :placeholder="t('users.searchPlaceholder')"
      variant="outlined"
      density="comfortable"
      hide-details
      class="heroes-search"
      @update:model-value="$emit('update:modelValue', $event)"
      @keyup.enter="$emit('search')"
    >
      <template #prepend-inner>
        <v-icon color="#4FD1C5" size="20">mdi-magnify</v-icon>
      </template>
      <template v-if="modelValue" #append-inner>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          class="heroes-search-clear"
          :aria-label="t('users.clearSearch')"
          @click.stop="$emit('clear')"
        />
      </template>
    </v-text-field>

    <div
      class="heroes-sort-tabs"
      role="tablist"
      :aria-label="t('users.sort.label')"
    >
      <button
        v-for="option in sortOptions"
        :key="option.value"
        type="button"
        class="heroes-sort-tab"
        role="tab"
        :aria-selected="sortBy === option.value"
        :class="{ active: sortBy === option.value }"
        @click="$emit('update:sortBy', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: String, default: '' },
  sortBy: { type: String, default: 'xp' }
})

defineEmits(['update:modelValue', 'update:sortBy', 'search', 'clear'])

const { t } = useI18n()

const sortOptions = computed(() => [
  { value: 'xp', label: t('users.sort.xp') },
  { value: 'missions', label: t('users.sort.missions') },
  { value: 'newest', label: t('users.sort.newest') }
])
</script>

<style scoped>
.heroes-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: clamp(18px, 2.5vw, 28px);
}

.heroes-search {
  flex: 1;
  min-width: 0;
}

.heroes-search :deep(.v-field) {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03)) !important;
  border-radius: 14px !important;
  color: var(--home-text, #f1f5f9) !important;
}

.heroes-search :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--home-border, rgba(255, 255, 255, 0.08)) !important;
}

.heroes-search :deep(.v-field--focused .v-field__outline) {
  color: var(--home-teal, #4fd1c5) !important;
}

.heroes-search-clear {
  color: var(--home-text-dim, #94a3b8) !important;
}

.heroes-sort-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 14px;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.heroes-sort-tab {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--home-text-dim, #94a3b8);
  border-radius: 10px;
  min-height: 44px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  transition:
    background 0.2s var(--home-ease, ease),
    color 0.2s var(--home-ease, ease),
    box-shadow 0.2s var(--home-ease, ease);
}

.heroes-sort-tab.active {
  color: var(--home-text, #f1f5f9);
  background: var(--home-surface, rgba(22, 27, 40, 0.85));
  box-shadow: inset 0 0 0 1px var(--home-border-hi, rgba(79, 209, 197, 0.28));
}

@media (max-width: 959px) {
  .heroes-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .heroes-sort-tabs {
    width: 100%;
  }

  .heroes-sort-tab {
    min-height: 40px;
    font-size: 0.68rem;
    padding: 6px 8px;
  }
}
</style>
