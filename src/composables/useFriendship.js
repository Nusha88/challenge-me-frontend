import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { friendService } from '../services/api'
import { useUserStore } from '../stores/user'
import { useDemoMode } from './useDemoMode'
import { enrichUserForDisplay } from '../utils/userLevelDisplay'
import { APP_EVENTS, addAppEventListener, removeAppEventListener, dispatchAppEvent } from '../utils/appEvents'

function userKey(user) {
  if (!user) return null
  const id = user._id || user.id || user
  return id != null && id !== '' ? String(id) : null
}

function matchesQuery(user, query) {
  if (!query) return true
  return String(user?.name || '').toLowerCase().includes(query)
}

export function useFriendship() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const { requireAuthOrPrompt } = useDemoMode()

  const statusByUserId = ref({})
  const incomingCount = ref(0)
  const incoming = ref([])
  const friends = ref([])
  const loadingSquad = ref(false)
  const squadLoaded = ref(false)
  const squadError = ref('')
  const busyById = ref({})
  const currentUserId = computed(() => userStore.userId ? String(userStore.userId) : null)

  function setBusy(id, value) {
    if (!id) return
    busyById.value = { ...busyById.value, [id]: value }
  }

  function applyRelation(userId, relation) {
    if (!userId || !relation) return
    statusByUserId.value = {
      ...statusByUserId.value,
      [String(userId)]: {
        status: relation.status || 'none',
        friendshipId: relation.friendshipId || null
      }
    }
  }

  function friendshipStatus(user) {
    const id = userKey(user)
    if (!id) return 'none'
    if (currentUserId.value && id === currentUserId.value) return 'self'
    return statusByUserId.value[id]?.status || 'none'
  }

  function friendshipIdFor(user) {
    const id = userKey(user)
    if (!id) return null
    return user?.friendshipId || statusByUserId.value[id]?.friendshipId || null
  }

  function isBusy(user) {
    const id = userKey(user)
    return Boolean(id && busyById.value[id])
  }

  function canShowAction(user) {
    const id = userKey(user)
    if (!id) return false
    if (currentUserId.value && id === currentUserId.value) return false
    return true
  }

  async function loadStatuses(users) {
    if (!userStore.isLoggedIn) return
    const known = statusByUserId.value
    const ids = (users || [])
      .map(userKey)
      .filter((id) => id && id !== currentUserId.value && !known[id])
    if (!ids.length) return

    try {
      const next = { ...statusByUserId.value }
      const chunkSize = 50
      for (let index = 0; index < ids.length; index += chunkSize) {
        const chunk = ids.slice(index, index + chunkSize)
        const { data } = await friendService.getStatuses(chunk)
        Object.assign(next, data.statuses || {})
        for (const id of chunk) {
          if (!next[id]) next[id] = { status: 'none', friendshipId: null }
        }
      }
      statusByUserId.value = next
    } catch (error) {
      console.error('Error loading friendship statuses:', error)
    }
  }

  async function loadIncomingCount() {
    if (!userStore.isLoggedIn) {
      incomingCount.value = 0
      return
    }
    try {
      const { data } = await friendService.getIncomingCount()
      incomingCount.value = Number(data?.count) || 0
    } catch (error) {
      console.error('Error loading incoming friend count:', error)
    }
  }

  async function loadSquad() {
    if (!userStore.isLoggedIn) return
    loadingSquad.value = true
    squadError.value = ''
    try {
      const [friendsRes, incomingRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getIncoming()
      ])
      friends.value = (friendsRes.data.friends || [])
        .filter((item) => item.user)
        .map((item) => ({
          ...item,
          user: enrichUserForDisplay(item.user, t)
        }))
      incoming.value = (incomingRes.data.requests || [])
        .filter((item) => item.user)
        .map((item) => ({
          ...item,
          user: enrichUserForDisplay(item.user, t)
        }))
      incomingCount.value = incoming.value.length
      const next = { ...statusByUserId.value }
      for (const item of friends.value) {
        const id = userKey(item.user)
        if (id) next[id] = { status: 'accepted', friendshipId: item.friendshipId }
      }
      for (const item of incoming.value) {
        const id = userKey(item.user)
        if (id) next[id] = { status: 'pending_incoming', friendshipId: item.friendshipId }
      }
      statusByUserId.value = next
      squadLoaded.value = true
    } catch (error) {
      console.error('Error loading squad:', error)
      squadError.value = t('users.squad.loadError')
    } finally {
      loadingSquad.value = false
    }
  }

  function filterSquad(query) {
    const needle = String(query || '').trim().toLowerCase()
    return {
      incoming: incoming.value.filter((item) => matchesQuery(item.user, needle)),
      friends: friends.value.filter((item) => matchesQuery(item.user, needle))
    }
  }

  async function sendRequest(user) {
    if (!requireAuthOrPrompt()) return
    const userId = userKey(user)
    if (!userId || userId === currentUserId.value || busyById.value[userId]) return

    setBusy(userId, true)
    try {
      const { data } = await friendService.sendRequest(userId)
      applyRelation(userId, data)
      dispatchAppEvent(APP_EVENTS.FRIENDSHIP_CHANGED, { userId, ...data })
    } catch (error) {
      console.error('Error sending friend request:', error)
      throw error
    } finally {
      setBusy(userId, false)
    }
  }

  async function resolveFriendshipId(user, friendshipId) {
    if (friendshipId) return friendshipId
    const known = friendshipIdFor(user)
    if (known) return known
    const userId = userKey(user)
    if (!userId) return null
    const { data } = await friendService.getStatus(userId)
    applyRelation(userId, data)
    return data?.friendshipId || null
  }

  async function acceptRequest(user, friendshipId) {
    if (!requireAuthOrPrompt()) return
    const userId = userKey(user)
    if (!userId || busyById.value[userId]) return

    setBusy(userId, true)
    try {
      const id = await resolveFriendshipId(user, friendshipId)
      if (!id) return
      const { data } = await friendService.accept(id)
      applyRelation(userId, data)
      incoming.value = incoming.value.filter((item) => item.friendshipId !== id)
      incomingCount.value = incoming.value.length
      dispatchAppEvent(APP_EVENTS.FRIENDSHIP_CHANGED, { userId, ...data })
    } catch (error) {
      console.error('Error accepting friend request:', error)
      throw error
    } finally {
      setBusy(userId, false)
    }
  }

  async function rejectRequest(user, friendshipId) {
    if (!requireAuthOrPrompt()) return
    const userId = userKey(user)
    if (!userId || busyById.value[userId]) return

    setBusy(userId, true)
    try {
      const id = await resolveFriendshipId(user, friendshipId)
      if (!id) return
      const { data } = await friendService.reject(id)
      applyRelation(userId, data)
      incoming.value = incoming.value.filter((item) => item.friendshipId !== id)
      incomingCount.value = incoming.value.length
      dispatchAppEvent(APP_EVENTS.FRIENDSHIP_CHANGED, { userId, ...data })
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      throw error
    } finally {
      setBusy(userId, false)
    }
  }

  async function onExternalFriendshipChange(event) {
    const detail = event?.detail
    if (detail?.userId && detail?.status) {
      applyRelation(detail.userId, detail)
    }
    await loadIncomingCount()
    if (squadLoaded.value) await loadSquad()
  }

  onMounted(() => {
    if (userStore.isLoggedIn) loadIncomingCount()
    addAppEventListener(APP_EVENTS.FRIENDSHIP_CHANGED, onExternalFriendshipChange)
    addAppEventListener(APP_EVENTS.AUTH_CHANGED, loadIncomingCount)
  })

  onBeforeUnmount(() => {
    removeAppEventListener(APP_EVENTS.FRIENDSHIP_CHANGED, onExternalFriendshipChange)
    removeAppEventListener(APP_EVENTS.AUTH_CHANGED, loadIncomingCount)
  })

  return {
    statusByUserId,
    incomingCount,
    incoming,
    friends,
    loadingSquad,
    squadError,
    currentUserId,
    friendshipStatus,
    friendshipIdFor,
    isBusy,
    canShowAction,
    loadStatuses,
    loadIncomingCount,
    loadSquad,
    filterSquad,
    sendRequest,
    acceptRequest,
    rejectRequest
  }
}
