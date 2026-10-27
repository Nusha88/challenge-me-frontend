import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { userService } from '../services/api'
import { migrateDemoMissionsAfterRegister, discardDemoWithoutMigrate } from '../services/demoMigration'
import { GOALS, reachGoal } from '../services/analytics'

function safeRedirect(target) {
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
    return target
  }
  return '/today'
}

export function useSocialAuthSession() {
  const router = useRouter()
  const userStore = useUserStore()

  async function finishSocialAuth({ token, user, isNew, redirect, skipNavigate = false }) {
    if (!token) throw new Error('Missing token')

    userStore.setToken(token)
    if (user) {
      userStore.setUser(user)
    } else {
      const profile = await userService.getProfile()
      userStore.setUser(profile.data.user)
    }

    const userId = userStore.userId
    if (isNew) {
      try {
        await migrateDemoMissionsAfterRegister(userId)
      } catch {
        // Demo copy is best-effort; the account is already created.
      }
      reachGoal(GOALS.REGISTER_SUCCESS)
    } else {
      discardDemoWithoutMigrate()
      reachGoal(GOALS.LOGIN_SUCCESS)
    }

    if (localStorage.getItem('onboarding_complete') !== 'true') {
      localStorage.setItem('onboarding_pending', 'true')
    }

    window.dispatchEvent(new Event('auth-changed'))

    if (!skipNavigate) {
      await router.replace(safeRedirect(redirect))
    }

    return safeRedirect(redirect)
  }

  return { finishSocialAuth, safeRedirect }
}
