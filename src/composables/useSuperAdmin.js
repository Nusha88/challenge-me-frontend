import { computed } from 'vue'
import { useUserStore } from '../stores/user'
import { isSuperAdminUserId } from '../constants/superAdmin'

export function useSuperAdmin() {
  const userStore = useUserStore()
  const isSuperAdmin = computed(() => isSuperAdminUserId(userStore.userId))
  return { isSuperAdmin }
}
