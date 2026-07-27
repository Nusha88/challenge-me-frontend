<template>
  <v-dialog 
    v-model="dialogModel"
    max-width="900"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="handleVisibility"
  >
    <v-card v-if="!challenge" class="challenge-details-card rounded-xl overflow-hidden">
      <v-card-text class="d-flex justify-center align-center py-16">
        <v-progress-circular indeterminate color="#4FD1C5" size="48" />
      </v-card-text>
    </v-card>

    <v-card
      v-else
      ref="dialogSurfaceRef"
      class="challenge-details-card rounded-xl overflow-hidden"
    >
      <ChallengeDetailsHeader
        :challenge="challenge"
        :is-owner="isOwner"
        :is-finished="isFinished"
        :can-invite-friends="canInviteFriends"
        :type-label="getChallengeTypeLabel(challenge.challengeType)"
        :start-label="formatDisplayDate(challenge.startDate)"
        :end-label="formatDisplayDate(challenge.endDate)"
        @edit="openEditPage"
        @copy-link="copyLink"
        @invite="openInviteCardDialog"
        @close="handleVisibility(false)"
      />

      <v-tabs v-model="tab" grow class="custom-tabs" density="default" height="48">
        <v-tab value="progress">{{ t('challenges.progress') }}</v-tab>
        <v-tab value="details">{{ t('challenges.about') }}</v-tab>
        <v-tab v-if="challenge.allowComments" value="community">{{ t('challenges.community.title') }}</v-tab>
        <v-tab v-if="isOwner" value="diary">{{ t('challenges.diary.tabTitle') }}</v-tab>
      </v-tabs>

      <v-alert
        v-if="feedbackMessage"
        :type="feedbackType"
        variant="tonal"
        density="compact"
        class="ma-4 mb-0 details-feedback"
        closable
        @click:close="clearFeedback"
      >
        {{ feedbackMessage }}
      </v-alert>

      <v-card-text class="pa-0 modal-body-bg">
        <v-window
          v-model="tab"
          class="pa-6 details-window"
        >
          
          <v-window-item value="progress" eager :transition="false" :reverse-transition="false">
            <div class="tab-content-wrapper">
              <template v-if="challenge.challengeType === CHALLENGE_TYPES.HABIT">
                <p v-if="isCurrentUserParticipant" class="progress-lead">{{ t('challenges.progressRitualLead') }}</p>
                <div class="progress-header mb-6">
                  <div v-if="!isFinished" class="progress-header-row d-flex justify-space-between align-center flex-wrap gap-2">
                    <div v-if="showPersonalPace" class="personal-pace-row">
                      <span class="personal-pace-label">{{ t('challenges.personalPace') }}:</span>
                      <div class="personal-pace-main">
                        <span class="hero-rank-title" :style="{ color: heroRank.color }">{{ heroRank.title }}</span>
                        <span class="pace-status-group">
                          <span class="pace-description">{{ paceStatus.description }}</span>
                          <component
                            :is="paceStatus.icon"
                            :size="18"
                            class="pace-icon"
                            :style="{ color: heroRank.color }"
                          />
                        </span>
                      </div>
                    </div>
                    <h3 v-else class="section-title">{{ t('challenges.progress') }}</h3>
                    <v-chip
                      v-if="!isFinished && currentDayText"
                      size="small"
                      variant="outlined"
                      color="#4FD1C5"
                      class="progress-days-chip flex-shrink-0"
                    >
                      {{ currentDayText }}
                    </v-chip>
                  </div>
                </div>

                <div v-if="heavyContentReady" class="calendar-grid">
                  <div 
                    v-for="day in calendarDays" 
                    :key="day.date"
                    class="day-cell"
                    :class="getDayClass(day)"
                    :style="getDayCellStyle(day)"
                    @click="handleDayCellClick(day)"
                  >
                    <v-tooltip
                      activator="parent"
                      location="top"
                      :disabled="!getDayCellTooltip(day) || (isMobileCalendar && day.isToday)"
                      :model-value="isMobileCalendar ? openCalendarTooltipDate === day.date : undefined"
                      :open-on-hover="!isMobileCalendar"
                      :open-on-click="false"
                      :close-on-back="isMobileCalendar"
                    >
                      {{ getDayCellTooltip(day) }}
                    </v-tooltip>
                    <span v-if="day.isJoinMarker" class="join-marker">🚩</span>
                    <span v-else class="day-number">{{ day.number }}</span>
                    <v-icon
                      v-if="isDayProtected(day)"
                      icon="mdi-shield-check"
                      size="x-small"
                      class="absolute-shield"
                      color="warning"
                    />
                    <v-icon 
                      v-if="day.isToday && day.isUserCompleted" 
                      size="12" 
                      color="#4CAF50" 
                      class="today-checkmark"
                    >
                      mdi-check-circle
                    </v-icon>
                  </div>
                </div>

                <div v-if="!isFinished" class="calendar-legend mt-8">
                  <div class="legend-item"><span class="dot completed"></span> {{ t('challenges.completed') }}</div>
                  <div class="legend-item"><span class="dot protected"></span> {{ t('sparks.rituals.protectedBadge') }}</div>
                  <div class="legend-item"><span class="dot missed"></span> {{ t('challenges.missed') }}</div>
                  <div class="legend-item"><span class="dot today"></span> {{ t('challenges.today') }}</div>
                </div>
              </template>

              <template v-else>
                <p v-if="isCurrentUserParticipant" class="progress-lead">{{ t('challenges.progressQuestLead') }}</p>
                <div class="d-flex justify-space-between mb-2">
                  <span class="section-title">{{ progressPercentage }}% {{ t('challenges.completed') }}</span>
                </div>
                <v-progress-linear
                  :model-value="progressPercentage"
                  color="#4FD1C5"
                  height="10"
                  rounded
                  class="mission-progress mb-6"
                ></v-progress-linear>
                <ChallengeActions
                  ref="challengeActionsRef"
                  v-if="heavyContentReady"
                  v-model="actionsViewModel"
                  :readonly="!isOwner || isFinished"
                  :hide-add-button="false"
                  :simplified-view="!isOwner"
                  :hide-item-controls="false"
                  :confirm-top-level-check="canConfirmQuestActions"
                  @request-complete="openQuestSuccess"
                />
              </template>
            </div>
          </v-window-item>

          <v-window-item value="details" eager :transition="false" :reverse-transition="false">
            <v-row dense class="mb-8">
              <v-col cols="6" md="4" v-for="(item, statIdx) in missionStats" :key="`${statIdx}-${item.type || 'default'}-${item.label}`">
                <div class="stat-card">
                  <template v-if="item.type === 'reward'">
                    <div class="reward-icon-row">
                      <Trophy :size="20" color="#FFC107" stroke-width="2.5" />
                    </div>
                    <div class="stat-label">{{ item.label }}</div>
                    <div class="stat-value">{{ item.value }}</div>
                  </template>
                  <template v-else>
                    <div v-if="item.type === 'difficulty'" class="difficulty-icon-row">
                      <v-icon
                        v-for="n in item.zaps"
                        :key="n"
                        icon="mdi-flash"
                        size="18"
                        color="#FBBF24"
                        class="mr-1"
                      ></v-icon>
                    </div>
                    <v-icon
                      v-else
                      :icon="item.icon"
                      size="18"
                      :color="item.color || '#4FD1C5'"
                    ></v-icon>
                    <div class="stat-label">{{ item.label }}</div>
                    <div class="stat-value">{{ item.value }}</div>
                  </template>
                </div>
              </v-col>
            </v-row>

            <h3 class="section-title mb-3">{{ t('challenges.description') }}</h3>
            <div class="description-text mb-8">{{ challenge.description }}</div>

            <div
              v-if="!isOwner"
              class="owner-box pa-4 rounded-lg"
              @click="navigateToOwner"
            >
              <v-avatar size="40" class="owner-avatar mr-4">
                <v-img v-if="challenge.owner?.avatarUrl" :src="challenge.owner.avatarUrl" cover></v-img>
                <span v-else>{{ getOwnerInitial() }}</span>
              </v-avatar>
              <div>
                <div class="text-caption opacity-60">{{ t('challenges.createdByLabel') }}</div>
                <div class="font-weight-bold">{{ challenge.owner?.name || t('challenges.unknownHero') }}</div>
              </div>
            </div>

            <div v-if="totalParticipantsCount > 1 && visibleParticipants.length" class="participants-box mt-4">
              <div class="text-caption opacity-60 mb-2">{{ t('challenges.participants') }}</div>
              <div class="participants-row">
                <v-tooltip
                  v-for="participant in visibleParticipants"
                  :key="participant.id"
                  location="top"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-avatar
                      v-bind="tooltipProps"
                      size="32"
                      class="participant-avatar"
                      @click.stop="navigateToParticipant(participant.id)"
                    >
                      <v-img v-if="participant.avatarUrl" :src="participant.avatarUrl" cover></v-img>
                      <span v-else>{{ getParticipantInitial(participant.name) }}</span>
                    </v-avatar>
                  </template>
                  <span>{{ participant.name || t('challenges.unknownHero') }}</span>
                </v-tooltip>

                <v-tooltip
                  v-if="remainingParticipantsCount > 0"
                  location="top"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-avatar
                      v-bind="tooltipProps"
                      size="32"
                      class="participant-avatar participant-avatar-more"
                    >
                      <span>+{{ remainingParticipantsCount }}</span>
                    </v-avatar>
                  </template>
                  <span>{{ t('challenges.participants') }}</span>
                </v-tooltip>
              </div>
            </div>
          </v-window-item>

          <v-window-item value="community" eager :transition="false" :reverse-transition="false">
            <div class="diary-container">
              <v-alert
                v-if="isFinished"
                type="info"
                variant="tonal"
                class="info-message mb-4"
              >
                <template #prepend>
                  <v-icon class="info-message-icon">mdi-information</v-icon>
                </template>
                {{ t('challenges.finishedChallengeComments') }}
              </v-alert>
              <CommentsComponent
                :key="communityRefreshKey"
                :challenge-id="String(challenge._id)"
                :allow-comments="challenge.allowComments !== false"
                :current-user-id="currentUserId"
                :is-owner="isOwner"
                :is-finished="isFinished"
                :challenge-type="challenge.challengeType"
                :challenge-start-date="challenge.startDate"
                :challenge-end-date="challenge.endDate"
                :challenge-owner="challenge.owner"
                :challenge-participants="challenge.participants || []"
                :previous-run-id="previousRunId"
                :scroll-target="scrollTarget"
                @join="emitJoin"
                @open-previous-run="openPreviousRun"
              />
            </div>
          </v-window-item>

          <v-window-item v-if="isOwner" value="diary" eager :transition="false" :reverse-transition="false">
            <div class="diary-container">
              <DiaryComponent
                :challenge-id="String(challenge._id)"
                :current-user-id="currentUserId"
                :is-owner="isOwner"
                :is-finished="isFinished"
                @entry-shared="handleDiaryShared"
              />
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions ref="footerActionsRef" class="modal-footer px-6 py-4">
        <v-btn v-if="showLeaveButtonEffective" color="#ff5252" variant="text" @click="openLeaveConfirm">
          {{ t('challenges.giveUp') }}
        </v-btn>

        <v-spacer></v-spacer>

        <div v-if="showProgressFooterActions" class="footer-actions-wrapper d-flex gap-3">
          <v-btn
            v-if="showWatchActionButton"
            variant="outlined"
            :color="isWatched ? '#4FD1C5' : 'rgba(255,255,255,0.3)'"
            class="rounded-lg action-outline-btn"
            :loading="watchingId === challenge._id"
            :disabled="watchingId === challenge._id"
            @click="isWatched ? handleUnwatch() : handleWatch()"
          >
            <v-icon start size="18">{{ isWatched ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
            {{ isWatched ? t('challenges.unwatch') : t('challenges.watch') }}
          </v-btn>

          <v-btn
            v-if="showEndMissionButton"
            variant="outlined"
            color="#4FD1C5"
            class="rounded-lg action-outline-btn end-mission-btn"
            :loading="endMissionLoading"
            :disabled="endMissionLoading || isMainActionLoading"
            @click="handleEndMission"
          >
            {{ t('challenges.endMission') }}
          </v-btn>

          <v-btn
            v-if="showMainActionButton"
            ref="mainActionBtnRef"
            class="main-action-btn ml-2"
            :loading="isMainActionLoading"
            :disabled="isMainActionLoading"
            @click="handleMainActionClick"
          >
            {{ mainActionButtonText }}
          </v-btn>
        </div>
      </v-card-actions>

      <!-- Leave confirmation dialog -->
      <v-dialog
        v-model="leaveConfirmDialog"
        max-width="420"
      >
        <v-card class="leave-confirm-card">
          <v-card-title class="text-h6 font-weight-bold">
            {{ t('challenges.leaveConfirmTitle') }}
          </v-card-title>
          <v-card-text class="text-body-2">
            {{ t('challenges.leaveConfirmText') }}
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn
              variant="text"
              color="rgba(255,255,255,0.6)"
              @click="leaveConfirmDialog = false"
            >
              {{ t('common.cancel') }}
            </v-btn>
            <v-btn
              color="#ff5252"
              variant="flat"
              @click="confirmLeave"
            >
              {{ t('challenges.giveUp') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <MissionInviteModal
        v-model="inviteDialogOpen"
        :invite-url="inviteUrl"
        :card-data="inviteCardData"
      />
    </v-card>
  </v-dialog>

  <QuestSuccessModal
    v-model="questSuccessOpen"
    :step-name="pendingAction.text"
    :loading="questSuccessLoading"
    @confirm="confirmQuestSuccess"
  />

  <ShareAchievementModal
    v-model="questShareCardOpen"
    :payload="questShareCardData"
    @invite-mission="openInviteFromTriumph"
  />
</template>

<style scoped>

.challenge-details-card {
  background: var(--home-bg, #0b0d12) !important; 
  color: var(--home-text, #f1f5f9) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  /* Keep chrome (header/tabs/footer) from being crushed by scrollable dialog flex. */
  max-height: calc(100vh - 48px);
}

.challenge-details-card :deep(.header-image) {
  flex-shrink: 0;
}

.modal-body-bg {
  background: var(--home-bg, #0b0d12) !important;
}

.details-feedback {
  flex-shrink: 0;
}


.header-overlay {
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.95) 100%);
}

.header-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn { color: white !important; opacity: 0.8; }
.action-btn:hover { opacity: 1; background: rgba(255,255,255,0.1); }

.chip-habit {
  background-color: #4FD1C5 !important;
  color: #0b0d12 !important;
  box-shadow: none;
}
.chip-result {
  background-color: rgba(251, 191, 36, 0.9) !important;
  color: #0b0d12 !important;
  box-shadow: none;
}

.custom-tabs {
  --v-tabs-height: 48px;
  flex-shrink: 0;
  height: 48px;
  min-height: 48px;
  background: var(--home-surface, rgba(22, 27, 40, 0.85)) !important;
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}
.custom-tabs :deep(.v-tab) {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.25;
  height: 48px !important;
  min-height: 48px !important;
  color: rgba(255, 255, 255, 0.5) !important;
}
.custom-tabs :deep(.v-btn__content) {
  line-height: 1.25;
  overflow: visible;
  white-space: nowrap;
}
.custom-tabs :deep(.v-tab--selected) { color: #4FD1C5 !important; }
.custom-tabs :deep(.v-tab__slider) {
  background: #4FD1C5 !important;
}


.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.day-cell {
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}
.day-cell.is-disabled {
  cursor: not-allowed;
  opacity: 0.75;
}
.day-cell.is-completed {
  border: 2px solid #4fffb0 !important;
  color: #4fffb0 !important;
  box-shadow:
    0 0 6px rgba(79, 255, 176, 0.85),
    0 0 14px rgba(57, 255, 20, 0.45),
    inset 0 0 8px rgba(79, 255, 176, 0.2);
}

.day-cell.is-completed.is-today {
  border-color: #4fffb0 !important;
  color: #4fffb0 !important;
  box-shadow:
    0 0 6px rgba(79, 255, 176, 0.85),
    0 0 14px rgba(57, 255, 20, 0.45),
    inset 0 0 8px rgba(79, 255, 176, 0.2);
}

.day-cell.protected-day {
  background-color: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.5) !important;
}

.absolute-shield {
  position: absolute;
  top: 4px;
  right: 4px;
}

.day-cell.is-today:not(.is-completed):not(.protected-day) {
  border-color: #F4A782 !important;
  color: #F4A782 !important;
}


.mission-progress {
  background: rgba(255, 255, 255, 0.05) !important;
  overflow: visible !important;
}
.mission-progress :deep(.v-progress-linear__determinate) {
  box-shadow: 0 0 15px 2px rgba(79, 209, 197, 0.4);
  border-radius: 10px;
}


.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 14px;
  text-align: center;
}
.stat-label { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; margin-top: 4px; }
.stat-value { font-size: 0.9rem; font-weight: 800; }

.difficulty-icon-row,
.reward-icon-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 4px;
}

.owner-box {
  background: rgba(30, 41, 59, 0.5);
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
}

.owner-box:hover {
  background: rgba(30, 41, 59, 0.7);
  box-shadow: 0 0 12px rgba(79, 209, 197, 0.25);
  transform: translateY(-1px);
}

.owner-avatar {
  border: 2px solid rgba(79, 209, 197, 0.3) !important;
  flex-shrink: 0;
}

.owner-avatar span {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 16px;
}

.participants-box {
  background: rgba(30, 41, 59, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px 14px;
}

.participants-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.participant-avatar {
  border: 1px solid rgba(79, 209, 197, 0.45);
  background: rgba(15, 23, 42, 0.9);
  color: #FFFFFF;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.participant-avatar:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.35);
}

.participant-avatar-more {
  border-color: rgba(112, 72, 232, 0.6);
  background: rgba(112, 72, 232, 0.2);
}

.info-message {
  background-color: #1a1e2e !important;
  border: 1px solid transparent;
  border-image: linear-gradient(to right, #a78bfa, #2dd4bf) 1 !important;
  color: #e2e8f0 !important;
  padding: 16px 20px !important;
  box-shadow: 0 0 15px rgba(45, 212, 191, 0.2) !important;
}

.info-message-icon {
  color: #2dd4bf !important;
  filter: drop-shadow(0 0 5px rgba(45, 212, 191, 0.5));
}


.modal-footer {
  flex-shrink: 0;
  background: #0f172a !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.main-action-btn {
  background: linear-gradient(135deg, #4FD1C5 0%, #2dd4bf 100%) !important;
  color: #0b0d12 !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  border-radius: 12px !important;
  padding: 0 32px !important;
  box-shadow: 0 4px 15px rgba(79, 209, 197, 0.3) !important;
}
.footer-actions-wrapper {
  display: flex;
  align-items: center;
}
.v-card-text.pa-0.modal-body-bg {
  flex: 1 1 auto;
  min-height: 200px;
  max-height: min(60vh, 520px);
  overflow-y: auto;
}

.details-window {
  min-height: 180px;
  overflow: visible;
}

.diary-container,
.tab-content-wrapper {
  min-height: 140px;
}

.progress-lead {
  margin: 0 0 14px;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--home-text-dim, #94a3b8);
  max-width: 52ch;
}

.share-menu-list {
  background: #161b28 !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.share-menu-title {
  color: #f1f5f9 !important;
}

.action-outline-btn { text-transform: none; border-color: rgba(255, 255, 255, 0.1) !important; }

.section-title {
  color: #4FD1C5;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.progress-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 12px;
}

.progress-header-row {
  width: 100%;
}

.personal-pace-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
}

.personal-pace-label {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 600;
  white-space: nowrap;
}

.personal-pace-main {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  min-width: 0;
}

.hero-rank-title {
  font-weight: 700;
  white-space: nowrap;
}

.pace-status-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pace-description {
  color: rgba(255, 255, 255, 0.65);
  font-style: italic;
  white-space: nowrap;
}

.pace-icon {
  flex-shrink: 0;
  opacity: 0.95;
}

.progress-days-chip {
  margin-inline-start: auto;
}

.description-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
  justify-content: flex-start;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}


.dot {
  width: 14px;
  height: 14px;
  border-radius: 4px; 
  border: 1px solid transparent;
  transition: all 0.3s ease;
}


.dot.completed {
  background: rgba(79, 209, 197, 0.1) !important;
  border: 1px solid #4FD1C5 !important;
  box-shadow: 0 0 8px rgba(79, 209, 197, 0.3);
}

.dot.protected {
  background-color: rgba(255, 193, 7, 0.1) !important;
  border-color: rgba(255, 193, 7, 0.5) !important;
}

.dot.missed {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.dot.today {
  background: rgba(244, 167, 130, 0.05) !important;
  border: 1px solid #F4A782 !important;
  box-shadow: 0 0 10px rgba(244, 167, 130, 0.4);
}

.day-cell.is-missed:not(.is-completed):not(.protected-day):not(.is-pre-join) {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.day-cell.is-pre-join {
  background: rgba(255, 255, 255, 0.015) !important;
  border: 1px dashed rgba(255, 255, 255, 0.06) !important;
  opacity: 0.35;
  cursor: default;
  pointer-events: none;
}

.day-cell.is-join-marker {
  border-color: rgba(79, 209, 197, 0.45) !important;
  background: rgba(79, 209, 197, 0.08) !important;
  box-shadow: 0 0 12px rgba(79, 209, 197, 0.18);
}

.join-marker {
  font-size: 1rem;
  line-height: 1;
}

.today-checkmark {
  position: absolute;
  bottom: 2px;
  right: 2px;
  filter: drop-shadow(0 0 3px rgba(76, 175, 80, 0.6));
  z-index: 2;
}
.legend-item {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  font-size: 0.7rem;
}

.leave-confirm-card {
  background: #0f172a !important;
  color: #ffffff !important;
  border-radius: 16px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
}

@media (max-width: 600px) {
  .challenge-title {
    font-size: 1.25rem !important;
    line-height: 1.35;
  }

  .custom-tabs :deep(.v-tab) {
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    min-width: 0;
    padding-inline: 8px;
  }

  .progress-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .progress-header-row .section-title {
    width: 100%;
    margin-bottom: 0;
  }

  .personal-pace-row {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .personal-pace-main {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    width: 100%;
    gap: 6px 8px;
  }

  .pace-description {
    white-space: normal;
  }

  .progress-days-chip {
    margin-inline-start: 0;
    align-self: flex-start;
  }

  .modal-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .modal-footer .v-spacer {
    display: none;
  }

  .footer-actions-wrapper {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .modal-footer .v-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import {useChallengeType} from '../composables/useChallengeType'
import {useUserStore} from '../stores/user'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'
import ChallengeActions from './ChallengeActions.vue'
import MissionInviteModal from './mission-invite/MissionInviteModal.vue'
import ChallengeDetailsHeader from './challenge-details/ChallengeDetailsHeader.vue'
import CommentsComponent from './CommentsComponent.vue'
import DiaryComponent from './DiaryComponent.vue'
import QuestSuccessModal from './QuestSuccessModal.vue'
import ShareAchievementModal from './ShareAchievementModal.vue'
import {challengeService} from '../services/api'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import { useMissionCompletionFlow } from '../composables/useMissionCompletionFlow'
import { useMissionInvite } from '../composables/useMissionInvite'
import { createEmptyTriumphSharePayload, assignTriumphSharePayload, buildQuestStepPayload } from '../utils/triumphSharePayload'
import { getMissionShareUrl } from '../utils/appUrl'
import { openMissionDetails } from '../utils/openMissionDetails'
import { fireConfettiFromElement } from '../utils/confetti'
import { getPaceStatus } from '../utils/challengePace'
import { isChallengeEnded, areActionsCompleted } from '../utils/challengeStatus'
import { getScheduledDaysCount, normalizeDateKey, toDateInputValue } from '../utils/dateUtils'
import {
  getEffectiveCompletedDays
} from '../utils/participantDays'
import {
  countPersonalEffectiveDays,
  countPersonalScheduledDays,
  getParticipantJoinedAtKey,
  isLateJoiner,
  shouldTriggerHabitMissionCompletion
} from '../utils/missionParticipation'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { getLevelFromXp, getLevelInfo } from '../utils/levelSystem'
import { Trophy } from 'lucide-vue-next'
import { useChallengeDetailsMembership } from '../composables/useChallengeDetailsMembership'
import { buildDayClass, isDayProtected as isDayProtectedUtil } from '../composables/useChallengeDetailsCalendar'
import { createPendingQuestAction } from '../composables/useChallengeQuestPanel'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  challenge: {
    type: Object,
    default: null
  },
  isOwner: {
    type: Boolean,
    default: false
  },
  isParticipant: {
    type: Boolean,
    default: false
  },
  joinLoading: {
    type: Boolean,
    default: false
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  showLeaveButton: {
    type: Boolean,
    default: false
  },
  leaveLoading: {
    type: Boolean,
    default: false
  },
  saveLoading: {
    type: Boolean,
    default: false
  },
  saveError: {
    type: String,
    default: ''
  },
  deleteLoading: {
    type: Boolean,
    default: false
  },
  initialTab: {
    type: String,
    default: null
  },
  scrollTarget: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'join', 'leave', 'update'])

const leaveConfirmDialog = ref(false)
const isInitializing = ref(true)
const participantSaveLoading = ref(false)
const ownerActionsSaveLoading = ref(false)
const endMissionLoading = ref(false)
const mainActionBtnRef = ref(null)
const dialogSurfaceRef = ref(null)
const footerActionsRef = ref(null)
const feedbackMessage = ref('')
const feedbackType = ref('error')

function showFeedback(message, type = 'error') {
  feedbackMessage.value = message || ''
  feedbackType.value = type
}

function clearFeedback() {
  feedbackMessage.value = ''
}

const isMainActionLoading = computed(
  () =>
    props.joinLoading ||
    participantSaveLoading.value ||
    ownerActionsSaveLoading.value ||
    endMissionLoading.value ||
    props.saveLoading
)
const tab = ref('progress')
const heavyContentReady = ref(false)
const communityRefreshKey = ref(0)

function handleDiaryShared() {
  communityRefreshKey.value += 1
}

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => handleVisibility(value)
})


const userStore = useUserStore()
const watchedStore = useWatchedChallengesStore()
const { applyXpAwardResponse } = useXpAwardFeedback()
const { completeHabitMission, completeQuestMission } = useMissionCompletionFlow()

const currentUserId = computed(() => {
  const id = userStore.userId
  return id != null ? String(id) : null
})

function ensureWatchedStoreLoaded() {
  const userId = currentUserId.value
  if (userId) {
    watchedStore.fetchForUser(userId)
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      ensureWatchedStoreLoaded()
      nextTick(() => {
        heavyContentReady.value = true
      })
      if (props.initialTab) {
        tab.value = props.initialTab
      }
    } else {
      heavyContentReady.value = false
      tab.value = 'progress'
    }
  }
)

watch(
  () => props.initialTab,
  (nextTab) => {
    if (props.modelValue && nextTab) {
      tab.value = nextTab
    }
  }
)

const localCurrentUserCompletedDays = ref([])

const editForm = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  imageUrl: '',
  duration: '',
  customDuration: '',
  frequency: '',
  privacy: 'public',
  actions: [],
  completedDays: [],
  allowComments: true
})

const errors = reactive({
  title: '',
  description: '',
  duration: '',
  customDuration: '',
  frequency: ''
})

const { t, locale } = useI18n()
const { width: displayWidth } = useDisplay()
const isMobileCalendar = computed(() => displayWidth.value < 1200)
const openCalendarTooltipDate = ref(null)
const { getChallengeTypeLabel } = useChallengeType()
const router = useRouter()
const route = useRoute()

function navigateAfterDialogClose() {
  if (route.path.startsWith('/missions/my')) {
    router.replace({ path: '/missions/my', query: route.query })
    return
  }
  if (route.path.startsWith('/missions')) {
    router.replace({ path: '/missions', query: route.query })
    return
  }
  router.replace('/')
}

// Confetti anchored to dialog surface / footer CTA

function getToastAnchor() {
  return mainActionBtnRef.value || footerActionsRef.value || dialogSurfaceRef.value
}

function celebrateReward() {
  setTimeout(() => {
    fireConfettiFromElement(dialogSurfaceRef.value || footerActionsRef.value)
  }, 300)
}

const actionsViewModel = computed({
  get() {
    if (props.challenge?.challengeType !== CHALLENGE_TYPES.RESULT) {
      return []
    }
    return props.isOwner ? editForm.actions : (props.challenge.actions || [])
  },
  set(newActions) {
    
    if (!props.isOwner) return
    
    editForm.actions = newActions && Array.isArray(newActions) 
      ? JSON.parse(JSON.stringify(newActions))
      : []
  }
})


const progressDone = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
    let doneCount = 0
    actions.forEach(action => {
      if (action.checked) doneCount++
      if (action.children && Array.isArray(action.children)) {
        action.children.forEach(child => {
          if (child.checked) doneCount++
        })
      }
    })
    return doneCount
  } else {
    const startDate = props.isOwner ? editForm.startDate : props.challenge.startDate
    if (!startDate) return 0
    
    const start = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    
    if (today < start) return 0
    
    const diffTime = today - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(0, diffDays)
  }
})

const isMissionEnded = computed(() => {
  if (!props.challenge) return false

  return isChallengeEnded({
    endDate: props.isOwner ? editForm.endDate : props.challenge.endDate
  })
})

const isFinished = computed(() => {
  if (!props.challenge) {
    return false
  }

  if (isMissionEnded.value) {
    return true
  }

  if (props.challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    return Boolean(props.challenge.resultMissionEndedAt)
  }

  return false
})

const previousRunId = computed(() => {
  const raw = props.challenge?.extendedFrom
  if (!raw) return null
  const id = raw._id || raw.id || raw
  return id ? String(id) : null
})

function openPreviousRun(runId = previousRunId.value) {
  if (!runId) return
  openMissionDetails({
    challengeId: String(runId),
    initialTab: 'community'
  })
}

const allQuestActionsComplete = computed(() => {
  if (props.challenge?.challengeType !== CHALLENGE_TYPES.RESULT) {
    return false
  }

  const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
  return areActionsCompleted(actions)
})

/** Keep save/end visible for result owners until the mission is formally ended. */
const showProgressFooterActions = computed(() => {
  if (tab.value !== 'progress') return false

  if (props.isOwner && props.challenge?.challengeType === CHALLENGE_TYPES.RESULT) {
    return !isFinished.value
  }

  return !isFinished.value
})

const showEndMissionButton = computed(() =>
  props.isOwner &&
  props.challenge?.challengeType === CHALLENGE_TYPES.RESULT &&
  tab.value === 'progress' &&
  allQuestActionsComplete.value &&
  !isFinished.value
)

const progressTotal = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
    let totalCount = 0
    actions.forEach(action => {
      totalCount++
      if (action.children && Array.isArray(action.children)) {
        totalCount += action.children.length
      }
    })
    return Math.max(1, totalCount)
  } else {
    const startDate = props.isOwner ? editForm.startDate : props.challenge.startDate
    const endDate = props.isOwner ? editForm.endDate : props.challenge.endDate
    const frequency = props.isOwner ? editForm.frequency : props.challenge.frequency

    const total = getScheduledDaysCount(startDate, endDate, frequency)
    return total > 0 ? total : 0
  }
})

const progressPercentage = computed(() => {
  if (progressTotal.value === 0) return 0
  const percentage = Math.round((progressDone.value / progressTotal.value) * 100)
  return Math.min(100, Math.max(0, percentage))
})


const currentParticipant = computed(() => {
  if (!props.challenge?.participants || !currentUserId.value) return null

  return props.challenge.participants.find((participant) => {
    const userId = participant.userId?._id || participant.userId || participant._id
    return userId && userId.toString() === currentUserId.value.toString()
  }) || null
})

const joinedAtKey = computed(() => {
  if (!props.challenge || !currentParticipant.value) return null
  return getParticipantJoinedAtKey(props.challenge, currentParticipant.value)
})

const calendarDays = computed(() => {
  if (!props.challenge || props.challenge.challengeType !== CHALLENGE_TYPES.HABIT) return []
  if (!props.challenge.startDate || !props.challenge.endDate) return []
  
  const start = new Date(props.challenge.startDate)
  const end = new Date(props.challenge.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateInputValue(today)
  
  const completedDays = localCurrentUserCompletedDays.value.length > 0 
    ? localCurrentUserCompletedDays.value 
    : currentUserCompletedDays.value
  
  const days = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  const normalizedCompletedDays = completedDays
    .map((day) => normalizeDateKey(day))
    .filter(Boolean)

  const participant = currentParticipant.value
  const participantJoinedKey = joinedAtKey.value
  const viewerIsLateJoiner = participant ? isLateJoiner(props.challenge, participant) : false

  const frozenDayKeys = (participant?.frozenDays || [])
    .map((day) => normalizeDateKey(day))
    .filter(Boolean)
  const secondChanceDayKeys = (participant?.secondChanceDays || [])
    .map((day) => normalizeDateKey(day))
    .filter(Boolean)
  
  const startForSchedule = new Date(start)
  startForSchedule.setHours(0, 0, 0, 0)

  let dayNumber = 1
  while (current <= end) {
    const dateStr = toDateInputValue(current)
    const completedParticipantsCount = getCompletedParticipantsCountForDay(dateStr)
    const isUserNormalCompleted = normalizedCompletedDays.includes(dateStr)
    const isUserFrozen = frozenDayKeys.includes(dateStr)
    const isUserSecondChance = secondChanceDayKeys.includes(dateStr)
    const isUserCompleted = isUserNormalCompleted || isUserFrozen || isUserSecondChance
    const isToday = dateStr === todayStr
    const isLocked = current > today
    const isPast = current < today

    const diffDaysFromStart = Math.floor((current.getTime() - startForSchedule.getTime()) / (1000 * 60 * 60 * 24))
    const isScheduled =
      props.challenge.frequency !== 'everyOtherDay' ? true : (diffDaysFromStart % 2 === 0)

    const isBeforeJoin = viewerIsLateJoiner && participantJoinedKey && dateStr < participantJoinedKey
    const isJoinMarker = viewerIsLateJoiner && participantJoinedKey && dateStr === participantJoinedKey

    if (isBeforeJoin) {
      current.setDate(current.getDate() + 1)
      continue
    }

    const isMissed =
      !isUserCompleted &&
      !isLocked &&
      isPast &&
      isScheduled &&
      completedParticipantsCount === 0
    
    days.push({
      date: dateStr,
      number: dayNumber,
      isUserCompleted,
      isUserNormalCompleted,
      isUserFrozen,
      isUserSecondChance,
      completedParticipantsCount,
      isToday,
      isLocked,
      isPast,
      isScheduled,
      isMissed,
      isBeforeJoin: false,
      isJoinMarker
    })
    
    current.setDate(current.getDate() + 1)
    dayNumber++
  }
  
  return days
})

const totalDays = computed(() => {
  if (!props.challenge || props.challenge.challengeType !== CHALLENGE_TYPES.HABIT) return 0
  if (currentParticipant.value) {
    return countPersonalScheduledDays(props.challenge, currentParticipant.value)
  }

  return getScheduledDaysCount(
    props.challenge.startDate,
    props.challenge.endDate,
    props.challenge.frequency
  )
})

const daysPassed = computed(() => {
  return calendarDays.value.filter(
    (day) => day.isScheduled !== false && !day.isLocked
  ).length
})

// Calendar days the current user has been on the path: counted from their join
// date (late joiners) or the mission start, inclusive of today, capped at end.
const daysOnPath = computed(() => {
  const challenge = props.challenge
  if (!challenge || challenge.challengeType !== CHALLENGE_TYPES.HABIT) return 0
  if (!challenge.startDate) return 0

  const startKey = joinedAtKey.value || normalizeDateKey(challenge.startDate)
  if (!startKey) return 0

  const start = new Date(`${startKey}T00:00:00`)
  if (Number.isNaN(start.getTime())) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let endBound = today
  if (challenge.endDate) {
    const end = new Date(challenge.endDate)
    end.setHours(0, 0, 0, 0)
    if (!Number.isNaN(end.getTime()) && end < endBound) endBound = end
  }

  if (endBound < start) return 0
  return Math.floor((endBound.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
})

const userCompletedCount = computed(() => {
  if (currentParticipant.value) {
    return countPersonalEffectiveDays(props.challenge, {
      ...currentParticipant.value,
      completedDays: localCurrentUserCompletedDays.value.length > 0
        ? localCurrentUserCompletedDays.value
        : currentUserCompletedDays.value
    })
  }

  return calendarDays.value.filter(
    (day) => day.isScheduled !== false && !day.isLocked && day.isUserCompleted
  ).length
})

const timePassedPercent = computed(() => {
  if (totalDays.value === 0) return 0
  return Math.min(100, Math.max(0, Math.round((daysPassed.value / totalDays.value) * 100)))
})

const completionRatePercent = computed(() => {
  if (daysPassed.value === 0) return 0
  return Math.min(100, Math.max(0, Math.round((userCompletedCount.value / daysPassed.value) * 100)))
})

/** Chip %: completed scheduled days out of total scheduled mission days. */
const overallCompletionPercent = computed(() => {
  if (totalDays.value === 0) return 0
  return Math.min(100, Math.max(0, Math.round((userCompletedCount.value / totalDays.value) * 100)))
})

const userLevel = computed(() => getLevelFromXp(Number(userStore.user?.xp || 0)))

const heroRank = computed(() => {
  const levelInfo = getLevelInfo(userLevel.value)
  return {
    title: t(`profile.ranks.${levelInfo.rankKey}`),
    color: levelInfo.color
  }
})

const paceStatus = computed(() => {
  if (!props.challenge || props.challenge.challengeType !== CHALLENGE_TYPES.HABIT) return null
  if (!props.challenge.startDate) return null

  const start = new Date(props.challenge.startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  if (today < start) return null

  const { key, icon } = getPaceStatus(completionRatePercent.value, timePassedPercent.value)
  return {
    key,
    icon,
    description: t(`challenges.pace.descriptions.${key}`)
  }
})

const showPersonalPace = computed(
  () => !!paceStatus.value && (props.isOwner || isCurrentUserParticipant.value)
)

const currentDayText = computed(() => {
  if (!props.challenge || !props.challenge.startDate) return ''
  const start = new Date(props.challenge.startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)

  if (today < start) return ''

  return t('challenges.completedDaysProgress', {
    done: userCompletedCount.value,
    total: totalDays.value,
    rate: overallCompletionPercent.value
  })
})

const totalParticipantsCount = computed(() => {
  if (!props.challenge?.participants || !Array.isArray(props.challenge.participants)) return 0
  return props.challenge.participants.length
})

const missionStats = computed(() => {
  if (!props.challenge) return []
  
  const stats = []
  
  if (props.challenge.challengeType === CHALLENGE_TYPES.HABIT) {
    
    stats.push({
      label: t('challenges.duration'),
      value: getDurationLabel(props.challenge),
      icon: 'mdi-calendar-range',
      color: 'teal'
    })
    
    stats.push({
      label: t('challenges.frequency'),
      value: props.challenge.frequency ? getFrequencyLabel(props.challenge.frequency) : t('challenges.frequencyOptions.daily'),
      icon: 'mdi-repeat',
      color: 'blue'
    })
    
    stats.push({
      label: t('challenges.participants'),
      value: (props.challenge.participants?.length || 0).toString(),
      icon: 'mdi-account-group',
      color: 'purple'
    })
  } else {
    
    stats.push({
      label: t('challenges.duration'),
      value: getDurationLabel(props.challenge),
      icon: 'mdi-calendar-range',
      color: 'deep-purple'
    })
    
    const actionsCount = props.challenge.actions?.length || 0
    stats.push({
      label: t('challenges.actions'),
      value: actionsCount.toString(),
      icon: 'mdi-check-circle',
      color: 'orange'
    })
    
    stats.push({
      label: t('challenges.participants'),
      value: (props.challenge.participants?.length || 0).toString(),
      icon: 'mdi-account-group',
      color: 'purple'
    })

    const difficulty = props.challenge.difficulty || 'medium'
    stats.push({
      label: t('challenges.difficultyTitle'),
      value: getDifficultyLabel(difficulty),
      icon: 'mdi-flash',
      color: 'amber',
      type: 'difficulty',
      zaps: getDifficultyZapCount(difficulty)
    })

    const rewardTrimmed = (props.challenge.reward || '').trim()
    if (props.isOwner && rewardTrimmed) {
      stats.push({
        type: 'reward',
        label: t('challenges.rewardStatLabel'),
        value: rewardTrimmed
      })
    }
  }
  
  return stats
})

function getDifficultyLabel(value) {
  switch (value) {
    case 'easy':
      return t('challenges.difficultyEasy')
    case 'heroic':
      return t('challenges.difficultyHeroic')
    case 'medium':
    default:
      return t('challenges.difficultyMedium')
  }
}

function getDifficultyZapCount(value) {
  switch (value) {
    case 'easy':
      return 1
    case 'heroic':
      return 3
    case 'medium':
    default:
      return 2
  }
}

function getCellColor(active, total) {
  if (!total || total <= 0) return null
  const percent = active / total
  const opacity = 0.1 + percent * 0.9
  return `rgba(79, 209, 197, ${opacity})`
}

function isDayProtected(day) {
  return isDayProtectedUtil(day)
}

function getDayCellStyle(day) {
  if (day.isLocked || day.isScheduled === false) return undefined
  if (isDayProtected(day)) return undefined
  const total = totalParticipantsCount.value
  if (total <= 0) return undefined
  const bg = getCellColor(day.completedParticipantsCount, total)
  return bg ? { backgroundColor: bg } : undefined
}

function getDayCellTooltip(day) {
  if (day.isJoinMarker) {
    return t('challenges.joinedHere')
  }
  if (day.isBeforeJoin) return ''

  const total = totalParticipantsCount.value
  if (total <= 0 || day.isScheduled === false) return ''
  return t('challenges.calendarDayHeroesActive', {
    active: day.completedParticipantsCount,
    total
  })
}

function getDayClass(day) {
  return buildDayClass(day, {
    isFinished: isFinished.value,
    isCurrentUserParticipant: isCurrentUserParticipant.value
  })
}

function getCompletedParticipantsCountForDay(dateStr) {
  if (!props.challenge?.participants || !Array.isArray(props.challenge.participants)) return 0

  return props.challenge.participants.reduce((count, participant) => {
    const participantUserId = participant?.userId?._id || participant?.userId || participant?._id || participant?.id
    const isCurrentUser =
      participantUserId &&
      currentUserId.value &&
      participantUserId.toString() === currentUserId.value.toString()

    let sourceParticipant = participant
    if (isCurrentUser && localCurrentUserCompletedDays.value.length > 0) {
      sourceParticipant = {
        ...participant,
        completedDays: localCurrentUserCompletedDays.value
      }
    }

    const effectiveDays = getEffectiveCompletedDays(sourceParticipant)
    return effectiveDays.includes(dateStr) ? count + 1 : count
  }, 0)
}

function closeCalendarTooltip() {
  openCalendarTooltipDate.value = null
}

function handleDayCellClick(day) {
  if (isMobileCalendar.value) {
    if (day.isToday) {
      closeCalendarTooltip()
      toggleDay(day)
      return
    }
    if (!getDayCellTooltip(day)) {
      closeCalendarTooltip()
      return
    }
    openCalendarTooltipDate.value =
      openCalendarTooltipDate.value === day.date ? null : day.date
    return
  }
  toggleDay(day)
}

function onCalendarOutsideClick(event) {
  if (!isMobileCalendar.value || !openCalendarTooltipDate.value) return
  if (event.target instanceof Element && event.target.closest('.calendar-grid .day-cell')) {
    return
  }
  closeCalendarTooltip()
}

async function toggleDay(day) {
  if (isFinished.value || !day.isToday || !isCurrentUserParticipant.value || day.isScheduled === false) return
  if (day.isUserFrozen || day.isUserSecondChance || day.isBeforeJoin) return
  
  const completedDays = localCurrentUserCompletedDays.value.length > 0 
    ? [...localCurrentUserCompletedDays.value]
    : [...currentUserCompletedDays.value]
  
  const normalizedCompletedDays = completedDays
    .map((entry) => normalizeDateKey(entry))
    .filter(Boolean)
  
  const dayDateStr = normalizeDateKey(day.date)
  const index = normalizedCompletedDays.findIndex((d) => d === dayDateStr)
  
  if (index > -1) {
    normalizedCompletedDays.splice(index, 1)
    localCurrentUserCompletedDays.value = normalizedCompletedDays.sort()
    return
  }

  normalizedCompletedDays.push(dayDateStr)
  localCurrentUserCompletedDays.value = normalizedCompletedDays.sort()
}


const currentUserCompletedDays = computed(() => {
  if (localCurrentUserCompletedDays.value.length > 0) {
    return localCurrentUserCompletedDays.value
  }
  
  if (!props.challenge || !props.challenge.participants || !currentUserId.value) return []
  
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === currentUserId.value.toString()
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return []
  
  
  const days = participant.completedDays
    .map(normalizeDateKey)
    .filter(Boolean)
    .filter((dateStr) => {
      const date = new Date(`${dateStr}T00:00:00`)
      return !Number.isNaN(date.getTime())
    })
    .sort()
  
  return days
})


const isCurrentUserParticipant = computed(() => {
  if (!props.challenge || !currentUserId.value) return false

  // Keep parity with CommentsComponent / membership helpers: owners are members.
  if (props.isOwner) return true

  if (!Array.isArray(props.challenge.participants)) return false

  return props.challenge.participants.some((participant) => {
    const userId =
      participant.userId?._id
      || participant.userId?.id
      || participant.userId
      || participant._id
      || participant.id
      || participant
    return userId && userId.toString() === currentUserId.value.toString()
  })
})

const inviteProgressStats = computed(() => ({
  overallCompletionPercent: overallCompletionPercent.value,
  progressPercentage: progressPercentage.value,
  totalDays: totalDays.value,
  daysOnPath: daysOnPath.value,
  completedDays: userCompletedCount.value,
  progressDone: progressDone.value,
  progressTotal: progressTotal.value
}))

const {
  inviteDialogOpen,
  inviteUrl,
  inviteCardData,
  openInviteCardDialog
} = useMissionInvite({
  challenge: computed(() => props.challenge),
  isOwner: computed(() => props.isOwner),
  isParticipant: isCurrentUserParticipant,
  progressStats: inviteProgressStats
})

function openInviteFromTriumph() {
  questShareCardOpen.value = false
  openInviteCardDialog()
}

const {
  watchingId,
  canInviteFriends,
  showJoinActionButton,
  showWatchActionButton,
  isWatched,
  handleWatch,
  handleUnwatch
} = useChallengeDetailsMembership({
  challenge: computed(() => props.challenge),
  isOwner: computed(() => props.isOwner),
  showJoinButton: computed(() => props.showJoinButton),
  currentUserId,
  isFinished,
  isCurrentUserParticipant,
  watchedStore,
  t,
  onClose: () => emit('update:modelValue', false),
  onUpdate: () => emit('update'),
  onError: (msg) => showFeedback(msg)
})

const showLeaveButtonEffective = computed(() => {
  if (!props.challenge || !currentUserId.value) return false
  if (props.isOwner) return false
  if (isFinished.value) return false
  if (props.challenge.challengeType !== CHALLENGE_TYPES.HABIT) return false
  return isCurrentUserParticipant.value
})

const showMainActionButton = computed(() => {
  return showJoinActionButton.value ||
    (isCurrentUserParticipant.value && props.challenge.challengeType === CHALLENGE_TYPES.HABIT && !isFinished.value) ||
    (props.isOwner && props.challenge.challengeType === CHALLENGE_TYPES.RESULT && tab.value === 'progress')
})

const mainActionButtonText = computed(() => {
  if (showJoinActionButton.value) {
    return t('challenges.joinMission')
  }
  if (props.isOwner && props.challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    return t('challenges.update')
  }
  return t('challenges.saveProgress')
})

const MAX_VISIBLE_PARTICIPANTS = 10
const participantUsers = computed(() => {
  if (!props.challenge?.participants || !Array.isArray(props.challenge.participants)) return []

  const uniqueUsers = new Map()

  props.challenge.participants.forEach(participant => {
    const participantUser = participant?.userId && typeof participant.userId === 'object'
      ? participant.userId
      : participant

    const id = participantUser?._id || participantUser?.id || participant?._id || participant?.id
    if (!id || uniqueUsers.has(String(id))) return

    uniqueUsers.set(String(id), {
      id: String(id),
      name: participantUser?.name || participant?.name || '',
      avatarUrl: participantUser?.avatarUrl || participant?.avatarUrl || ''
    })
  })

  return Array.from(uniqueUsers.values())
})

const visibleParticipants = computed(() => participantUsers.value.slice(0, MAX_VISIBLE_PARTICIPANTS))
const remainingParticipantsCount = computed(() =>
  Math.max(0, participantUsers.value.length - MAX_VISIBLE_PARTICIPANTS)
)

function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return String(diffDays)
}

function calculateEndDateFromDuration(startDate, duration) {
  if (!startDate || !duration) return ''
  
  const start = new Date(startDate)
  const days = parseInt(duration)
  
  if (isNaN(days) || days < 1) return ''
  
  const endDate = new Date(start)
  endDate.setDate(endDate.getDate() + days - 1)
  endDate.setHours(0, 0, 0, 0)
  
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const day = String(endDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


onMounted(() => {
  document.addEventListener('click', onCalendarOutsideClick, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onCalendarOutsideClick, true)
})

const syncLocalCompletedDays = (value, oldValue) => {
  const valueId = value?._id || value?.id
  const oldValueId = oldValue?._id || oldValue?.id
  
  if (valueId !== oldValueId) {
    localCurrentUserCompletedDays.value = []
  }
}

const populateEditForm = (value) => {
  if (!value) {
    resetForm()
    return
  }

  editForm.title = value.title || ''
  editForm.description = value.description || ''
  editForm.startDate = normalizeDateKey(value.startDate) || ''
  editForm.endDate = normalizeDateKey(value.endDate) || ''
  editForm.imageUrl = value.imageUrl || ''
  editForm.frequency = value.frequency || ''
  editForm.privacy = value.privacy || 'public'
  editForm.allowComments = value.allowComments !== undefined ? value.allowComments : true
  
  if (value.challengeType === CHALLENGE_TYPES.RESULT) {
    
    editForm.actions = value.actions && Array.isArray(value.actions) && value.actions.length > 0
      ? value.actions.map(a => ({ 
          _id: a._id,
          text: a.text || '', 
          checked: Boolean(a.checked),
          children: (a.children && Array.isArray(a.children))
            ? a.children.map(c => ({ _id: c._id, text: c.text || '', checked: Boolean(c.checked) }))
            : []
        }))
      : []
  } else {
    editForm.actions = []
  }
}

const initializeOwnerHabitDays = (value) => {
  if (value?.challengeType === CHALLENGE_TYPES.HABIT && props.isOwner) {
    if (isInitializing.value) {
      let ownerCompletedDays = []
      
      if (value.participants && currentUserId.value) {
        const ownerParticipant = value.participants.find(p => {
          const userId = p.userId?._id || p.userId || p._id
          return userId && userId.toString() === currentUserId.value.toString()
        })
        
        if (ownerParticipant && ownerParticipant.completedDays && Array.isArray(ownerParticipant.completedDays)) {
          ownerCompletedDays = ownerParticipant.completedDays
        }
      }
      
      if (ownerCompletedDays.length === 0 && value.completedDays && Array.isArray(value.completedDays)) {
        ownerCompletedDays = value.completedDays
      }
      
      editForm.completedDays = ownerCompletedDays
        .filter(d => {
          if (!d) return false
          try {
            const dateStr = String(d).slice(0, 10)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
            const date = new Date(dateStr)
            return !Number.isNaN(date.getTime())
          } catch {
            return false
          }
        })
        .map(d => String(d).slice(0, 10))
        .filter(Boolean)
        .sort()
      
      isInitializing.value = false
    }
  } else {
    editForm.completedDays = []
    isInitializing.value = false
  }
}

const handleModelValueChange = (value) => {
  if (!value) {
    resetForm()
    isInitializing.value = true
    localCurrentUserCompletedDays.value = []
    clearFeedback()
  } else {
    isInitializing.value = true
    if (props.challenge?.challengeType === CHALLENGE_TYPES.HABIT && props.challenge?.completedDays) {
      nextTick(() => {
        if (isInitializing.value) {
          editForm.completedDays = Array.isArray(props.challenge.completedDays)
            ? props.challenge.completedDays
                .filter(d => {
                  if (!d) return false
                  try {
                    const dateStr = String(d).slice(0, 10)
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
                    const date = new Date(dateStr)
                    return !Number.isNaN(date.getTime())
                  } catch {
                    return false
                  }
                })
                .map(d => String(d).slice(0, 10))
                .filter(Boolean)
                .sort()
            : []
          isInitializing.value = false
        }
      })
    }
  }
}

watch(
  () => props.challenge,
  (value, oldValue) => {
    syncLocalCompletedDays(value, oldValue)
    
    populateEditForm(value)
    
    if (!value) return

    initializeOwnerHabitDays(value)

    editForm.duration = calculateDuration(editForm.startDate, editForm.endDate)
    
    clearErrors()
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (value, oldValue) => {
    if (value === oldValue) return
    handleModelValueChange(value)
  }
)

watch(
  () => [editForm.duration, editForm.startDate],
  () => {
    if (editForm.duration && editForm.startDate) {
      const newEndDate = calculateEndDateFromDuration(
        editForm.startDate,
        editForm.duration
      )
      if (newEndDate) {
        editForm.endDate = newEndDate
      }
    }
  }
)

watch(
  () => editForm.title,
  (newValue) => {
    if (newValue && newValue.length > 20) {
      editForm.title = newValue.substring(0, 20)
    }
  }
)

function resetForm() {
  editForm.title = ''
  editForm.description = ''
  editForm.startDate = ''
  editForm.endDate = ''
  editForm.imageUrl = ''
  editForm.duration = ''
  editForm.customDuration = ''
  editForm.frequency = ''
  editForm.privacy = 'public'
  editForm.actions = []
  editForm.completedDays = []
  editForm.allowComments = true
  clearErrors()
}

function clearErrors() {
  errors.title = ''
  errors.description = ''
  errors.duration = ''
  errors.frequency = ''
}

function handleVisibility(value) {
  if (!value) closeCalendarTooltip()
  emit('update:modelValue', value)
}

function openEditPage() {
  const challengeId = props.challenge?._id
  if (!challengeId) return
  // Navigate first so /missions deep-link cleanup does not race and cancel edit.
  router.push(`/missions/edit/${challengeId}`).finally(() => {
    handleVisibility(false)
  })
}

function emitJoin() {
  emit('join')
}

function emitLeave() {
  emit('leave')
}

function openLeaveConfirm() {
  leaveConfirmDialog.value = true
}

function confirmLeave() {
  leaveConfirmDialog.value = false
  emitLeave()
}

function handleMainActionClick() {
  if (showJoinActionButton.value) {
    emitJoin()
  } else if (
    props.isOwner &&
    props.challenge?.challengeType === CHALLENGE_TYPES.RESULT
  ) {
    handleOwnerActionsSave()
  } else {
    handleParticipantSave()
  }
}

const challengeActionsRef = ref(null)
const questSuccessOpen = ref(false)
const questSuccessLoading = ref(false)
const questShareCardOpen = ref(false)
const questShareCardData = reactive(createEmptyTriumphSharePayload())
const pendingAction = reactive(createPendingQuestAction())

const canConfirmQuestActions = computed(() =>
  props.isOwner &&
  props.challenge?.challengeType === CHALLENGE_TYPES.RESULT &&
  !isFinished.value
)

function openQuestSuccess(payload) {
  pendingAction.index = payload?.index ?? null
  pendingAction.id = payload?.id ?? null
  pendingAction.text = payload?.text || ''
  questSuccessOpen.value = true
}

async function confirmQuestSuccess(result) {
  if (!props.challenge || pendingAction.id == null) return
  const c = props.challenge
  const actionId = String(pendingAction.id)

  questSuccessLoading.value = true
  try {
    const response = await challengeService.completeQuestAction(c._id, actionId, {
      userId: currentUserId.value,
      mode: result.mode,
      text: result.text,
      imageUrl: result.imageUrl,
      shareToCommunity: result.shareToCommunity
    })

    if (pendingAction.index != null && editForm.actions[pendingAction.index]) {
      editForm.actions[pendingAction.index].checked = true
      const children = editForm.actions[pendingAction.index].children
      if (Array.isArray(children)) {
        children.forEach((child) => { child.checked = true })
      }
    }
    challengeActionsRef.value?.markActionChecked(pendingAction.index)

    const xpGained = applyXpAwardResponse(response, {
      toastAnchor: getToastAnchor()
    })
    window.dispatchEvent(new Event('checklist-updated'))
    if (xpGained > 0) {
      celebrateReward()
    }

    emit('update')

    questSuccessOpen.value = false

    if (result.mode === 'report') {
      assignTriumphSharePayload(
        questShareCardData,
        buildQuestStepPayload({
          challenge: c,
          stepName: pendingAction.text,
          userText: result.text || '',
          userImage: result.imageUrl || '',
          userImageDataUrl: result.imageDataUrl || '',
          userLevel: userLevel.value,
          userRankTitle: heroRank.value.title
        })
      )
      handleVisibility(false)
      await nextTick()
      questShareCardOpen.value = true
    }
  } catch (error) {
    showFeedback(
      error.response?.data?.message
      || error.response?.data?.error
      || error.message
      || t('challenges.questActionError')
    )
  } finally {
    questSuccessLoading.value = false
  }
}

async function handleOwnerActionsSave() {
  if (!props.challenge || !props.isOwner) return
  const c = props.challenge

  const actionsToSave = editForm.actions && Array.isArray(editForm.actions) && editForm.actions.length > 0
    ? JSON.parse(JSON.stringify(editForm.actions))
    : (c.actions ? JSON.parse(JSON.stringify(c.actions)) : [])

  ownerActionsSaveLoading.value = true

  try {
    const response = await challengeService.updateChallengeActions(c._id, actionsToSave)
    const xpGained = applyXpAwardResponse(response, {
      toastAnchor: getToastAnchor()
    })
    window.dispatchEvent(new Event('checklist-updated'))

    if (xpGained > 0) {
      celebrateReward()
    }

    emit('update')
    handleVisibility(false)
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.updateError'))
  } finally {
    ownerActionsSaveLoading.value = false
  }
}

async function handleEndMission() {
  if (!props.challenge || !props.isOwner || !allQuestActionsComplete.value) return

  endMissionLoading.value = true
  try {
    await completeQuestMission(props.challenge, {
      onUpdate: () => emit('update'),
      closeDialog: () => handleVisibility(false)
    })
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.endMissionError'))
  } finally {
    endMissionLoading.value = false
  }
}

function formatDisplayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    return formatter.format(date)
  } catch (err) {
    return date.toLocaleDateString()
  }
}

function getDurationLabel(challenge) {
  if (!challenge.startDate || !challenge.endDate) return ''
  try {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return `${diffDays} ${diffDays === 1 ? t('challenges.day') : t('challenges.days')}`
  } catch {
    return ''
  }
}

function getFrequencyLabel(value) {
  if (!value) return ''
  const frequencyMap = {
    'daily': t('challenges.frequencyOptions.daily'),
    'everyOtherDay': t('challenges.frequencyOptions.everyOtherDay')
  }
  return frequencyMap[value] || value
}

function getOwnerInitial() {
  if (!props.challenge?.owner?.name) return '?'
  return props.challenge.owner.name.charAt(0).toUpperCase()
}

function getParticipantInitial(name) {
  if (!name) return '?'
  return String(name).trim().charAt(0).toUpperCase() || '?'
}

function navigateToOwner() {
  if (!props.challenge?.owner?._id && !props.challenge?.owner) return
  const ownerId = props.challenge.owner._id || props.challenge.owner
  // Navigate first so /missions deep-link cleanup does not race and cancel profile.
  router.push(`/heroes/${ownerId}`).finally(() => {
    handleVisibility(false)
  })
}

function navigateToParticipant(participantId) {
  if (!participantId) return
  // Navigate first so /missions deep-link cleanup does not race and cancel profile.
  router.push(`/heroes/${participantId}`).finally(() => {
    handleVisibility(false)
  })
}


async function handleParticipantSave() {
  if (!props.challenge || !currentUserId.value || !isCurrentUserParticipant.value) {
    return
  }
  
  participantSaveLoading.value = true
  
  try {
    const completedDays = localCurrentUserCompletedDays.value.length > 0 
      ? localCurrentUserCompletedDays.value 
      : currentUserCompletedDays.value

    if (shouldTriggerHabitMissionCompletion(props.challenge, completedDays)) {
      await completeHabitMission(props.challenge, completedDays, {
        onUpdate: () => emit('update'),
        closeDialog: () => {
          handleVisibility(false)
          navigateAfterDialogClose()
        }
      })
      return
    }
    
    const response = await challengeService.updateParticipantCompletedDays(
      props.challenge._id,
      currentUserId.value,
      completedDays
    )

    const xpGained = applyXpAwardResponse(response, {
      toastAnchor: getToastAnchor()
    })

    if (xpGained > 0) {
      celebrateReward()
    }

    emit('update')
    emit('update:modelValue', false)
    navigateAfterDialogClose()
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.endMissionError'))
  } finally {
    participantSaveLoading.value = false
  }
}


const getShareUrl = () => getMissionShareUrl(props.challenge?._id)

const copyLink = async () => {
  const url = getShareUrl()
  try {
    await navigator.clipboard.writeText(url)
    showFeedback(t('challenges.share.linkCopied'), 'success')
  } catch (err) {
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      showFeedback(t('challenges.share.linkCopied'), 'success')
    } catch (e) {
      showFeedback(t('challenges.share.copyFailed'))
    }
    document.body.removeChild(textArea)
  }
}
</script>
