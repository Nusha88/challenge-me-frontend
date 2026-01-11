<template>
  <v-card class="mb-4 filter-panel">
    <v-card-text>
      <div class="filters-grid">
        <!-- Search by Title -->
        <div class="search-title-container">
          <v-text-field
            :model-value="modelValue.title"
            @update:model-value="updateFilter('title', $event)"
            :label="t('filters.searchTitle')"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            class="search-title-input"
            @keyup.enter="handleSearch"
            @click:clear="handleClearSearch"
          >
            <template #append-inner>
              <v-btn
                icon
                size="small"
                variant="text"
                @click="handleSearch"
                class="search-icon-btn"
              >
                <v-icon>mdi-magnify</v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </div>

        <!-- Type Filter -->
        <v-select
          :model-value="modelValue.type"
          @update:model-value="updateFilter('type', $event)"
          :items="typeOptions"
          :label="t('filters.type')"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        ></v-select>

        <!-- Owner Filter -->
        <v-select
          :model-value="modelValue.owner"
          @update:model-value="updateFilter('owner', $event)"
          :items="ownerOptions"
          :label="t('filters.owner')"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          clearable
          hide-details
          :loading="loadingUsers"
        ></v-select>

        <!-- Popularity Filter -->
        <v-select
          :model-value="modelValue.popularity"
          @update:model-value="updateFilter('popularity', $event)"
          :items="popularityOptions"
          :label="t('filters.popularity')"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        ></v-select>

        <!-- Creation Date Filter -->
        <v-select
          :model-value="modelValue.creationDate"
          @update:model-value="updateFilter('creationDate', $event)"
          :items="creationDateOptions"
          :label="t('filters.creationDate')"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          clearable
          hide-details
        ></v-select>

        <!-- Clear Filters Button -->
        <v-btn
          variant="outlined"
          @click="clearFilters"
          :disabled="!hasActiveFilters"
          class="clear-filters-btn"
        >
          {{ t('filters.clear') }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      title: null,
      type: null,
      owner: null,
      popularity: null,
      creationDate: null
    })
  }
})

const emit = defineEmits(['update:modelValue', 'search'])

const { t } = useI18n()

const loadingUsers = ref(false)
const users = ref([])

// Filter options
const typeOptions = computed(() => [
  { title: t('challenges.typeHabit'), value: 'habit' },
  { title: t('challenges.typeResult'), value: 'result' }
])

const activityOptions = computed(() => [
  { title: t('filters.activityActive'), value: 'active' },
  { title: t('filters.activityFinished'), value: 'finished' },
  { title: t('filters.activityUpcoming'), value: 'upcoming' }
])

const participantsOptions = computed(() => [
  { title: t('filters.participantsNone'), value: '0' },
  { title: t('filters.participantsFew'), value: '1-5' },
  { title: t('filters.participantsMany'), value: '6+' }
])

const creationDateOptions = computed(() => [
  { title: t('filters.creationDateToday'), value: 'today' },
  { title: t('filters.creationDateWeek'), value: 'week' },
  { title: t('filters.creationDateMonth'), value: 'month' },
  { title: t('filters.creationDateOlder'), value: 'older' }
])

const popularityOptions = computed(() => [
  { title: t('filters.popularityMost'), value: 'most' },
  { title: t('filters.popularityLeast'), value: 'least' }
])

const ownerOptions = computed(() => {
  return users.value.map(user => ({
    title: user.name,
    value: user._id || user.id
  }))
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return props.modelValue.title !== null ||
         props.modelValue.type !== null ||
         props.modelValue.owner !== null ||
         props.modelValue.popularity !== null ||
         props.modelValue.creationDate !== null
})

function updateFilter(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

function clearFilters() {
  emit('update:modelValue', {
    title: null,
    type: null,
    owner: null,
    popularity: null,
    creationDate: null
  })
}

function handleSearch() {
  emit('search')
}

function handleClearSearch() {
  updateFilter('title', null)
  emit('search')
}

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await userService.getAllUsers({ page: 1, limit: 100 })
    users.value = response.data.users || []
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loadingUsers.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
/* Filter Panel Styles */
.filter-panel {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
}

.search-title-container {
  grid-column: 1 / -1;
}

.search-title-input {
  width: 100%;
}

.search-icon-btn {
  margin-right: -8px;
}

/* Style filter selects */
.filters-grid :deep(.v-field),
.filters-grid :deep(.v-field__outline),
.filters-grid :deep(.v-field__input) {
  border-radius: 12px !important;
}

.filters-grid :deep(.v-field--focused .v-field__outline) {
  border-color: #1FA0F6 !important;
}

.clear-filters-btn {
  height: 40px;
  border-radius: 12px !important;
  border-color: rgba(31, 160, 246, 0.5) !important;
  color: #1FA0F6 !important;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.clear-filters-btn:hover:not(:disabled) {
  background-color: rgba(31, 160, 246, 0.08) !important;
  border-color: #1FA0F6 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(31, 160, 246, 0.2);
}

.clear-filters-btn:disabled {
  opacity: 0.4;
}

@media (max-width: 960px) {
  .filters-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>







