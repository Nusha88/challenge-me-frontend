<template>
  <v-card variant="flat" class="filter-card pa-4 mb-6">
    
    <div class="search-row d-flex align-center gap-4">
      <v-text-field
        :model-value="modelValue.title"
        @update:model-value="updateFilter('title', $event)"
        :placeholder="t('filters.searchPlaceholder', 'Find your next adventure...')"
        variant="outlined"
        density="compact"
        hide-details
        rounded="lg"
        class="search-bar"
        bg-color="white"
        @keyup.enter="handleSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey-lighten-1">mdi-magnify</v-icon>
        </template>
      </v-text-field>

      <v-btn
        variant="text"
        :color="showAdvanced ? 'primary' : 'grey-darken-1'"
        prepend-icon="mdi-tune-variant"
        class="text-none advanced-btn"
        @click="showAdvanced = !showAdvanced"
        rounded="lg"
      >
        {{ t('filters.advanced') }}
      </v-btn>
    </div>

    <div class="chips-container d-flex align-center mt-4">
      <v-btn-toggle
        :model-value="modelValue.type || 'all'"
        @update:model-value="updateFilter('type', $event)"
        mandatory
        variant="outlined"
        divided
        class="type-toggle"
      >
        <v-btn value="all" size="small" class="px-4">{{ t('filters.all') }}</v-btn>
        <v-btn value="result" size="small" class="px-4">
          <v-icon start size="16" color="deep-purple-accent-2">mdi-sword</v-icon>
          {{ t('challenges.typeResult') }}
        </v-btn>
        <v-btn value="habit" size="small" class="px-4">
          <v-icon start size="16" color="teal-accent-4">mdi-cached</v-icon>
          {{ t('challenges.typeHabit') }}
        </v-btn>
        <v-btn value="party" size="small" class="px-4">
          <v-icon start size="16" color="blue">mdi-account-group</v-icon>
          {{ t('filters.inParty') }}
        </v-btn>
      </v-btn-toggle>

      <v-spacer></v-spacer>

      <v-btn
        v-if="hasActiveFilters"
        variant="text"
        color="grey"
        size="small"
        class="text-none"
        @click="clearFilters"
      >
        {{ t('filters.clear') }}
      </v-btn>
    </div>

    <v-expand-transition>
      <div v-show="showAdvanced" class="pt-4">
        <v-divider class="mb-4"></v-divider>
        <div class="advanced-grid">
          <v-select
            :model-value="modelValue.owner"
            @update:model-value="updateFilter('owner', $event)"
            :items="ownerOptions"
            :label="t('filters.owner')"
            variant="filled"
            density="compact"
            hide-details
            flat
          ></v-select>

          <v-select
            :model-value="modelValue.popularity"
            @update:model-value="updateFilter('popularity', $event)"
            :items="popularityOptions"
            :label="t('filters.popularity')"
            variant="filled"
            density="compact"
            hide-details
            flat
          ></v-select>

          <v-select
            :model-value="modelValue.creationDate"
            @update:model-value="updateFilter('creationDate', $event)"
            :items="creationDateOptions"
            :label="t('filters.creationDate')"
            variant="filled"
            density="compact"
            hide-details
            flat
          ></v-select>
        </div>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'search'])
const { t } = useI18n()

const showAdvanced = ref(false)
const users = ref([])

// Опции (аналогично вашему коду, укорочено для примера)
const ownerOptions = computed(() => users.value.map(u => ({ title: u.name, value: u.id })))
const popularityOptions = computed(() => [
  { title: t('filters.popularityMost'), value: 'most' },
  { title: t('filters.popularityLeast'), value: 'least' }
])
const creationDateOptions = computed(() => [
  { title: t('filters.creationDateToday'), value: 'today' },
  { title: t('filters.creationDateWeek'), value: 'week' }
])

const hasActiveFilters = computed(() => {
  return props.modelValue.title || props.modelValue.owner || (props.modelValue.type && props.modelValue.type !== 'all')
})

function updateFilter(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function clearFilters() {
  emit('update:modelValue', { title: null, type: 'all', owner: null, popularity: null, creationDate: null })
}

function handleSearch() { emit('search') }

onMounted(async () => {
  const resp = await userService.getAllUsers({ limit: 100 })
  users.value = resp.data.users || []
})
</script>

<style scoped>
.filter-card {
  background: #fdfdff !important; /* Очень легкий оттенок, чтобы отделить от фона страницы */
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  border-radius: 16px !important;
}

/* Главная строка поиска */
.main-filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-input {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05) !important;
}

/* Фикс высоты поиска */
.search-input :deep(.v-field__input) {
  min-height: 40px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  font-size: 0.9rem;
}

.search-input :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.advanced-btn {
  height: 40px !important;
  font-weight: 600;
}

/* Стили чипсов (кнопок типов) */
.type-toggle {
  height: 36px !important;
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  background: white;
}

.type-toggle :deep(.v-btn) {
  border: none !important;
  text-transform: none !important;
  font-weight: 500;
  letter-spacing: 0;
  color: #666;
}

/* Цвет активной кнопки в табах */
.type-toggle :deep(.v-btn--active) {
  background-color: rgba(0, 0, 0, 0.03) !important;
  color: var(--v-primary-base) !important;
}

.filter-chip {
  border-radius: 20px !important;
  margin-right: 8px;
  border: 1px solid rgba(0,0,0,0.1) !important;
  text-transform: none !important;
  letter-spacing: normal;
  font-weight: 600;
}

/* Цвета из твоего логотипа и концепта */
.active-type.quest-btn {
  background-color: #A855F7 !important; /* Квестовый фиолетовый */
  color: white !important;
}

.active-type.ritual-btn {
  background-color: #4FD1C5 !important; /* Бирюзовый кристалл */
  color: white !important;
}

.active-type.party-btn {
  background-color: #3B82F6 !important; /* Синий для пати */
  color: white !important;
}

/* Стили продвинутой панели */
.advanced-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed rgba(0,0,0,0.1);
}

.advanced-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.gap-4 {
  gap: 16px;
}

@media (max-width: 900px) {
  .advanced-grid { grid-template-columns: 1fr; }
  .main-filter-row { flex-direction: column; align-items: stretch; }
}
</style>