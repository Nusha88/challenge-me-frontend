<template>
  <div class="users-container pb-10">
    <HeroesPageHeader :total-users="totalUsers" />

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <HeroesSkeleton v-if="loading" />

    <template v-else>
      <HeroesSearchBar v-model="searchQuery" @search="handleSearch" />

      <div v-if="users.length === 0" class="text-center py-10">
        <v-icon size="84" color="grey-darken-3">mdi-account-off-outline</v-icon>
        <p class="empty-text mt-4 text-h6">
          {{ searchQuery ? t('users.noUsersFound') : t('users.noUsers') }}
        </p>
      </div>

      <div v-else class="hall-of-fame">
        <v-row v-if="topThreeUsers.length > 0" class="mb-12">
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

        <v-progress-linear
          v-if="loadingMore"
          indeterminate
          color="teal-accent-4"
          class="mt-6 rounded-pill shadow-neon"
        />

        <div
          v-if="hasMore"
          ref="loadMoreTrigger"
          class="load-more-trigger"
          aria-hidden="true"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import HeroesPageHeader from './heroes/HeroesPageHeader.vue'
import HeroesSearchBar from './heroes/HeroesSearchBar.vue'
import HeroesSkeleton from './heroes/HeroesSkeleton.vue'
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
  hasMore,
  topThreeUsers,
  remainingUsers,
  fetchUsers,
  loadMoreUsers,
  handleSearch
} = useHeroesList()

const { loadMoreTrigger } = useInfiniteScroll({
  enabled: hasMore,
  loading,
  loadingMore,
  onLoadMore: loadMoreUsers
})

function handleUserClick(user) {
  const userId = user._id || user.id
  if (userId) {
    router.push(`/heroes/${userId}`)
  }
}

onMounted(() => {
  fetchUsers(1, false)
})
</script>

<style scoped>
.users-container {
  max-width: 1300px;
  margin: 0 auto;
}

.reveal-animation {
  opacity: 0;
  transform: translateY(20px);
  animation: revealHero 0.5s ease forwards;
  animation-delay: calc(var(--i) * 0.08s);
}

@keyframes revealHero {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-text {
  color: rgba(255, 255, 255, 0.6);
}

.shadow-neon {
  box-shadow: 0 0 15px rgba(79, 209, 197, 0.2) !important;
}

.load-more-trigger {
  width: 100%;
  height: 1px;
  pointer-events: none;
  visibility: hidden;
}

@media (max-width: 480px) {
  .users-container {
    padding: 8px !important;
  }
}
</style>
