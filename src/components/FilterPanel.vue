<template>
  <div class="filter-panel">
    <div class="filter-toolbar">
      <v-text-field
        :model-value="modelValue.title"
        :placeholder="t('filters.searchMissionsPlaceholder')"
        variant="outlined"
        density="comfortable"
        hide-details
        class="filter-search"
        @update:model-value="updateFilter('title', $event)"
        @keyup.enter="handleSearch"
      >
        <template #prepend-inner>
          <v-icon color="#4FD1C5" size="20">mdi-magnify</v-icon>
        </template>
        <template #append-inner>
          <v-btn
            icon="mdi-tune-variant"
            variant="text"
            size="small"
            class="filter-advanced-toggle"
            :class="{ 'filter-advanced-toggle--active': showAdvanced || hasActiveAdvancedFilters }"
            :aria-expanded="showAdvanced"
            @click.stop="showAdvanced = !showAdvanced"
          />
        </template>
      </v-text-field>

      <div
        class="filter-type-tabs"
        role="tablist"
        :aria-label="t('challenges.allTypes')"
      >
        <button
          v-for="tab in typeTabs"
          :key="tab.value"
          type="button"
          class="filter-type-tab"
          role="tab"
          :aria-selected="(modelValue.type || 'all') === tab.value"
          :class="{
            active: (modelValue.type || 'all') === tab.value,
            'filter-type-tab--quest': tab.value === CHALLENGE_TYPES.RESULT,
            'filter-type-tab--ritual': tab.value === CHALLENGE_TYPES.HABIT
          }"
          @click="updateFilter('type', tab.value)"
        >
          <v-icon v-if="tab.icon" :icon="tab.icon" size="16" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <v-expand-transition>
      <div v-if="showAdvanced && !isMobile" class="filter-advanced">
        <div class="filter-advanced-panel">
          <div class="filter-advanced-header">
            <button
              v-if="hasActiveFilters"
              type="button"
              class="filter-reset-btn"
              @click="resetFilters"
            >
              <v-icon icon="mdi-filter-off" size="16" />
              {{ t('filters.clear') }}
            </button>
          </div>
          <div class="filter-advanced-grid">
            <v-select
              :model-value="modelValue.owner"
              :items="ownerOptions"
              :label="t('filters.createdBy')"
              variant="outlined"
              density="comfortable"
              class="filter-select"
              :menu-props="selectMenuProps"
              @update:model-value="updateFilter('owner', $event)"
            />
            <v-select
              :model-value="modelValue.popularity"
              :items="popularityOptions"
              :label="t('filters.sortBy')"
              variant="outlined"
              density="comfortable"
              class="filter-select"
              :menu-props="selectMenuProps"
              @update:model-value="updateFilter('popularity', $event)"
            />
            <div class="filter-switches">
              <v-switch
                :model-value="modelValue.showUpcoming !== false"
                :label="t('filters.upcoming')"
                color="#4FD1C5"
                hide-details
                class="filter-switch"
                @update:model-value="updateFilter('showUpcoming', $event)"
              />
              <v-switch
                :model-value="modelValue.isCompleted === true"
                :label="t('filters.completed')"
                color="#4FD1C5"
                hide-details
                class="filter-switch"
                @update:model-value="updateFilter('isCompleted', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </v-expand-transition>

    <v-bottom-sheet v-if="isMobile" v-model="showAdvanced" scrim>
      <div class="filter-sheet">
        <div class="filter-sheet-handle" />
        <div class="filter-advanced-panel filter-advanced-panel--sheet">
          <div class="filter-advanced-header">
            <button
              v-if="hasActiveFilters"
              type="button"
              class="filter-reset-btn"
              @click="resetFilters"
            >
              <v-icon icon="mdi-filter-off" size="16" />
              {{ t('filters.clear') }}
            </button>
          </div>
          <div class="filter-advanced-grid">
            <v-select
              :model-value="modelValue.owner"
              :items="ownerOptions"
              :label="t('filters.createdBy')"
              variant="outlined"
              density="comfortable"
              class="filter-select"
              :menu-props="selectMenuProps"
              @update:model-value="updateFilter('owner', $event)"
            />
            <v-select
              :model-value="modelValue.popularity"
              :items="popularityOptions"
              :label="t('filters.sortBy')"
              variant="outlined"
              density="comfortable"
              class="filter-select"
              :menu-props="selectMenuProps"
              @update:model-value="updateFilter('popularity', $event)"
            />
            <div class="filter-switches">
              <v-switch
                :model-value="modelValue.showUpcoming !== false"
                :label="t('filters.upcoming')"
                color="#4FD1C5"
                hide-details
                class="filter-switch"
                @update:model-value="updateFilter('showUpcoming', $event)"
              />
              <v-switch
                :model-value="modelValue.isCompleted === true"
                :label="t('filters.completed')"
                color="#4FD1C5"
                hide-details
                class="filter-switch"
                @update:model-value="updateFilter('isCompleted', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </v-bottom-sheet>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import { useChallengeType, CHALLENGE_TYPES } from '../composables/useChallengeType'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'search'])
const { t } = useI18n()
const { getChallengeTypeLabel } = useChallengeType()
const { mdAndUp } = useDisplay()

const showAdvanced = ref(false)
const users = ref([])
const selectMenuProps = { contentClass: 'filter-select-menu-home' }
const isMobile = computed(() => !mdAndUp.value)

const typeTabs = computed(() => [
  { value: 'all', label: t('challenges.allTypes') },
  {
    value: CHALLENGE_TYPES.RESULT,
    label: getChallengeTypeLabel(CHALLENGE_TYPES.RESULT),
    icon: 'mdi-sword'
  },
  {
    value: CHALLENGE_TYPES.HABIT,
    label: getChallengeTypeLabel(CHALLENGE_TYPES.HABIT),
    icon: 'mdi-fire'
  }
])

const ownerOptions = computed(() =>
  users.value.map((u) => ({
    title: u.name,
    value: String(u.id || u._id)
  }))
)

const popularityOptions = computed(() => [
  { title: t('filters.popularityMost'), value: 'most' },
  { title: t('filters.popularityLeast'), value: 'least' }
])

const hasActiveFilters = computed(() => {
  const { title, owner, type, popularity, showUpcoming, isCompleted } = props.modelValue
  return Boolean(
    title
    || owner
    || (type && type !== 'all')
    || popularity
    || isCompleted
    || showUpcoming === false
  )
})

const hasActiveAdvancedFilters = computed(() => {
  const { owner, popularity, showUpcoming, isCompleted } = props.modelValue
  return Boolean(owner || popularity || isCompleted || showUpcoming === false)
})

function updateFilter(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function resetFilters() {
  emit('update:modelValue', {
    title: null,
    type: 'all',
    owner: null,
    popularity: null,
    showUpcoming: true,
    isCompleted: false
  })
  emit('search')
}

function handleSearch() {
  emit('search')
}

async function fetchUserIfNeeded(ownerId) {
  if (!ownerId) return
  const ownerIdStr = String(ownerId)
  const exists = users.value.some((u) => String(u.id || u._id) === ownerIdStr)
  if (!exists) {
    try {
      const userResp = await userService.getUserById(ownerIdStr)
      if (userResp.data?.user) {
        users.value.push(userResp.data.user)
      }
    } catch {
      // ignore
    }
  }
}

onMounted(async () => {
  try {
    const resp = await userService.getAllUsers({ limit: 100 })
    users.value = resp.data.users || []
    if (props.modelValue.owner) {
      await fetchUserIfNeeded(props.modelValue.owner)
    }
  } catch {
    // ignore
  }
})

watch(
  () => props.modelValue.owner,
  async (newOwner) => {
    if (newOwner) await fetchUserIfNeeded(newOwner)
  }
)

defineExpose({ hasActiveFilters, resetFilters })
</script>

<style scoped>
.filter-panel {
  margin-bottom: clamp(18px, 2.5vw, 28px);
}

.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-search {
  flex: 1;
  min-width: 0;
}

.filter-search :deep(.v-field) {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03)) !important;
  border-radius: 14px !important;
  color: var(--home-text, #f1f5f9) !important;
}

.filter-search :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--home-border, rgba(255, 255, 255, 0.08)) !important;
}

.filter-search :deep(.v-field--focused .v-field__outline) {
  color: var(--home-teal, #4fd1c5) !important;
}

.filter-advanced-toggle {
  color: var(--home-text-dim, #94a3b8) !important;
}

.filter-advanced-toggle--active {
  color: var(--home-teal, #4fd1c5) !important;
}

.filter-type-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 14px;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.filter-type-tab {
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
  gap: 6px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  transition:
    background 0.2s var(--home-ease, ease),
    color 0.2s var(--home-ease, ease),
    box-shadow 0.2s var(--home-ease, ease);
}

.filter-type-tab.active {
  color: var(--home-text, #f1f5f9);
  background: var(--home-surface, rgba(22, 27, 40, 0.85));
  box-shadow: inset 0 0 0 1px var(--home-border-hi, rgba(79, 209, 197, 0.28));
}

.filter-type-tab--quest.active {
  box-shadow: inset 0 0 0 1px rgba(79, 209, 197, 0.45);
  color: var(--home-teal, #4fd1c5);
}

.filter-type-tab--ritual.active {
  box-shadow: inset 0 0 0 1px rgba(112, 72, 232, 0.5);
  color: var(--home-purple, #a78bfa);
}

.filter-advanced {
  margin-top: 12px;
}

.filter-advanced-panel {
  padding: clamp(14px, 2vw, 20px);
  border-radius: var(--home-radius, 22px);
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.filter-advanced-panel--sheet {
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0;
}

.filter-advanced-header {
  display: flex;
  justify-content: flex-end;
  min-height: 28px;
  margin-bottom: 8px;
}

.filter-reset-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--home-teal, #4fd1c5);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}

.filter-reset-btn:hover {
  background: rgba(79, 209, 197, 0.08);
}

.filter-advanced-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: center;
}

.filter-select :deep(.v-field) {
  color: var(--home-text, #f1f5f9) !important;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03)) !important;
  border-radius: 12px !important;
}

.filter-select :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--home-border, rgba(255, 255, 255, 0.08)) !important;
}

.filter-select :deep(.v-label),
.filter-switches :deep(.v-label) {
  color: var(--home-text-dim, #94a3b8) !important;
  opacity: 1;
  font-size: 0.85rem;
}

.filter-switches {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-sheet {
  padding: 12px 16px 24px;
  border-radius: 20px 20px 0 0;
  background: var(--home-bg, #0d111c);
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-bottom: none;
}

.filter-sheet-handle {
  width: 40px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

@media (max-width: 959px) {
  .filter-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .filter-type-tabs {
    width: 100%;
  }

  .filter-advanced-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-switches {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 600px) {
  .filter-type-tab {
    min-height: 40px;
    font-size: 0.7rem;
    padding: 6px 8px;
  }
}
</style>

<style>
.filter-select-menu-home {
  background: var(--home-surface, #161b28) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: 12px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;
}

.filter-select-menu-home .v-list {
  background: var(--home-surface, #161b28) !important;
  color: var(--home-text, #f1f5f9) !important;
  padding: 4px 0 !important;
}

.filter-select-menu-home .v-list-item {
  color: var(--home-text, #f1f5f9) !important;
}

.filter-select-menu-home .v-list-item:hover {
  background: rgba(79, 209, 197, 0.12) !important;
}

.filter-select-menu-home .v-list-item--active {
  background: rgba(79, 209, 197, 0.2) !important;
  color: var(--home-teal, #4fd1c5) !important;
}

.filter-select-menu-home .v-list-item-title {
  color: inherit !important;
}
</style>
