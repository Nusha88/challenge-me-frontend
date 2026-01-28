<template>
  <v-card variant="flat" class="filter-wrapper pa-0 mb-8 bg-transparent">
    
    <div class="toolbar-main d-flex align-center gap-3">
      
      <v-text-field
        :model-value="modelValue.title"
        @update:model-value="updateFilter('title', $event)"
        :placeholder="t('filters.searchPlaceholder', 'Find your next adventure...')"
        variant="solo"
        flat
        density="comfortable"
        hide-details
        rounded="xl"
        class="search-bar elevation-1"
        bg-color="white"
        @keyup.enter="handleSearch"
      >
        <template #prepend-inner>
          <v-icon color="grey-lighten-1">mdi-magnify</v-icon>
        </template>
        
        <template #append-inner>
          <v-btn
            icon
            variant="text"
            size="small"
            :color="showAdvanced ? 'teal-accent-4' : 'grey-lighten-1'"
            :class="{ 'rotate-180': showAdvanced }"
            @mousedown.stop 
    @click.stop="showAdvanced = !showAdvanced"
          >
            <v-icon>mdi-tune-variant</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <v-btn-toggle
        :model-value="modelValue.type || 'all'"
        @update:model-value="updateFilter('type', $event)"
        mandatory
        variant="flat"
        class="type-toggle-group elevation-1 d-none d-md-flex"
      >
        <v-btn value="all" class="type-btn all-active">All</v-btn>
        
        <v-btn value="result" class="type-btn quest-active">
          <v-icon start size="18">mdi-sword</v-icon>
          {{ t('challenges.typeResult') }}
        </v-btn>

        <v-btn value="habit" class="type-btn ritual-active">
          <v-icon start size="18">mdi-cached</v-icon>
          {{ t('challenges.typeHabit') }}
        </v-btn>

        <v-btn value="party" class="type-btn party-active">
          <v-icon start size="18">mdi-account-group</v-icon>
          {{ t('filters.inParty') }}
        </v-btn>
      </v-btn-toggle>

      <v-fade-transition>
        <v-btn
          v-if="hasActiveFilters"
          icon="mdi-filter-off-outline"
          variant="tonal"
          color="error"
          size="small"
          @click="clearFilters"
          class="ml-2"
        ></v-btn>
      </v-fade-transition>
    </div>

    <div class="d-flex d-md-none mt-4 overflow-x-auto pb-2">
       <v-btn-toggle
        :model-value="modelValue.type || 'all'"
        @update:model-value="updateFilter('type', $event)"
        mandatory
        variant="flat"
        class="type-toggle-group elevation-1"
      >
        <v-btn value="all" size="small">All</v-btn>
        <v-btn value="result" size="small">Quest</v-btn>
        <v-btn value="habit" size="small">Ritual</v-btn>
        <v-btn value="party" size="small">Party</v-btn>
      </v-btn-toggle>
    </div>

    <v-expand-transition>
      <div v-show="showAdvanced" class="mt-3">
        <v-card variant="flat" class="advanced-panel pa-6 border">
          <div class="advanced-grid">
            <v-select
              :model-value="modelValue.owner"
              :items="ownerOptions"
              label="Created by"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              @update:model-value="updateFilter('owner', $event)"
            ></v-select>

            <v-select
              :model-value="modelValue.popularity"
              :items="popularityOptions"
              label="Sort by"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              @update:model-value="updateFilter('popularity', $event)"
            ></v-select>

            <v-select
              :model-value="modelValue.creationDate"
              :items="creationDateOptions"
              label="Timeframe"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              @update:model-value="updateFilter('creationDate', $event)"
            ></v-select>
          </div>
        </v-card>
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
/* Общая обертка */
.toolbar-main {
  height: 56px;
}

/* Улучшаем стабильность поиска */
.search-bar {
  /* Увеличим базовую ширину, чтобы расширение было не таким резким */
  max-width: 500px; 
  width: 100%;
  border: none;
  transition: none !important; /* Убираем transition, если кнопка продолжает "убегать" */
}

/* Если очень хочется оставить анимацию, используй это: */
.search-bar:focus-within {
  max-width: 500px;
  /* Анимация должна быть мгновенной для mousedown событий */
  transition: max-width 0.1s ease-out; 
}

/* Фиксируем позицию иконки, чтобы она не дрожала */
.search-bar :deep(.v-field__append-inner) {
  align-items: center;
  padding-top: 0;
  margin-top: 0;
  height: 100%;
}
/* Активный стиль для кнопки "All" */
.all-active.v-btn--active {
  background: #2D3748 !important; /* Глубокий темный цвет */
  box-shadow: 0 4px 12px rgba(45, 55, 72, 0.2) !important;
}

/* Общее правило для текста активных кнопок (уже есть, просто убедись) */
.type-btn.v-btn--active {
  color: white !important;
}

/* Стили переключателя типов */
.type-toggle-group {
  background: white !important;
  border-radius: 28px !important;
  height: 48px !important;
  padding: 4px;
  border: 1px solid rgba(0,0,0,0.05) !important;
}

.type-btn {
  border: none !important;
  border-radius: 24px !important;
  text-transform: none !important;
  font-weight: 700 !important;
  letter-spacing: 0.3px;
  color: #718096 !important;
  transition: all 0.2s ease !important;
  min-width: 100px !important;
}

/* Активные состояния для разных типов */
.type-btn.v-btn--active {
  color: white !important;
}

.quest-active.v-btn--active {
  background: #A855F7 !important; /* Фиолетовый */
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3) !important;
}

.ritual-active.v-btn--active {
  background: #4FD1C5 !important; /* Бирюзовый */
  box-shadow: 0 4px 12px rgba(79, 209, 197, 0.3) !important;
}

.party-active.v-btn--active {
  background: #3B82F6 !important; /* Синий */
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
}

/* Продвинутая панель */
.advanced-panel {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px);
  border-radius: 20px !important;
  border-color: rgba(0,0,0,0.05) !important;
}

.advanced-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

/* Анимации */
.rotate-180 {
  transform: rotate(180deg);
}

.gap-3 { gap: 12px; }

@media (max-width: 960px) {
  .advanced-grid { grid-template-columns: 1fr; }
  .search-bar { max-width: 100%; }
}
@media (max-width: 600px) {
  .search-bar {
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>