import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { useDemoAuthGate } from './useDemoAuthGate'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import {
  DEFENSE_CATALOG,
  WISH_COST_MAX,
  WISH_COST_MIN,
  WISH_MAX_ITEMS,
  WISH_TITLE_MAX,
  formatWishDays
} from '../constants/shop'

function emptyInventory() {
  return { freezeTokens: 0, secondChanceTokens: 0 }
}

export function useSparksShop() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const demoStore = useDemoStore()
  const { openAuthGate } = useDemoAuthGate()

  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const toast = ref('')
  const toastOpen = ref(false)
  const wishItems = ref([])
  const inventory = ref(emptyInventory())
  const catalog = ref([...DEFENSE_CATALOG])
  const formTitle = ref('')
  const formCost = ref('')

  const isDemo = computed(() => demoStore.isDemoMode || !userStore.isLoggedIn)
  const sparks = computed(() => {
    if (demoStore.isDemoMode) return Number(demoStore.character?.sparks || 0)
    return userStore.userSparks
  })
  const canAddWish = computed(() => wishItems.value.length < WISH_MAX_ITEMS)
  const parsedCost = computed(() => {
    const cost = Number(formCost.value)
    return Number.isInteger(cost) ? cost : null
  })
  const canSubmitWish = computed(() => {
    const title = formTitle.value.trim()
    const cost = parsedCost.value
    return Boolean(
      canAddWish.value
      && title
      && title.length <= WISH_TITLE_MAX
      && cost != null
      && cost >= WISH_COST_MIN
      && cost <= WISH_COST_MAX
    )
  })
  const priceHint = computed(() => {
    const cost = parsedCost.value
    if (cost == null || cost < WISH_COST_MIN) return ''

    const parts = [t('sparks.shop.wish.priceHintDays', { days: formatWishDays(cost) })]
    if (cost === 50) {
      parts.push(t('sparks.shop.wish.priceHintFreeze'))
    }
    return parts.join(' · ')
  })

  function requireRegistered() {
    if (!isDemo.value) return true
    openAuthGate({ redirect: '/register?from=demo' })
    return false
  }

  function showToast(message) {
    toast.value = message
    toastOpen.value = Boolean(message)
  }

  function setErrorFromReason(reason, fallbackKey) {
    const keys = {
      insufficient_sparks: 'sparks.shop.wish.insufficient',
      wish_limit_reached: 'sparks.shop.wish.limitReached',
      invalid_title: 'sparks.shop.wish.invalidTitle',
      invalid_cost: 'sparks.shop.wish.invalidCost',
      title_too_long: 'sparks.shop.wish.invalidTitle'
    }
    error.value = t(keys[reason] || fallbackKey)
  }

  function applyShopState(data) {
    if (Array.isArray(data?.wishItems)) {
      wishItems.value = data.wishItems
    }
    if (data?.inventory) {
      inventory.value = {
        freezeTokens: Number(data.inventory.freezeTokens || 0),
        secondChanceTokens: Number(data.inventory.secondChanceTokens || 0)
      }
    }
    if (Array.isArray(data?.catalog) && data.catalog.length) {
      catalog.value = DEFENSE_CATALOG.map((item) => {
        const remote = data.catalog.find((entry) => entry.type === item.type)
        return remote ? { ...item, cost: remote.cost } : item
      })
    }
    if (typeof data?.sparks === 'number' && !isDemo.value) {
      userStore.updateUser({ sparks: data.sparks, inventory: inventory.value })
    } else if (data?.inventory && !isDemo.value) {
      userStore.updateUser({ inventory: inventory.value })
    }
  }

  function applySpendResponse(data) {
    if (data?.user) {
      userStore.updateUser(data.user)
      if (data.user.inventory) {
        inventory.value = {
          freezeTokens: Number(data.user.inventory.freezeTokens || 0),
          secondChanceTokens: Number(data.user.inventory.secondChanceTokens || 0)
        }
      }
    } else if (typeof data?.sparks === 'number') {
      userStore.updateUser({ sparks: data.sparks })
    }

    if (data?.inventory) {
      inventory.value = {
        freezeTokens: Number(data.inventory.freezeTokens || 0),
        secondChanceTokens: Number(data.inventory.secondChanceTokens || 0)
      }
      userStore.updateUser({ inventory: inventory.value })
    }

    const sparksSpent = Number(data?.sparksSpent || 0)
    if (sparksSpent > 0) {
      dispatchAppEvent(APP_EVENTS.SPARKS_SPENT, { spent: sparksSpent })
    }
  }

  function applyTemplate(template) {
    formTitle.value = t(`sparks.shop.wish.templates.${template.key}`)
    formCost.value = String(template.cost)
  }

  function applySizeChip(cost) {
    formCost.value = String(cost)
  }

  function resetForm() {
    formTitle.value = ''
    formCost.value = ''
    error.value = ''
  }

  async function loadShop() {
    error.value = ''
    if (isDemo.value) {
      wishItems.value = []
      inventory.value = emptyInventory()
      catalog.value = [...DEFENSE_CATALOG]
      resetForm()
      return
    }

    loading.value = true
    try {
      const response = await userService.getShop()
      applyShopState(response?.data || {})
      resetForm()
    } catch (loadError) {
      error.value = loadError.response?.data?.message || t('sparks.shop.wish.error')
    } finally {
      loading.value = false
    }
  }

  async function addWish() {
    if (!requireRegistered()) return
    if (!canSubmitWish.value || saving.value) return

    saving.value = true
    error.value = ''
    try {
      const response = await userService.createWish({
        title: formTitle.value.trim(),
        cost: parsedCost.value
      })
      applyShopState(response?.data || {})
      resetForm()
    } catch (saveError) {
      setErrorFromReason(saveError.response?.data?.reason, 'sparks.shop.wish.error')
    } finally {
      saving.value = false
    }
  }

  async function removeWish(wish) {
    if (!requireRegistered()) return
    if (!wish?.id || saving.value) return

    saving.value = true
    error.value = ''
    try {
      const response = await userService.deleteWish(wish.id)
      applyShopState(response?.data || {})
    } catch (saveError) {
      setErrorFromReason(saveError.response?.data?.reason, 'sparks.shop.wish.error')
    } finally {
      saving.value = false
    }
  }

  async function redeemWish(wish) {
    if (!requireRegistered()) return
    if (!wish?.id || saving.value) return
    if (sparks.value < wish.cost) {
      error.value = t('sparks.shop.wish.insufficient')
      return
    }

    saving.value = true
    error.value = ''
    try {
      const response = await userService.redeemWish(wish.id)
      applySpendResponse(response?.data || {})
      showToast(t('sparks.shop.wish.redeemedToast'))
    } catch (saveError) {
      setErrorFromReason(saveError.response?.data?.reason, 'sparks.shop.wish.error')
    } finally {
      saving.value = false
    }
  }

  async function buyToken(type) {
    if (!requireRegistered()) return
    if (saving.value) return

    const item = catalog.value.find((entry) => entry.type === type)
    if (item && sparks.value < item.cost) {
      error.value = t('sparks.shop.wish.insufficient')
      return
    }

    saving.value = true
    error.value = ''
    try {
      const response = await userService.buyShopToken(type)
      applySpendResponse(response?.data || {})
      showToast(t('sparks.shop.defense.boughtToast'))
    } catch (saveError) {
      setErrorFromReason(saveError.response?.data?.reason, 'sparks.shop.wish.error')
    } finally {
      saving.value = false
    }
  }

  function stockFor(type) {
    if (type === 'freeze') return Number(inventory.value.freezeTokens || 0)
    if (type === 'secondChance') return Number(inventory.value.secondChanceTokens || 0)
    return 0
  }

  return {
    loading,
    saving,
    error,
    toast,
    toastOpen,
    wishItems,
    inventory,
    catalog,
    formTitle,
    formCost,
    sparks,
    canAddWish,
    canSubmitWish,
    priceHint,
    isDemo,
    applyTemplate,
    applySizeChip,
    loadShop,
    addWish,
    removeWish,
    redeemWish,
    buyToken,
    stockFor
  }
}
