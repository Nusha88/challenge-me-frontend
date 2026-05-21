<template>
  <v-navigation-drawer
    permanent
    class="d-none d-md-block desktop-sidebar sidebar-column"
  >
    <AppSidebarContent
      v-bind="sidebarContentProps"
      @profile="$emit('profile')"
      @logout="$emit('logout')"
    />
  </v-navigation-drawer>

  <Teleport to="body">
    <v-navigation-drawer
      :model-value="drawerOpen"
      temporary
      location="start"
      class="d-md-none mobile-drawer"
      @update:model-value="$emit('update:drawerOpen', $event)"
    >
      <AppSidebarContent
        mobile
        v-bind="sidebarContentProps"
        @profile="$emit('profile')"
        @logout="$emit('logout')"
        @navigate="$emit('update:drawerOpen', false)"
      />
    </v-navigation-drawer>
  </Teleport>
</template>

<script setup>
import AppSidebarContent from './AppSidebarContent.vue'
import { useSidebarUser } from '../../composables/useSidebarUser'

defineProps({
  drawerOpen: { type: Boolean, default: false }
})

defineEmits(['update:drawerOpen', 'profile', 'logout'])

const { sidebarContentProps } = useSidebarUser()
</script>

<style scoped>
.sidebar-column {
  grid-column: 1 / 3;
}

.desktop-sidebar {
  position: relative;
  flex-shrink: 0;
  height: 100vh;
  z-index: 1;
  margin-top: 0;
  padding-top: 0;
  top: 0 !important;
  width: auto;
  background: rgba(15, 15, 26, 0.7) !important;
  backdrop-filter: blur(20px);
  border: none !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #ffffff;
}

.desktop-sidebar :deep(.v-navigation-drawer) {
  top: 0 !important;
}

.desktop-sidebar :deep(.v-list) {
  padding-top: 0;
}

.desktop-sidebar :deep(.v-navigation-drawer__content) {
  padding-top: 0;
  background-color: transparent;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.desktop-sidebar :deep(.v-navigation-drawer__border) {
  display: none !important;
}

.desktop-sidebar :deep(.v-list-item-title) {
  font-size: 0.95rem;
}

.mobile-drawer {
  z-index: 2000;
  background-color: #131323;
}

.mobile-drawer :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-drawer :deep(.v-list-item-title) {
  font-size: 0.95rem;
}

@media (min-width: 960px) and (max-width: 1279px) {
  .desktop-sidebar {
    width: 220px !important;
  }

  .desktop-sidebar :deep(.v-list-item-title) {
    font-size: 0.9rem;
  }

  .desktop-sidebar :deep(.v-icon) {
    font-size: 20px;
  }
}

@media (min-width: 1280px) {
  .desktop-sidebar {
    width: 256px !important;
  }
}

@media (max-width: 600px) {
  .mobile-drawer {
    width: 280px !important;
  }

  .mobile-drawer :deep(.v-list-item-title) {
    font-size: 0.9rem;
  }

  .mobile-drawer :deep(.v-icon) {
    font-size: 20px;
  }

  .mobile-drawer :deep(.v-avatar) {
    width: 28px !important;
    height: 28px !important;
  }

  .mobile-drawer :deep(.sidebar-avatar-initials) {
    font-size: 12px;
  }
}

@media (max-width: 959px) {
  .desktop-sidebar {
    display: none !important;
    visibility: hidden !important;
  }

  .mobile-drawer:not(.v-navigation-drawer--active) {
    left: -280px !important;
    transform: translateX(0) !important;
  }

  .mobile-drawer.v-navigation-drawer--active {
    left: 0 !important;
  }
}
</style>
