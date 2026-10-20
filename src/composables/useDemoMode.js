import { storeToRefs } from 'pinia'
import { useDemoStore } from '../stores/demo'
import { useUserStore } from '../stores/user'
import { DEMO_USER_ID } from '../constants/demo'
import { useDemoAuthGate } from './useDemoAuthGate'

export function useDemoMode() {
  const demoStore = useDemoStore()
  const userStore = useUserStore()
  const { isDemoMode, isSocialGated, character } = storeToRefs(demoStore)
  const { openAuthGate } = useDemoAuthGate()

  function getEffectiveUserId() {
    if (userStore.userId) return String(userStore.userId)
    if (demoStore.isDemoMode) return DEMO_USER_ID
    return null
  }

  function requireAuthOrPrompt(redirect = '/register?from=demo') {
    if (!demoStore.isSocialGated) return true
    openAuthGate({ redirect })
    return false
  }

  return {
    isDemoMode,
    isSocialGated,
    character,
    getEffectiveUserId,
    startDemo: demoStore.startDemo,
    stopDemo: demoStore.stopDemo,
    discardDemo: demoStore.discardDemo,
    requireAuthOrPrompt
  }
}
