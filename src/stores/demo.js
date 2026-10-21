import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUserStore } from './user'
import {
  DEMO_HABIT_DAY_SPARKS,
  DEMO_HABIT_DAY_XP,
  DEMO_CHECKLIST_TASK_XP,
  DEMO_CHECKLIST_TASK_SPARKS,
  DEMO_ALLOWED_ROUTE_NAMES
} from '../constants/demo'
import {
  clearDemoData,
  getDemoCharacter,
  isDemoActive,
  seedDemoCharacter,
  setDemoActive,
  setDemoCharacter
} from '../services/demoStorage'

export const useDemoStore = defineStore('demo', () => {
  const userStore = useUserStore()
  const demoActive = ref(isDemoActive())
  const character = ref(getDemoCharacter())
  const missionsVersion = ref(0)

  const isDemoMode = computed(() => !userStore.isLoggedIn && demoActive.value)
  const isSocialGated = computed(() => !userStore.isLoggedIn)

  function syncCharacterFromStorage() {
    character.value = getDemoCharacter()
  }

  function touchMissions() {
    missionsVersion.value += 1
  }

  function startDemo() {
    if (userStore.isLoggedIn) return
    demoActive.value = true
    setDemoActive(true)
    character.value = seedDemoCharacter()
  }

  function stopDemo() {
    demoActive.value = false
    setDemoActive(false)
  }

  function discardDemo() {
    clearDemoData()
    demoActive.value = false
    missionsVersion.value += 1
    character.value = getDemoCharacter()
  }

  function awardHabitDay() {
    const next = setDemoCharacter({
      ...character.value,
      xp: Number(character.value?.xp || 0) + DEMO_HABIT_DAY_XP,
      sparks: Number(character.value?.sparks || 0) + DEMO_HABIT_DAY_SPARKS
    })
    character.value = next
    return {
      xpGained: DEMO_HABIT_DAY_XP,
      sparksGained: DEMO_HABIT_DAY_SPARKS,
      character: next
    }
  }

  function awardChecklistTask() {
    const next = setDemoCharacter({
      ...character.value,
      xp: Number(character.value?.xp || 0) + DEMO_CHECKLIST_TASK_XP,
      sparks: Number(character.value?.sparks || 0) + DEMO_CHECKLIST_TASK_SPARKS
    })
    character.value = next
    return {
      xpGained: DEMO_CHECKLIST_TASK_XP,
      sparksGained: DEMO_CHECKLIST_TASK_SPARKS,
      character: next
    }
  }

  function isDemoAllowedRoute(routeName) {
    return DEMO_ALLOWED_ROUTE_NAMES.includes(routeName)
  }

  return {
    demoActive,
    character,
    missionsVersion,
    isDemoMode,
    isSocialGated,
    startDemo,
    stopDemo,
    discardDemo,
    awardHabitDay,
    awardChecklistTask,
    syncCharacterFromStorage,
    touchMissions,
    isDemoAllowedRoute
  }
})
