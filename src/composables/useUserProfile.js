import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { userService, challengeService, uploadService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { enrichUserForDisplay } from '../utils/userLevelDisplay'
import { getXpForNextLevel } from '../utils/levelSystem'
import { filterHabitChallengesForUser } from '../utils/activityHeatmap'
import { isChallengeFinished, isChallengeUpcoming } from '../utils/challengeStatus'

/**
 * Load profile / hero data: user, challenges (one fetch), checklist history.
 */
export function useUserProfile(props = {}) {
  const route = useRoute()
  const userStore = useUserStore()
  const { t } = useI18n()

  const user = ref(null)
  const challenges = ref([])
  const checklistHistory = ref([])
  const loading = ref(false)
  const error = ref('')
  const uploading = ref(false)
  const uploadError = ref('')
  const fileInputRef = ref(null)

  const currentUserId = computed(() => userStore.userId)

  const isOwnProfile = computed(() => {
    if (!currentUserId.value) return false
    if (route.path === '/profile') return true
    const userId = props.userId || route.params.id
    return userId && userId.toString() === currentUserId.value.toString()
  })

  const targetUserId = computed(() => {
    if (route.path === '/profile') return currentUserId.value
    return props.userId || route.params.id
  })

  const displayUser = computed(() => {
    if (!user.value) return null
    const enriched = enrichUserForDisplay(user.value, t)
    return {
      ...enriched,
      xpForNextLevel: getXpForNextLevel(enriched.displayLevel)
    }
  })

  const habitChallenges = computed(() =>
    filterHabitChallengesForUser(challenges.value, targetUserId.value)
  )

  const userMissions = computed(() => {
    if (isOwnProfile.value) return []
    return challenges.value
  })

  const activeUserMissions = computed(() =>
    userMissions.value.filter((challenge) => !isChallengeFinished(challenge))
  )

  const finishedUserMissions = computed(() =>
    userMissions.value.filter((challenge) => isChallengeFinished(challenge))
  )

  function getMissionSortRank(challenge) {
    if (isChallengeFinished(challenge)) return 2
    if (isChallengeUpcoming(challenge)) return 1
    return 0
  }

  const liveUserMissions = computed(() =>
    [...activeUserMissions.value].sort(
      (a, b) => getMissionSortRank(a) - getMissionSortRank(b)
    )
  )

  async function fetchUser() {
    checklistHistory.value = []

    if (route.path === '/profile') {
      loading.value = true
      error.value = ''
      try {
        const response = await userService.getProfile()
        if (response.data?.user) {
          user.value = response.data.user
          userStore.setUser(response.data.user)
        } else {
          error.value = t('profile.noData')
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          error.value = t('profile.invalidToken')
          userStore.clearUser()
          window.dispatchEvent(new Event('auth-changed'))
        } else {
          error.value = err.response?.data?.message || t('notifications.profileError')
        }
      } finally {
        loading.value = false
      }
      return
    }

    if (!targetUserId.value) {
      error.value = t('users.userNotFound')
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await userService.getUserById(targetUserId.value)
      if (response.data?.user) {
        user.value = response.data.user
        checklistHistory.value = response.data.user.checklistHistory || []
      } else {
        error.value = t('users.userNotFound')
      }
    } catch (err) {
      if (err.response?.status === 404) {
        error.value = t('users.userNotFound')
      } else {
        error.value = err.response?.data?.message || t('notifications.usersError')
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchChallenges() {
    const userId = targetUserId.value
    if (!userId) {
      challenges.value = []
      return
    }

    try {
      const excludePrivate = !isOwnProfile.value
      const { data } = await challengeService.getChallengesByUser(userId, { excludePrivate })
      challenges.value = data?.challenges || []
    } catch {
      challenges.value = []
    }
  }

  async function fetchChecklistHistory() {
    if (!isOwnProfile.value) return
    try {
      const checklistResponse = await userService.getChecklistHistory()
      checklistHistory.value = checklistResponse.data?.checklists || []
    } catch {
      checklistHistory.value = []
    }
  }

  async function reloadProfileData() {
    await fetchUser()
    await Promise.all([fetchChallenges(), fetchChecklistHistory()])
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') {
          const base64 = result.includes(',') ? result.split(',')[1] : result
          resolve(base64)
        } else {
          reject(new Error('Unable to read file'))
        }
      }
      reader.onerror = () => reject(reader.error || new Error('Unable to read file'))
      reader.readAsDataURL(file)
    })
  }

  async function handleAvatarSelection(files) {
    if (!files || (Array.isArray(files) && files.length === 0)) return

    const file = Array.isArray(files) ? files[0] : files
    if (!file) return

    uploadError.value = ''

    if (!file.type.startsWith('image/')) {
      uploadError.value = t('profile.uploadInvalidType')
      return
    }

    const maxSizeMb = 5
    if (file.size > maxSizeMb * 1024 * 1024) {
      uploadError.value = t('profile.uploadTooLarge', { size: maxSizeMb })
      return
    }

    uploading.value = true

    try {
      const base64 = await readFileAsBase64(file)
      const uploadResponse = await uploadService.uploadImageBase64(base64)
      const imageUrl = uploadResponse?.data?.url
      if (!imageUrl) {
        throw new Error(t('profile.uploadError'))
      }

      const updateResponse = await userService.updateProfile({ avatarUrl: imageUrl })
      user.value = updateResponse.data.user
      userStore.updateUser({ avatarUrl: imageUrl })
      if (user.value?.name) {
        userStore.updateUser({ name: user.value.name })
      }
      window.dispatchEvent(new Event('auth-changed'))
    } catch (err) {
      uploadError.value = err.message || t('profile.uploadError')
    } finally {
      uploading.value = false
    }
  }

  function triggerFileInput() {
    if (uploading.value || !fileInputRef.value) return
    fileInputRef.value.click()
  }

  function handleFileInputChange(event) {
    const files = event.target.files
    if (files && files.length > 0) {
      handleAvatarSelection(files[0])
    }
    if (event.target) event.target.value = ''
  }

  function clearError() {
    error.value = ''
  }

  function clearUploadError() {
    uploadError.value = ''
  }

  watch(targetUserId, async (newUserId, oldUserId) => {
    if (newUserId && newUserId.toString() !== (oldUserId?.toString() || '')) {
      user.value = null
      challenges.value = []
      error.value = ''
      await reloadProfileData()
    }
  })

  watch(
    () => props.userId,
    async (newId, oldId) => {
      if (newId && newId.toString() !== (oldId?.toString() || '')) {
        user.value = null
        challenges.value = []
        error.value = ''
        await reloadProfileData()
      }
    }
  )

  watch(
    () => route.path,
    async (newPath, oldPath) => {
      if (newPath !== oldPath) {
        user.value = null
        challenges.value = []
        error.value = ''
        await reloadProfileData()
      }
    }
  )

  watch(
    () => route.params.id,
    async (newId, oldId) => {
      if (newId !== oldId) {
        user.value = null
        challenges.value = []
        error.value = ''
        await reloadProfileData()
      }
    }
  )

  onMounted(async () => {
    await reloadProfileData()
    await nextTick()
  })

  return {
    user,
    displayUser,
    challenges,
    habitChallenges,
    checklistHistory,
    loading,
    error,
    uploading,
    uploadError,
    fileInputRef,
    currentUserId,
    isOwnProfile,
    targetUserId,
    userMissions,
    activeUserMissions,
    finishedUserMissions,
    liveUserMissions,
    reloadProfileData,
    clearError,
    clearUploadError,
    triggerFileInput,
    handleFileInputChange,
    handleAvatarSelection
  }
}
