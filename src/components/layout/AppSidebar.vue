<template>
  <v-navigation-drawer
    v-model="isOpen"
    :permanent="mdAndUp"
    :temporary="!mdAndUp"
    location="left"
    :width="drawerWidth"
    :scrim="!mdAndUp"
    class="app-sidebar app-chrome"
    :class="mdAndUp ? 'app-sidebar--desktop' : 'app-sidebar--mobile'"
  >
    <AppSidebarContent
      v-bind="sidebarContentProps"
      :mobile="!mdAndUp"
      :display-streak-days="displayStreakDays"
      :yesterday-streak-days="yesterdayStreakDays"
      :has-today-completed-tasks="hasTodayCompletedTasks"
      :streak-days-text="streakDaysText"
      :show-streak="showStreak"
      @profile="$emit('profile')"
      @logout="$emit('logout')"
      @navigate="closeMobileDrawer"
    />
  </v-navigation-drawer>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import AppSidebarContent from './AppSidebarContent.vue'
import { useSidebarUser } from '../../composables/useSidebarUser'

const props = defineProps({
  drawerOpen: { type: Boolean, default: false },
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  streakDaysText: { type: String, default: '' },
  showStreak: { type: Boolean, default: false }
})

const emit = defineEmits(['update:drawerOpen', 'profile', 'logout'])

const { mdAndUp, lgAndUp } = useDisplay()
const { sidebarContentProps } = useSidebarUser()

const drawerWidth = computed(() => {
  if (!mdAndUp.value) return 300
  return lgAndUp.value ? 256 : 220
})

/**
 * One drawer for both breakpoints. Desktop stays permanently open;
 * mobile is closed until the header menu toggles `drawerOpen`.
 */
const isOpen = computed({
  get() {
    return mdAndUp.value ? true : props.drawerOpen
  },
  set(value) {
    if (!mdAndUp.value) {
      emit('update:drawerOpen', value)
    }
  }
})

function closeMobileDrawer() {
  if (!mdAndUp.value) {
    emit('update:drawerOpen', false)
  }
}

watch(mdAndUp, (isDesktop) => {
  if (!isDesktop) {
    emit('update:drawerOpen', false)
  }
}, { immediate: true })
</script>

<style scoped>
.app-sidebar {
  border: none !important;
  color: var(--home-text, #f1f5f9);
}

.app-sidebar--desktop {
  background: rgba(11, 13, 18, 0.78) !important;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-right: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
}

.app-sidebar--mobile {
  background: var(--home-bg, #0b0d12) !important;
  z-index: 2005 !important;
}

.app-sidebar :deep(.v-navigation-drawer__border) {
  display: none !important;
}

.app-sidebar :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
  color: var(--home-text, #ffffff);
}

.app-sidebar--desktop :deep(.v-list-item-title) {
  font-size: 0.95rem;
}
</style>
