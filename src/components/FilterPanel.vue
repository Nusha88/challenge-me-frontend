<template>
  <v-card variant="flat" class="filter-wrapper pa-0 mb-10 bg-transparent">
    
    <div class="toolbar-main d-flex align-center gap-4">
      
      <v-text-field
        :model-value="modelValue.title"
        @update:model-value="updateFilter('title', $event)"
        placeholder="Search missions..."
        variant="outlined"
        density="comfortable"
        hide-details
        rounded="xl"
        class="search-bar-custom"
        @keyup.enter="handleSearch"
      >
        <template #prepend-inner>
          <v-icon color="teal-accent-4">mdi-magnify</v-icon>
        </template>
        <template #append-inner>
          <v-btn
            icon="mdi-tune-variant"
            variant="text"
            size="small"
            :color="showAdvanced ? 'teal-accent-4' : 'grey-lighten-1'"
            @click.stop="showAdvanced = !showAdvanced"
          ></v-btn>
        </template>
      </v-text-field>

      <v-btn-toggle
        :model-value="modelValue.type || 'all'"
        @update:model-value="updateFilter('type', $event)"
        mandatory
        class="type-toggle-group-custom d-none d-md-flex"
      >
        <v-btn value="all" class="filter-nav-btn">
          <span class="btn-text">All</span>
        </v-btn>
        
        <v-btn value="result" class="filter-nav-btn quest-tab">
          <v-icon start size="18">mdi-sword</v-icon>
          <span class="btn-text">Quest</span>
        </v-btn>

        <v-btn value="habit" class="filter-nav-btn ritual-tab">
          <v-icon start size="18">mdi-fire</v-icon>
          <span class="btn-text">Ritual</span>
        </v-btn>

        <v-btn value="party" class="filter-nav-btn party-tab">
          <v-icon start size="18">mdi-account-group</v-icon>
          <span class="btn-text">Party</span>
        </v-btn>
      </v-btn-toggle>

    </div>

    <v-expand-transition>
      <div v-show="showAdvanced" class="mt-4">
        <v-card variant="flat" class="advanced-panel-dark pa-6">
          <div class="advanced-grid">
            <v-select
              :model-value="modelValue.owner"
              :items="ownerOptions"
              label="Created by"
              variant="outlined"
              density="comfortable"
              class="custom-select-dark"
              @update:model-value="updateFilter('owner', $event)"
            ></v-select>

            <v-select
              :model-value="modelValue.popularity"
              :items="popularityOptions"
              label="Sort by"
              variant="outlined"
              density="comfortable"
              class="custom-select-dark"
              @update:model-value="updateFilter('popularity', $event)"
            ></v-select>

            <div class="d-flex align-center gap-4">
              <v-switch
              class="mr-2"
                :model-value="modelValue.showUpcoming !== false"
                @update:model-value="updateFilter('showUpcoming', $event)"
                label="Upcoming"
                color="teal-accent-4"
                hide-details
              ></v-switch>
              <v-switch
                :model-value="modelValue.isCompleted === true"
                @update:model-value="updateFilter('isCompleted', $event)"
                label="Completed"
                color="teal-accent-4"
                hide-details
              ></v-switch>
            </div>
          </div>
        </v-card>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
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
const ownerOptions = computed(() => {
  return users.value.map(u => ({ 
    title: u.name, 
    value: String(u.id || u._id) 
  }))
})
const popularityOptions = computed(() => [
  { title: t('filters.popularityMost'), value: 'most' },
  { title: t('filters.popularityLeast'), value: 'least' }
])

const hasActiveFilters = computed(() => {
  return props.modelValue.title || props.modelValue.owner || (props.modelValue.type && props.modelValue.type !== 'all') || props.modelValue.popularity || props.modelValue.isCompleted
})

function updateFilter(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function clearFilters() {
  emit('update:modelValue', { title: null, type: 'all', owner: null, popularity: null, showUpcoming: true, isCompleted: false })
}

function handleSearch() { emit('search') }

const fetchUserIfNeeded = async (ownerId) => {
  if (!ownerId) return
  const ownerIdStr = String(ownerId)
  const exists = users.value.some(u => String(u.id || u._id) === ownerIdStr)
  if (!exists) {
    try {
      const userResp = await userService.getUserById(ownerIdStr)
      if (userResp.data?.user) {
        users.value.push(userResp.data.user)
      }
    } catch (error) {
      // User not found or error fetching - ignore
    }
  }
}

onMounted(async () => {
  try {
    const resp = await userService.getAllUsers({ limit: 100 })
    users.value = resp.data.users || []
    
    // If there's a selected owner that's not in the list, fetch it
    if (props.modelValue.owner) {
      await fetchUserIfNeeded(props.modelValue.owner)
    }
  } catch (error) {
    // Error loading users - ignore
  }
})

// Watch for owner changes and fetch user if needed
watch(() => props.modelValue.owner, async (newOwner) => {
  if (newOwner) {
    await fetchUserIfNeeded(newOwner)
  }
})
</script>

<style scoped>
/* Поиск */
.search-bar-custom :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 50px !important;
  color: white !important;
}

.search-bar-custom :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
  color: #4FD1C5 !important;
}

/* Группа переключателей */
.type-toggle-group-custom {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 50px !important;
  height: 48px !important;
  padding: 4px;
}

.filter-nav-btn {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.6) !important;
  border: none !important;
  border-radius: 40px !important;
  text-transform: none !important;
  font-weight: 700 !important;
  min-width: 90px !important;
}

.filter-nav-btn .btn-text {
  color: inherit;
}

/* Активные состояния */
.v-btn--active.filter-nav-btn {
  color: white !important;
}

.v-btn--active.quest-tab { background: #A855F7 !important; box-shadow: 0 0 15px rgba(168, 85, 247, 0.4); }
.v-btn--active.ritual-tab { background: #00CED1 !important; box-shadow: 0 0 15px rgba(0, 206, 209, 0.4); }
.v-btn--active.party-tab { background: #3B82F6 !important; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }

/* Advanced Panel */
.advanced-panel-dark {
  background: rgba(30, 30, 45, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 20px !important;
}

.custom-select-dark :deep(.v-field) {
  color: white !important;
  background: rgba(0, 0, 0, 0.2) !important;
}

.advanced-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 20px;
  align-items: center;
}

/* Фикс для COMMON.ALL */
.btn-text {
  font-size: 14px;
}
.advanced-grid :deep(.v-label) {
  color: rgba(255, 255, 255, 0.8) !important; /* Делаем текст белым */
  font-size: 14px;
  opacity: 1;
}
.type-toggle-group-custom {
  background: rgba(255, 255, 255, 0.05) !important; /* Прозрачный фон группы */
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 50px !important;
  height: 48px !important;
}
</style>