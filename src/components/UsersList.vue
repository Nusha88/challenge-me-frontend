<template>
  <div class="users-container">
    <HeroesPageHeader :total-users="headerCount" />

    <v-alert
      v-if="error || squadError || friendError"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="clearVisibleError"
    >
      <div class="heroes-error-row">
        <span>{{ error || squadError || friendError }}</span>
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
      :view-mode="viewMode"
      :incoming-count="incomingCount"
      @select-sort="selectSort"
      @open-squad="openSquad"
      @search="handleSearch"
      @clear="clearSearch"
    />

    <HeroesSkeleton v-if="showSkeleton" />

    <template v-else-if="viewMode === 'squad'">
      <HeroesEmptyState
        v-if="showSquadEmpty"
        :text="squadEmptyText"
        :cta-label="t('users.squad.findHeroes')"
        @cta="selectSort(sortBy)"
      />

      <div v-else class="squad-view">
        <template v-if="visibleIncoming.length > 0">
          <MissionSectionDivider
            :label="t('users.squad.incoming')"
            icon="mdi-account-plus-outline"
            :count="visibleIncoming.length"
            flush-top
          />
          <v-row class="mb-6">
            <v-col
              v-for="(item, index) in visibleIncoming"
              :key="item.friendshipId"
              cols="12"
              sm="6"
              lg="4"
              class="reveal-animation"
              :style="{ '--i': index }"
            >
              <SquadRequestCard
                :user="item.user"
                :busy="isBusy(item.user)"
                @open="handleUserClick"
                @accept="handleFriendAccept(item.user, item.friendshipId)"
                @reject="handleFriendReject(item.user, item.friendshipId)"
              />
            </v-col>
          </v-row>
        </template>

        <template v-if="visibleFriends.length > 0">
          <MissionSectionDivider
            :label="t('users.squad.members')"
            icon="mdi-account-heart-outline"
            :count="visibleFriends.length"
            :flush-top="visibleIncoming.length === 0"
          />
          <v-row>
            <v-col
              v-for="(item, index) in visibleFriends"
              :key="item.friendshipId"
              cols="12"
              sm="6"
              lg="4"
              class="reveal-animation"
              :style="{ '--i': index + visibleIncoming.length }"
            >
              <HeroListCard
                :user="item.user"
                friendship-status="accepted"
                show-friend-action
                @click="handleUserClick"
              />
            </v-col>
          </v-row>
        </template>
      </div>
    </template>

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
                :friendship-status="friendshipStatus(user)"
                :friend-busy="isBusy(user)"
                :show-friend-action="canShowAction(user)"
                @click="handleUserClick"
                @friend-add="handleFriendAdd"
                @friend-cancel="handleFriendCancel"
                @friend-accept="handleFriendAccept"
                @friend-reject="handleFriendReject"
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
              <HeroListCard
                :user="user"
                :friendship-status="friendshipStatus(user)"
                :friend-busy="isBusy(user)"
                :show-friend-action="canShowAction(user)"
                @click="handleUserClick"
                @friend-add="handleFriendAdd"
                @friend-cancel="handleFriendCancel"
                @friend-accept="handleFriendAccept"
                @friend-reject="handleFriendReject"
              />
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MissionSectionDivider from './MissionSectionDivider.vue'
import HeroesPageHeader from './heroes/HeroesPageHeader.vue'
import HeroesSearchBar from './heroes/HeroesSearchBar.vue'
import HeroesSkeleton from './heroes/HeroesSkeleton.vue'
import HeroesEmptyState from './heroes/HeroesEmptyState.vue'
import HeroPodiumCard from './heroes/HeroPodiumCard.vue'
import HeroListCard from './heroes/HeroListCard.vue'
import SquadRequestCard from './friends/SquadRequestCard.vue'
import { useHeroesList } from '../composables/useHeroesList'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { useDemoMode } from '../composables/useDemoMode'
import { useFriendship } from '../composables/useFriendship'

const router = useRouter()
const { t } = useI18n()
const { requireAuthOrPrompt } = useDemoMode()
const viewMode = ref('hall')
const friendError = ref('')

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

const {
  incomingCount,
  incoming,
  friends,
  loadingSquad,
  squadError,
  friendshipStatus,
  isBusy,
  canShowAction,
  loadStatuses,
  loadSquad,
  filterSquad,
  sendRequest,
  acceptRequest,
  rejectRequest
} = useFriendship()

const { loadMoreTrigger } = useInfiniteScroll({
  enabled: computed(() => viewMode.value === 'hall' && hasMore.value),
  loading,
  loadingMore,
  onLoadMore: loadMoreUsers
})

const squadVisible = computed(() => filterSquad(searchQuery.value))
const visibleIncoming = computed(() => squadVisible.value.incoming)
const visibleFriends = computed(() => squadVisible.value.friends)

const showEmpty = computed(
  () => !loading.value && !error.value && users.value.length === 0
)

const emptyText = computed(() =>
  searchQuery.value.trim()
    ? t('users.noUsersFound')
    : t('users.noUsers')
)

const showSkeleton = computed(() =>
  viewMode.value === 'squad'
    ? loadingSquad.value && friends.value.length === 0 && incoming.value.length === 0
    : loading.value && !hasLoadedOnce.value
)

const showSquadEmpty = computed(() =>
  !loadingSquad.value
  && !squadError.value
  && visibleIncoming.value.length === 0
  && visibleFriends.value.length === 0
)

const squadEmptyText = computed(() =>
  searchQuery.value.trim()
    ? t('users.noUsersFound')
    : t('users.squad.empty')
)

const headerCount = computed(() =>
  viewMode.value === 'squad' ? friends.value.length : totalUsers.value
)

function handleUserClick(user) {
  if (!requireAuthOrPrompt()) return
  const userId = user._id || user.id
  if (userId) {
    router.push(`/heroes/${userId}`)
  }
}

function selectSort(value) {
  viewMode.value = 'hall'
  setSort(value)
}

function openSquad() {
  if (!requireAuthOrPrompt()) return
  viewMode.value = 'squad'
  loadSquad()
}

async function retryFetch() {
  friendError.value = ''
  if (viewMode.value === 'squad') {
    await loadSquad()
    return
  }
  await fetchUsers(1, false)
}

function clearVisibleError() {
  clearError()
  friendError.value = ''
  squadError.value = ''
}

async function runFriendAction(action) {
  friendError.value = ''
  try {
    await action()
  } catch {
    friendError.value = t('users.squad.actionError')
  }
}

function handleFriendAdd(user) {
  return runFriendAction(() => sendRequest(user))
}

function handleFriendCancel(user) {
  return runFriendAction(() => rejectRequest(user))
}

function handleFriendAccept(user, friendshipId) {
  return runFriendAction(() => acceptRequest(user, friendshipId))
}

function handleFriendReject(user, friendshipId) {
  return runFriendAction(() => rejectRequest(user, friendshipId))
}

watch(users, (list) => {
  if (viewMode.value === 'hall') loadStatuses(list)
})

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
