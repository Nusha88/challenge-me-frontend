<template>
  <div class="users-container">
    <HeroesPageHeader :total-users="totalUsers" />

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="clearError"
    >
      <div class="heroes-error-row">
        <span>{{ error }}</span>
        <v-btn
          size="small"
          variant="text"
          color="error"
          class="text-none"
          @click="retryFetch"
        >
          {{ t('users.retry') }}
        </v-btn>
      </div>
    </v-alert>

    <HeroesSearchBar
      v-model="searchQuery"
      :sort-by="sortBy"
      @update:sort-by="setSort"
      @search="handleSearch"
      @clear="clearSearch"
    />

    <HeroesSkeleton v-if="loading && !hasLoadedOnce" />

    <template v-else-if="!loading || users.length > 0">
      <HeroesEmptyState
        v-if="showEmpty"
        :text="emptyText"
        :has-search="Boolean(searchQuery.trim())"
        @clear-search="clearSearch"
      />

      <div v-else-if="users.length > 0" class="hall-of-fame">
        <template v-if="topThreeUsers.length > 0">
          <MissionSectionDivider
            :label="t('users.sections.leaders')"
            icon="mdi-crown-outline"
            :count="topThreeUsers.length"
            flush-top
          />
          <v-row class="mb-6">
            <v-col
              v-for="(user, index) in topThreeUsers"
              :key="user._id || user.id"
              cols="12"
              md="4"
              class="reveal-animation"
              :style="{ '--i': index }"
            >
              <HeroPodiumCard
                :user="user"
                :rank="index + 1"
                @click="handleUserClick"
              />
            </v-col>
          </v-row>
        </template>

        <template v-if="remainingUsers.length > 0">
          <MissionSectionDivider
            :label="t('users.sections.all')"
            icon="mdi-account-group-outline"
            :count="Math.max(0, totalUsers - topThreeUsers.length)"
            :flush-top="topThreeUsers.length === 0"
          />
          <v-row class="remaining-heroes-grid">
            <v-col
              v-for="(user, index) in remainingUsers"
              :key="user._id || user.id"
              cols="12"
              sm="6"
              lg="4"
              class="reveal-animation"
              :style="{ '--i': index + 3 }"
            >
              <HeroListCard :user="user" @click="handleUserClick" />
            </v-col>
          </v-row>
        </template>

        <v-progress-linear
          v-if="loadingMore || (loading && hasLoadedOnce)"
          indeterminate
          color="#4FD1C5"
          height="4"
          class="mt-6"
        />

        <div
          v-if="hasMore"
          ref="loadMoreTrigger"
          class="load-more-trigger"
          aria-hidden="true"
        />
      </div>
    </template>

    <v-progress-linear
      v-else-if="loading"
      indeterminate
      color="#4FD1C5"
      height="4"
      class="mt-2"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MissionSectionDivider from './MissionSectionDivider.vue'
import HeroesPageHeader from './heroes/HeroesPageHeader.vue'
import HeroesSearchBar from './heroes/HeroesSearchBar.vue'
import HeroesSkeleton from './heroes/HeroesSkeleton.vue'
import HeroesEmptyState from './heroes/HeroesEmptyState.vue'
import HeroPodiumCard from './heroes/HeroPodiumCard.vue'
import HeroListCard from './heroes/HeroListCard.vue'
import { useHeroesList } from '../composables/useHeroesList'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'

const router = useRouter()
const { t } = useI18n()

const {
  users,
  totalUsers,
  loading,
  loadingMore,
  error,
  searchQuery,
  sortBy,
  hasMore,
  hasLoadedOnce,
  topThreeUsers,
  remainingUsers,
  fetchUsers,
  loadMoreUsers,
  handleSearch,
  setSort,
  clearSearch,
  clearError
} = useHeroesList()

const { loadMoreTrigger } = useInfiniteScroll({
  enabled: hasMore,
  loading,
  loadingMore,
  onLoadMore: loadMoreUsers
})

const showEmpty = computed(
  () => !loading.value && !error.value && users.value.length === 0
)

const emptyText = computed(() =>
  searchQuery.value.trim()
    ? t('users.noUsersFound')
    : t('users.noUsers')
)

function handleUserClick(user) {
  const userId = user._id || user.id
  if (userId) {
    router.push(`/heroes/${userId}`)
  }
}

async function retryFetch() {
  await fetchUsers(1, false)
}

onMounted(() => {
  fetchUsers(1, false)
})
</script>

<style scoped>
.users-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  color: var(--home-text, #f1f5f9);
}

.heroes-error-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.reveal-animation {
  opacity: 0;
  transform: translateY(16px);
  animation: revealHero 0.45s var(--home-ease, ease) forwards;
  animation-delay: calc(var(--i) * 0.06s);
}

@keyframes revealHero {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.load-more-trigger {
  width: 100%;
  height: 1px;
  pointer-events: none;
  visibility: hidden;
}
</style>
