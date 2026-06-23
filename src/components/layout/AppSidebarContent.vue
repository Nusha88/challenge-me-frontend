<template>
  <div :class="['sidebar-content-wrapper', 'app-sidebar-content', { 'is-mobile': mobile }]">
    <v-list>
      <div class="sidebar-user-section pa-3">
        <div
          class="d-flex align-center mb-3 sidebar-user-clickable settings-icon"
          @click="handleProfileClick"
        >
          <v-avatar size="40" class="sidebar-avatar mr-3">
            <v-img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="userName || ''" cover></v-img>
            <span v-else class="sidebar-avatar-initials">{{ getUserInitials(userName) }}</span>
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-body-1 font-weight-medium">{{ userName || t('navigation.profile') }}</div>
            <div class="text-caption text-medium-emphasis" :style="{ color: heroRankColor }">
              {{ heroRankTitle }} (Lvl {{ userLevel }})
            </div>
          </div>
        </div>

        <div class="pa-2">
          <div class="xp-sidebar-card" data-xp-sidebar-target>
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
              <span class="text-grey-darken-1">{{ xpDisplayCurrent }} / {{ xpDisplayNeeded }} XP</span>
              <span class="text-grey-darken-1">{{ Math.round(levelProgressPercentage) }}%</span>
            </div>

            <v-progress-linear
              :model-value="levelProgressPercentage"
              :color="heroRankColor"
              height="8"
              rounded
              striped
            ></v-progress-linear>
          </div>
        </div>
      </div>

      <v-divider class="my-2"></v-divider>

      <div class="sidebar-menu-card mb-4">
        <v-list-subheader class="sidebar-section-header">
          <Star :size="14" class="sidebar-section-icon ml-8" />
          {{ t('navigation.yourJourney') }}
        </v-list-subheader>

        <v-list-item
          to="/today"
          :active="currentRoute === 'today' || currentRoute === 'home'"
          color="primary"
          @click="handleNavClick"
        >
          <template #prepend>
            <Sparkles :size="20" class="sidebar-lucide-icon mr-2" />
          </template>
          <v-list-item-title>{{ t('navigation.today') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          to="/missions/my"
          :active="currentRoute === 'my-challenges'"
          color="primary"
          class="my-missions-link"
          @click="handleNavClick"
        >
          <template #prepend>
            <Mountain :size="20" class="sidebar-lucide-icon mr-2" />
          </template>
          <v-list-item-title>{{ t('navigation.myChallenges') }}</v-list-item-title>
        </v-list-item>
      </div>

      <div class="sidebar-menu-card mb-4">
        <v-list-subheader class="sidebar-section-header">
          <Globe2 :size="14" class="sidebar-section-icon ml-8" />
          {{ t('navigation.world') }}
        </v-list-subheader>

        <v-list-item
          to="/missions"
          :active="currentRoute === 'challenges'"
          color="primary"
          @click="handleNavClick"
        >
          <template #prepend>
            <Compass :size="20" class="sidebar-lucide-icon mr-2" />
          </template>
          <v-list-item-title>{{ t('navigation.allChallenges') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          to="/missions/watched"
          :active="currentRoute === 'watched-challenges'"
          color="primary"
          class="achievement-radar"
          @click="handleNavClick"
        >
          <template #prepend>
            <Eye :size="20" class="sidebar-lucide-icon mr-2" />
          </template>
          <v-list-item-title>{{ t('navigation.interested') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          to="/heroes"
          :active="currentRoute === 'users'"
          color="primary"
          @click="handleNavClick"
        >
          <template #prepend>
            <Trophy :size="20" class="sidebar-lucide-icon mr-2" />
          </template>
          <v-list-item-title>{{ t('navigation.allUsers') }}</v-list-item-title>
        </v-list-item>

        <div v-if="canInviteMore" class="sidebar-referral-block">
          <button
            type="button"
            class="sidebar-referral-btn"
            @click="openReferralDialog"
          >
            <v-icon size="16" class="sidebar-referral-icon">mdi-gift</v-icon>
            <span class="sidebar-referral-label">{{ t('referral.sidebarCta') }}</span>
            <span class="sidebar-referral-reward">+50</span>
            <span class="sidebar-referral-spark">{{ t('referral.sidebarSpark') }}</span>
          </button>
          <div class="sidebar-referral-status">
            {{ t('referral.invitedStatus', { count: referralInvitedCount, max: referralMaxInvites }) }}
          </div>
        </div>
      </div>

      <InviteFriendDialog
        v-model="referralDialogOpen"
        :referral-link="referralLink"
        :copy-feedback="referralCopyFeedback"
        @copy-link="copyReferralLink"
        @share-telegram="openTelegramShare"
        @share-whatsapp="openWhatsAppShare"
      />

      <div class="menu-divider"></div>

      <a href="https://t.me/Ignite_support_team_bot" target="_blank" class="menu-item support-item">
        <v-icon class="mr-2">mdi-lifebuoy</v-icon>
        <span>{{ t('navigation.reportBug') }}</span>
      </a>

      <div class="sidebar-menu-card logout-card mt-auto mb-4">
        <v-list-item class="logout-item" @click="handleLogoutClick">
          <template #prepend>
            <LogOut :size="20" class="logout-icon sidebar-lucide-icon mr-2" />
          </template>
          <v-list-item-title class="logout-text">{{ t('navigation.logout') }}</v-list-item-title>
        </v-list-item>
      </div>
    </v-list>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles, Mountain, Compass, Eye, Trophy, Star, Globe2, LogOut } from 'lucide-vue-next'
import InviteFriendDialog from './InviteFriendDialog.vue'
import { useReferralProgram } from '../../composables/useReferralProgram'

const props = defineProps({
  userName: { type: String, default: '' },
  userAvatarUrl: { type: String, default: '' },
  userLevel: { type: Number, default: 1 },
  heroRankTitle: { type: String, default: '' },
  heroRankColor: { type: String, default: '#7048E8' },
  levelProgressPercentage: { type: Number, default: 0 },
  xpDisplayCurrent: { type: Number, default: 0 },
  xpDisplayNeeded: { type: Number, default: 0 },
  currentRoute: { type: [String, Symbol], default: undefined },
  mobile: { type: Boolean, default: false }
})

const emit = defineEmits(['profile', 'logout', 'navigate'])

const { t } = useI18n()

const {
  stats: referralStats,
  dialogOpen: referralDialogOpen,
  copyFeedback: referralCopyFeedback,
  canInviteMore,
  loadReferralStats,
  openDialog: openReferralDialog,
  copyReferralLink,
  openTelegramShare,
  openWhatsAppShare,
  setupListeners,
  teardownListeners
} = useReferralProgram()

const referralLink = computed(() => referralStats.value.referralLink || '')
const referralInvitedCount = computed(() => referralStats.value.invitedCount || 0)
const referralMaxInvites = computed(() => referralStats.value.maxInvites || 5)

onMounted(() => {
  setupListeners()
  loadReferralStats()
})

onBeforeUnmount(() => {
  teardownListeners()
})

function getUserInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

function handleProfileClick() {
  emit('profile')
  if (props.mobile) emit('navigate')
}

function handleLogoutClick() {
  emit('logout')
  if (props.mobile) emit('navigate')
}

function handleNavClick() {
  if (props.mobile) emit('navigate')
}
</script>

<style scoped>
.sidebar-section-icon {
  color: #BDBDBD;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
}

.sidebar-user-section {
  background: rgba(112, 72, 232, 0.04);
  border-radius: 16px;
  margin: 12px;
  border: 1px solid rgba(112, 72, 232, 0.08);
  transition: background 0.3s ease;
  padding: 20px 16px !important;
}

.sidebar-user-clickable {
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  transition: background 0.2s ease;
}

.sidebar-user-clickable:hover {
  background: rgba(112, 72, 232, 0.05);
  filter: brightness(1.2);
}

.sidebar-user-section .text-body-1 {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 0.95rem !important;
  color: #94A3B8;
  line-height: 1.2;
}

.sidebar-user-section .text-caption {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-weight: 600;
  color: #94A3B8 !important;
}

.sidebar-user-section .justify-space-between {
  margin-top: 4px;
}

.sidebar-user-section .v-icon {
  opacity: 0.8;
}

.sidebar-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.sidebar-content-wrapper > .v-list {
  flex: 1;
  overflow-y: visible;
}

.sidebar-avatar {
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  background: #7048E8;
  color: white;
}

.sidebar-avatar-initials {
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
}

.xp-sidebar-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 12px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

:deep(.v-progress-linear) {
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  overflow: visible !important;
}

:deep(.v-progress-linear__determinate) {
  box-shadow: 0 0 15px currentColor;
  border-radius: 20px;
}

.logout-item {
  cursor: pointer;
}

.logout-text,
.logout-icon {
  color: rgba(255, 255, 255, 0.5) !important;
  transition: color 0.3s ease;
}

.logout-card {
  margin-top: auto !important;
  border: 1px solid rgba(255, 82, 82, 0.1) !important;
  background: rgba(255, 82, 82, 0.02) !important;
  transition: all 0.3s ease;
}

.logout-card:hover {
  background: rgba(255, 82, 82, 0.08) !important;
  border-color: rgba(255, 82, 82, 0.3) !important;
  box-shadow: 0 0 20px rgba(255, 82, 82, 0.1);
}

.logout-card:hover .logout-text,
.logout-card:hover .logout-icon {
  color: #ff5252 !important;
}

.logout-card:hover .sidebar-lucide-icon {
  filter: drop-shadow(0 0 8px rgba(255, 82, 82, 0.5));
  transform: translateX(3px);
}

:deep(.v-list-subheader) {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  text-transform: uppercase !important;
  letter-spacing: 1.2px !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: #94A3B8 !important;
  margin-top: 24px !important;
  margin-bottom: 8px !important;
  padding-left: 20px !important;
  min-height: auto !important;
  height: auto !important;
}

:deep(.v-list-subheader)::before {
  content: "•";
  margin-right: 8px;
  color: rgba(112, 72, 232, 0.4);
}

.sidebar-section-header {
  height: 32px !important;
  min-height: 32px !important;
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
  letter-spacing: 1.2px !important;
  color: rgba(255, 255, 255, 0.4) !important;
  display: flex !important;
  align-items: center !important;
  margin-top: 15px;
}

:deep(.v-list-item) {
  margin: 4px 12px !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #fff !important;
}

:deep(.v-list-item:hover .v-list-item__prepend) {
  transform: scale(1.1);
}

:deep(.v-list-item:hover .v-icon) {
  transform: scale(1.15) rotate(5deg);
  color: #7C4DFF;
}

:deep(.v-list-item--active) {
  background: linear-gradient(90deg, rgba(112, 72, 232, 0.15) 0%, transparent 100%) !important;
  color: #fff !important;
  border-left: 3px solid #7048E8 !important;
}

:deep(.v-list-item--active .sidebar-lucide-icon) {
  color: #7048E8 !important;
  filter: drop-shadow(0 0 5px rgba(112, 72, 232, 0.8));
}

:deep(.v-list-item--active .v-list-item-title) {
  color: #fff !important;
  font-weight: 700 !important;
}

:deep(.v-list-item-title) {
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  color: #ffffff;
}

.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 20px 12px;
}

.is-mobile .menu-divider {
  margin: 20px 16px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 0 12px 12px 12px;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.is-mobile .menu-item {
  margin: 0 16px 12px 16px;
}

.support-item {
  color: #94a3b8;
  transition: all 0.3s ease;
}

.support-item:hover {
  color: #4FD1C5;
  text-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
  background: rgba(79, 209, 197, 0.05);
}

.support-item .v-icon {
  color: inherit;
}

.support-item span {
  font-size: 0.875rem;
  font-weight: 500;
}

.sidebar-menu-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 20px !important;
  margin: 0 12px 16px 12px !important;
  padding: 8px 0 !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.3s ease;
}

.is-mobile .sidebar-menu-card {
  margin: 0 16px 16px 16px !important;
}

.sidebar-referral-block {
  margin: 8px 12px 4px;
  padding: 0 4px;
}

.is-mobile .sidebar-referral-block {
  margin: 8px 16px 4px;
}

.sidebar-referral-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 4px;
  width: 100%;
  padding: 10px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%);
  color: #0F172A;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(79, 209, 197, 0.35);
  transition: all 0.25s ease;
}

.sidebar-referral-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 18px rgba(79, 209, 197, 0.55);
  filter: brightness(1.05);
}

.sidebar-referral-icon {
  flex-shrink: 0;
}

.sidebar-referral-label,
.sidebar-referral-reward,
.sidebar-referral-spark {
  flex-shrink: 0;
  line-height: 1;
}

.sidebar-referral-spark {
  font-size: 0.7rem;
}

.sidebar-referral-status {
  margin-top: 8px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.3px;
}
</style>
