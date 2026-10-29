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
        :can-invite-squad="canAddFromSquad"
        :type-label="getChallengeTypeLabel(challenge.challengeType)"
        :start-label="formatDisplayDate(challenge.startDate)"
        :end-label="formatDisplayDate(challenge.endDate)"
        @edit="openEditPage"
        @invite="openInviteCardDialog"
        @invite-squad="openAddFromSquad"
        @close="handleVisibility(false)"
      />

      <div v-if="showPendingInviteBanner" class="squad-invite-banner">
        <div class="squad-invite-copy">
          <p class="squad-invite-title">{{ t('challenges.squad.pendingBanner') }}</p>
          <p class="squad-invite-text">{{ t('challenges.squad.request') }}</p>
        </div>
        <div class="squad-invite-actions">
          <v-btn
            class="squad-accept-btn text-none"
            size="small"
            :loading="inviteActing === 'accept'"
            :disabled="Boolean(inviteActing)"
            @click="handleAcceptSquadInvite"
          >
            {{ t('challenges.squad.accept') }}
          </v-btn>
          <v-btn
            variant="text"
            class="squad-reject-btn text-none"
            size="small"
            :loading="inviteActing === 'reject'"
            :disabled="Boolean(inviteActing)"
            @click="handleRejectSquadInvite"
          >
            {{ t('challenges.squad.reject') }}
          </v-btn>
        </div>
      </div>

      <v-tabs v-model="tab" grow class="custom-tabs" density="default" height="48">
        <v-tab value="progress">{{ t('challenges.progress') }}</v-tab>
        <v-tab value="details">{{ t('challenges.about') }}</v-tab>
        <v-tab v-if="showCommunityTab" value="community">{{ communityTabLabel }}</v-tab>
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
                  <p class="progress-lead">
                    {{
                      isCurrentUserParticipant
                        ? t('challenges.progressRitualLead')
                        : t('challenges.authorProgress')
                    }}
                  </p>
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
                      <div
                        v-if="!isFinished && currentDayText"
                        class="progress-days-block flex-shrink-0"
                      >
                        <v-chip
                          size="small"
                          variant="outlined"
                          color="#4FD1C5"
                          class="progress-days-chip"
                        >
                          {{ currentDayText }}
                        </v-chip>
                        <v-progress-linear
                          :model-value="overallCompletionPercent"
                          color="#4FD1C5"
                          height="4"
                          rounded
                          class="progress-days-bar"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="heavyContentReady" class="calendar-grid">
                    <div
                      v-for="day in calendarDays"
                      :key="day.date"
                      class="day-cell"
                      :class="[getDayClass(day), { 'is-saving': day.isToday && participantSaveLoading }]"
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
                      <div v-if="day.squadFaces.length" class="day-squad-faces">
                        <v-avatar
                          v-for="face in day.squadFaces"
                          :key="face.id"
                          size="14"
                          class="day-squad-face"
                        >
                          <v-img v-if="face.avatarUrl" :src="face.avatarUrl" cover />
                          <span v-else>{{ getParticipantInitial(face.name) }}</span>
                        </v-avatar>
                      </div>
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

                  <p
                    v-if="showDailyRewardHint"
                    class="daily-reward-hint"
                  >
                    {{ t('challenges.dailyRewardHint', {
                      xp: HABIT_DAY_XP_DISPLAY,
                      sparks: HABIT_DAY_SPARKS_DISPLAY
                    }) }}
                  </p>
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
                  v-if="heavyContentReady"
                  v-model="actionsViewModel"
                  :readonly="!canConfirmQuestActions"
                  hide-add-button
                  hide-item-controls
                  lock-structure
                  :checks-disabled="ownerActionsSaveLoading"
                  @check-change="persistQuestProgress"
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

            <template v-if="aboutDescription">
              <h3 class="section-title mb-3">{{ t('challenges.description') }}</h3>
              <div class="description-text mb-8">{{ aboutDescription }}</div>
            </template>

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

            <div v-if="isSquadRitualChallenge" class="squad-roster mt-4">
              <div class="squad-roster-head">
                <div>
                  <div class="squad-roster-title">{{ t('challenges.squad.title') }}</div>
                  <div class="text-caption opacity-60">
                    {{ t('challenges.squad.members', { count: totalParticipantsCount }) }}
                  </div>
                </div>
                <v-btn
                  v-if="canAddFromSquad"
                  size="small"
                  class="text-none squad-add-btn"
                  :disabled="remainingSquadSlots <= 0"
                  @click="openAddFromSquad"
                >
                  {{ t('challenges.squad.add') }}
                </v-btn>
              </div>

              <div class="squad-member-list">
                <button
                  v-for="member in squadMembers"
                  :key="member.id"
                  type="button"
                  class="squad-member-row"
                  @click="navigateToParticipant(member.id)"
                >
                  <v-avatar size="36" class="participant-avatar">
                    <v-img v-if="member.avatarUrl" :src="member.avatarUrl" cover />
                    <span v-else>{{ getParticipantInitial(member.name) }}</span>
                  </v-avatar>
                  <span class="squad-member-name">{{ member.name || t('challenges.unknownHero') }}</span>
                </button>
              </div>

              <div v-if="isOwner && pendingSquadInvites.length" class="squad-pending">
                <div class="text-caption opacity-60 mb-2">{{ t('challenges.squad.waiting') }}</div>
                <div
                  v-for="invitee in pendingSquadInvites"
                  :key="invitee.id"
                  class="squad-member-row squad-member-row--pending"
                >
                  <v-avatar size="36" class="participant-avatar">
                    <v-img v-if="invitee.avatarUrl" :src="invitee.avatarUrl" cover />
                    <span v-else>{{ getParticipantInitial(invitee.name) }}</span>
                  </v-avatar>
                  <span class="squad-member-name">{{ invitee.name || t('challenges.unknownHero') }}</span>
                  <v-btn
                    variant="text"
                    size="x-small"
                    class="text-none squad-cancel-btn"
                    :loading="cancellingInviteId === invitee.id"
                    :disabled="Boolean(cancellingInviteId)"
                    @click.stop="handleCancelSquadInvite(invitee.id)"
                  >
                    {{ t('challenges.squad.cancel') }}
                  </v-btn>
                </div>
              </div>
            </div>

            <div v-else-if="totalParticipantsCount > 1 && visibleParticipants.length" class="participants-box mt-4">
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

          <v-window-item v-if="showCommunityTab" value="community" eager :transition="false" :reverse-transition="false">
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
                :challenge-id="String(challenge._id)"
                :allow-comments="challenge.allowComments !== false || isSquadRitualChallenge"
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
        </v-window>
      </v-card-text>

      <v-card-actions ref="footerActionsRef" class="modal-footer px-6 py-4">
        <div class="footer-left d-flex align-center ga-2">
          <v-btn v-if="showLeaveButtonEffective" color="#ff5252" variant="text" @click="openLeaveConfirm">
            {{ t('challenges.giveUp') }}
          </v-btn>
        </div>

        <v-spacer></v-spacer>

        <div class="footer-actions-wrapper d-flex align-center gap-3">
          <template v-if="showProgressFooterActions">
            <v-btn
              v-if="showWatchActionButton"
              variant="outlined"
              :color="isWatched ? '#4FD1C5' : 'rgba(255,255,255,0.3)'"
              class="rounded-lg action-outline-btn watch-action-btn"
              :loading="watchingId === challenge._id"
              :disabled="watchingId === challenge._id"
              :aria-label="`${isWatched ? t('challenges.unwatch') : t('challenges.watch')}. ${t('challenges.watchersCountLabel', { count: watchersCount })}`"
              @click="isWatched ? handleUnwatch() : handleWatch()"
            >
              <span class="watch-action-btn__count">{{ watchersCount }}</span>
              <span class="watch-action-btn__sep" aria-hidden="true">·</span>
              <v-icon size="18">{{ isWatched ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              <span class="watch-action-btn__label">{{ isWatched ? t('challenges.unwatch') : t('challenges.watch') }}</span>
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
          </template>
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

      <v-dialog v-model="addFromSquadOpen" max-width="480">
        <v-card class="add-squad-card">
          <v-card-title class="text-h6 font-weight-bold">
            {{ t('challenges.squad.add') }}
          </v-card-title>
          <v-card-text>
            <SquadInvitePicker
              v-if="addFromSquadOpen"
              v-model="addFromSquadIds"
              :exclude-ids="squadExcludeIds"
              :max-count="remainingSquadSlots"
            />
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn variant="text" class="text-none" @click="addFromSquadOpen = false">
              {{ t('common.cancel') }}
            </v-btn>
            <v-btn
              class="text-none squad-add-btn"
              :loading="addingFromSquad"
              :disabled="addFromSquadIds.length === 0 || addingFromSquad"
              @click="submitAddFromSquad"
            >
              {{ t('challenges.squad.invite') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
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
.day-cell.is-saving {
  pointer-events: none;
  opacity: 0.8;
}
.day-squad-faces {
  position: absolute;
  left: 3px;
  bottom: 3px;
  display: flex;
  z-index: 1;
}
.day-squad-face {
  width: 14px !important;
  height: 14px !important;
  font-size: 7px;
  font-weight: 700;
  margin-left: -4px;
  border: 1px solid #0b0d12;
  background: #1e293b;
}
.day-squad-face:first-child {
  margin-left: 0;
}
.guest-progress-copy {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
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

.squad-invite-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: 12px 16px 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(112, 72, 232, 0.12);
  border: 1px solid rgba(112, 72, 232, 0.35);
}

.squad-invite-title {
  margin: 0;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.squad-invite-text {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: var(--home-text-dim, #94a3b8);
}

.squad-invite-actions {
  display: flex;
  gap: 8px;
}

.squad-accept-btn,
.squad-add-btn {
  color: #0b0d12 !important;
  background: linear-gradient(135deg, #4fd1c5, #7048e8) !important;
  font-weight: 800 !important;
}

.squad-reject-btn,
.squad-cancel-btn {
  color: var(--home-text-dim, #94a3b8) !important;
  font-weight: 700 !important;
}

.squad-roster {
  background: rgba(30, 41, 59, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 14px;
}

.squad-roster-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.squad-roster-title {
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.squad-member-list,
.squad-pending {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.squad-pending {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.squad-member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 4px;
  background: transparent;
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.squad-member-row--pending {
  cursor: default;
}

.squad-member-name {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-squad-card {
  background: #0f131c !important;
  color: var(--home-text, #f1f5f9) !important;
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
.footer-left {
  min-width: 0;
  flex-wrap: wrap;
}
.watch-action-btn {
  gap: 0 !important;
}
.watch-action-btn__count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  opacity: 0.62;
  line-height: 1;
}
.watch-action-btn__sep {
  margin: 0 10px;
  opacity: 0.35;
  font-weight: 400;
  line-height: 1;
}
.watch-action-btn__label {
  margin-inline-start: 8px;
  font-weight: 600;
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
  flex-wrap: wrap;
  justify-content: flex-end;
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

.progress-days-block {
  margin-inline-start: auto;
  min-width: 168px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.progress-days-chip {
  justify-content: center;
}

.progress-days-bar {
  background: rgba(255, 255, 255, 0.08) !important;
}

.daily-reward-hint {
  margin: 16px 0 0;
  font-size: 0.85rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.68);
}

.description-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.day-cell.is-missed:not(.is-completed):not(.protected-day):not(.is-pre-join) {
  background: rgba(255, 82, 82, 0.06) !important;
  border: 1px solid rgba(255, 82, 82, 0.28) !important;
  color: rgba(255, 255, 255, 0.42);
}

.day-cell.is-missed:not(.is-completed):not(.protected-day) .day-number {
  text-decoration: line-through;
  opacity: 0.75;
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

.leave-confirm-card {
  background: #0f172a !important;
  color: #ffffff !important;
  border-radius: 16px !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
}

@media (max-width: 600px) {
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

  .progress-days-block {
    margin-inline-start: 0;
    width: 100%;
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

  .footer-left {
    width: 100%;
    justify-content: space-between;
  }

  .footer-actions-wrapper {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .modal-footer .footer-actions-wrapper > .v-btn {
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
import { useDemoMode } from '../composables/useDemoMode'
import { useDemoMissions } from '../composables/useDemoMissions'
import { isDemoMissionId } from '../constants/demo'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'
import ChallengeActions from './ChallengeActions.vue'
import MissionInviteModal from './mission-invite/MissionInviteModal.vue'
import ChallengeDetailsHeader from './challenge-details/ChallengeDetailsHeader.vue'
import SquadInvitePicker from './challenge-form/SquadInvitePicker.vue'
import CommentsComponent from './CommentsComponent.vue'
import {challengeService} from '../services/api'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import { useMissionCompletionFlow } from '../composables/useMissionCompletionFlow'
import { useMissionInvite } from '../composables/useMissionInvite'
import { openMissionDetails } from '../utils/openMissionDetails'
import { fireConfettiFromElement } from '../utils/confetti'
import { getPaceStatus } from '../utils/challengePace'
import { isChallengeEnded, areActionsCompleted } from '../utils/challengeStatus'
import { getScheduledDaysCount, normalizeDateKey, toDateInputValue } from '../utils/dateUtils'
import {
  findParticipantForUser,
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
import {
  MAX_SQUAD_GUESTS,
  isSquadRitual,
  isPendingSquadInvite
} from '../utils/challengeMembership'
import { HABIT_DAY_XP_DISPLAY, HABIT_DAY_SPARKS_DISPLAY } from '../constants/rewardDisplay'
import { getLevelFromXp, getLevelInfo } from '../utils/levelSystem'
import { Trophy } from 'lucide-vue-next'
import { useChallengeDetailsMembership } from '../composables/useChallengeDetailsMembership'
import { buildDayClass, isDayProtected as isDayProtectedUtil } from '../composables/useChallengeDetailsCalendar'

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
  joinLoading: {
    type: Boolean,
    default: false
  },
  showJoinButton: {
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
    endMissionLoading.value
)
const tab = ref('progress')
const heavyContentReady = ref(false)

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => handleVisibility(value)
})


const userStore = useUserStore()
const watchedStore = useWatchedChallengesStore()
const { applyXpAwardResponse } = useXpAwardFeedback()
const { completeHabitMission, completeQuestMission } = useMissionCompletionFlow()

const { requireAuthOrPrompt, getEffectiveUserId } = useDemoMode()
const { completeToday: completeDemoToday, updateActions: updateDemoActions } = useDemoMissions()

const currentUserId = computed(() => getEffectiveUserId())
const isDemoChallenge = computed(() => isDemoMissionId(props.challenge?._id))

function ensureWatchedStoreLoaded() {
  const userId = currentUserId.value
  if (userId && !isDemoChallenge.value) {
    watchedStore.fetchForUser(userId)
  }
}

function resolveInitialTab(nextTab) {
  if (nextTab === 'diary') {
    return props.challenge?.allowComments || props.challenge?.inviteOnly
      ? 'community'
      : 'progress'
  }
  if (nextTab === 'community' && !currentUserId.value) {
    return 'progress'
  }
  return nextTab
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
        tab.value = resolveInitialTab(props.initialTab)
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
      tab.value = resolveInitialTab(nextTab)
    }
  }
)

const localCompletedDaysOverride = ref(null)

const editForm = reactive({
  actions: []
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
    const startDate = props.challenge.startDate
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
    endDate: props.challenge.endDate
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

/** Keep Join / Watch / End mission visible on every tab until the mission ends. */
const showProgressFooterActions = computed(() => !isFinished.value)

const showEndMissionButton = computed(() =>
  props.isOwner &&
  props.challenge?.challengeType === CHALLENGE_TYPES.RESULT &&
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
    const startDate = props.challenge.startDate
    const endDate = props.challenge.endDate
    const frequency = props.challenge.frequency

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

const progressParticipant = computed(() => {
  if (currentParticipant.value) return currentParticipant.value
  const challenge = props.challenge
  if (!challenge?.participants?.length) return null
  const ownerId = challenge.owner?._id || challenge.owner?.id || challenge.owner
  return findParticipantForUser(challenge, ownerId) || challenge.participants[0] || null
})

const joinedAtKey = computed(() => {
  if (!props.challenge || !progressParticipant.value) return null
  return getParticipantJoinedAtKey(props.challenge, progressParticipant.value)
})

const calendarDays = computed(() => {
  if (!props.challenge || props.challenge.challengeType !== CHALLENGE_TYPES.HABIT) return []
  if (!props.challenge.startDate || !props.challenge.endDate) return []
  
  const start = new Date(props.challenge.startDate)
  const end = new Date(props.challenge.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toDateInputValue(today)
  
  const completedDays = progressCompletedDays.value
  
  const days = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  const normalizedCompletedDays = completedDays
    .map((day) => normalizeDateKey(day))
    .filter(Boolean)

  const participant = progressParticipant.value
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
      squadFaces: getSquadFacesForDay(dateStr),
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
  if (progressParticipant.value) {
    return countPersonalScheduledDays(props.challenge, progressParticipant.value)
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
  if (progressParticipant.value) {
    return countPersonalEffectiveDays(props.challenge, {
      ...progressParticipant.value,
      completedDays: progressCompletedDays.value
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

const showDailyRewardHint = computed(() => {
  if (!props.challenge || isFinished.value) return false
  if (props.challenge.challengeType !== CHALLENGE_TYPES.HABIT) return false
  return props.isOwner || isCurrentUserParticipant.value
})

const aboutDescription = computed(() => (props.challenge?.description || '').trim())

function hasParticipantsRoster(challenge) {
  if (!challenge) return false
  if (isSquadRitual(challenge)) return true
  return (challenge.participants?.length || 0) > 1
}

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

    if (!hasParticipantsRoster(props.challenge)) {
      stats.push({
        label: t('challenges.participants'),
        value: (props.challenge.participants?.length || 0).toString(),
        icon: 'mdi-account-group',
        color: 'purple'
      })
    }
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
    
    if (!hasParticipantsRoster(props.challenge)) {
      stats.push({
        label: t('challenges.participants'),
        value: (props.challenge.participants?.length || 0).toString(),
        icon: 'mdi-account-group',
        color: 'purple'
      })
    }

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
  if (isDayProtected(day) || day.isMissed) return undefined
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

  const parts = []
  if (isDayProtected(day)) {
    parts.push(t('sparks.rituals.protectedBadge'))
  }

  const total = totalParticipantsCount.value
  if (total > 0 && day.isScheduled !== false) {
    parts.push(t('challenges.calendarDayHeroesActive', {
      active: day.completedParticipantsCount,
      total
    }))
  }
  return parts.join(' · ')
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
    if (isCurrentUser && localCompletedDaysOverride.value) {
      sourceParticipant = {
        ...participant,
        completedDays: localCompletedDaysOverride.value
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
  if (participantSaveLoading.value) return
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
  if (participantSaveLoading.value) return
  if (isFinished.value || !day.isToday || !isCurrentUserParticipant.value || day.isScheduled === false) return
  if (day.isUserFrozen || day.isUserSecondChance || day.isBeforeJoin) return

  const previousDays = [...currentUserCompletedDays.value]
  const normalizedCompletedDays = previousDays
    .map((entry) => normalizeDateKey(entry))
    .filter(Boolean)

  const dayDateStr = normalizeDateKey(day.date)
  const index = normalizedCompletedDays.findIndex((d) => d === dayDateStr)

  if (index > -1) {
    normalizedCompletedDays.splice(index, 1)
  } else {
    normalizedCompletedDays.push(dayDateStr)
  }

  localCompletedDaysOverride.value = normalizedCompletedDays.sort()
  const saved = await handleParticipantSave({ closeAfter: false })
  if (!saved) {
    localCompletedDaysOverride.value = previousDays
  }
}

function getSquadFacesForDay(dateStr) {
  if (!isSquadRitual(props.challenge) || !Array.isArray(props.challenge?.participants)) return []

  const faces = []
  const currentId = currentUserId.value ? String(currentUserId.value) : ''

  props.challenge.participants.forEach((participant) => {
    const user = participant?.userId && typeof participant.userId === 'object'
      ? participant.userId
      : participant
    const id = String(user?._id || user?.id || participant?.userId || '')
    if (!id || (currentId && id === currentId)) return

    const effectiveDays = getEffectiveCompletedDays(participant)
    if (!effectiveDays.includes(dateStr)) return

    faces.push({
      id,
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || ''
    })
  })

  return faces.slice(0, 3)
}


function completedDaysFromParticipant(participant) {
  if (!participant?.completedDays || !Array.isArray(participant.completedDays)) return []

  return participant.completedDays
    .map(normalizeDateKey)
    .filter(Boolean)
    .filter((dateStr) => {
      const date = new Date(`${dateStr}T00:00:00`)
      return !Number.isNaN(date.getTime())
    })
    .sort()
}

const currentUserCompletedDays = computed(() => {
  if (localCompletedDaysOverride.value) {
    return localCompletedDaysOverride.value
  }
  return completedDaysFromParticipant(currentParticipant.value)
})

const progressCompletedDays = computed(() => {
  if (currentParticipant.value) return currentUserCompletedDays.value
  return completedDaysFromParticipant(progressParticipant.value)
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

const {
  watchingId,
  watchersCount,
  syncWatchersCount,
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

watch(
  () => props.challenge?._id,
  () => {
    syncWatchersCount()
  },
  { immediate: true }
)

watch(
  () => props.challenge?.watchersCount,
  () => {
    syncWatchersCount()
  }
)

const showLeaveButtonEffective = computed(() => {
  if (!props.challenge || !currentUserId.value) return false
  if (props.isOwner) return false
  if (isFinished.value) return false
  if (props.challenge.challengeType !== CHALLENGE_TYPES.HABIT) return false
  return isCurrentUserParticipant.value
})

const showMainActionButton = computed(() => showJoinActionButton.value)

const mainActionButtonText = computed(() => t('challenges.joinMission'))

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

const isSquadRitualChallenge = computed(() => isSquadRitual(props.challenge))
const showCommunityTab = computed(() => {
  if (!currentUserId.value || isDemoChallenge.value || !props.challenge) return false
  if (isSquadRitualChallenge.value) return true
  return Boolean(props.challenge.allowComments)
})
const communityTabLabel = computed(() =>
  isSquadRitualChallenge.value ? t('challenges.squad.tabTitle') : t('challenges.community.title')
)
const showPendingInviteBanner = computed(() =>
  isPendingSquadInvite(props.challenge, currentUserId.value) && !isCurrentUserParticipant.value
)
const squadMembers = computed(() => participantUsers.value)
const pendingSquadInvites = computed(() => {
  if (!props.isOwner || !Array.isArray(props.challenge?.invites)) return []
  const memberIds = new Set(squadMembers.value.map((member) => member.id))
  const unique = new Map()
  props.challenge.invites.forEach((row) => {
    const user = row?.userId && typeof row.userId === 'object' ? row.userId : row
    const id = String(user?._id || user?.id || row?.userId || '')
    if (!id || memberIds.has(id) || unique.has(id)) return
    unique.set(id, {
      id,
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || ''
    })
  })
  return Array.from(unique.values())
})
const remainingSquadSlots = computed(() => {
  const ownerId = String(props.challenge?.owner?._id || props.challenge?.owner || '')
  const guestIds = new Set([
    ...squadMembers.value.map((member) => member.id),
    ...pendingSquadInvites.value.map((invitee) => invitee.id)
  ])
  guestIds.delete(ownerId)
  return Math.max(0, MAX_SQUAD_GUESTS - guestIds.size)
})
const canAddFromSquad = computed(() =>
  Boolean(props.isOwner && isSquadRitualChallenge.value && !isFinished.value)
)
const squadExcludeIds = computed(() => [
  ...squadMembers.value.map((member) => member.id),
  ...pendingSquadInvites.value.map((invitee) => invitee.id)
])

const inviteActing = ref('')
const cancellingInviteId = ref('')
const addFromSquadOpen = ref(false)
const addFromSquadIds = ref([])
const addingFromSquad = ref(false)

function openAddFromSquad() {
  if (!requireAuthOrPrompt()) return
  addFromSquadIds.value = []
  addFromSquadOpen.value = true
}

async function submitAddFromSquad() {
  const challengeId = props.challenge?._id
  if (!challengeId || addFromSquadIds.value.length === 0) return
  addingFromSquad.value = true
  try {
    await challengeService.inviteToChallenge(challengeId, addFromSquadIds.value)
    addFromSquadOpen.value = false
    emit('update')
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.squad.inviteError'))
  } finally {
    addingFromSquad.value = false
  }
}

async function handleAcceptSquadInvite() {
  const challengeId = props.challenge?._id
  if (!challengeId) return
  inviteActing.value = 'accept'
  try {
    await challengeService.acceptMissionInvite(challengeId)
    emit('update')
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.squad.actionError'))
  } finally {
    inviteActing.value = ''
  }
}

async function handleRejectSquadInvite() {
  const challengeId = props.challenge?._id
  if (!challengeId) return
  inviteActing.value = 'reject'
  try {
    await challengeService.rejectMissionInvite(challengeId)
    handleVisibility(false)
    emit('update')
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.squad.actionError'))
  } finally {
    inviteActing.value = ''
  }
}

async function handleCancelSquadInvite(userId) {
  const challengeId = props.challenge?._id
  if (!challengeId || !userId) return
  cancellingInviteId.value = userId
  try {
    await challengeService.cancelMissionInvite(challengeId, userId)
    emit('update')
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.squad.actionError'))
  } finally {
    cancellingInviteId.value = ''
  }
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
    localCompletedDaysOverride.value = null
  }
}

function populateQuestActions(value) {
  if (!value || value.challengeType !== CHALLENGE_TYPES.RESULT) {
    editForm.actions = []
    return
  }

  editForm.actions = value.actions && Array.isArray(value.actions) && value.actions.length > 0
    ? value.actions.map((action) => ({
        _id: action._id,
        text: action.text || '',
        checked: Boolean(action.checked),
        children: Array.isArray(action.children)
          ? action.children.map((child) => ({
              _id: child._id,
              text: child.text || '',
              checked: Boolean(child.checked)
            }))
          : []
      }))
    : []
}

function resetForm() {
  editForm.actions = []
}

function handleModelValueChange(value) {
  if (!value) {
    resetForm()
    localCompletedDaysOverride.value = null
    clearFeedback()
  }
}

watch(
  () => props.challenge,
  (value, oldValue) => {
    syncLocalCompletedDays(value, oldValue)
    populateQuestActions(value)
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
  }
}

const canConfirmQuestActions = computed(() =>
  props.isOwner &&
  props.challenge?.challengeType === CHALLENGE_TYPES.RESULT &&
  !isFinished.value
)

const persistQuestQueued = ref(false)

async function persistQuestProgress() {
  if (!canConfirmQuestActions.value) return
  if (ownerActionsSaveLoading.value) {
    persistQuestQueued.value = true
    return
  }
  await nextTick()
  await handleOwnerActionsSave()
  if (persistQuestQueued.value) {
    persistQuestQueued.value = false
    await persistQuestProgress()
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
    if (isDemoChallenge.value) {
      const updated = updateDemoActions(c._id, actionsToSave)
      if (updated) emit('update')
      return
    }

    const response = await challengeService.updateChallengeActions(c._id, actionsToSave)
    const xpGained = applyXpAwardResponse(response, {
      toastAnchor: getToastAnchor()
    })
    window.dispatchEvent(new Event('checklist-updated'))

    if (xpGained > 0) {
      celebrateReward()
    }

    emit('update')
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.updateError'))
    emit('update')
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
  if (!requireAuthOrPrompt()) return
  if (!props.challenge?.owner?._id && !props.challenge?.owner) return
  const ownerId = props.challenge.owner._id || props.challenge.owner
  // Navigate first so /missions deep-link cleanup does not race and cancel profile.
  router.push(`/heroes/${ownerId}`).finally(() => {
    handleVisibility(false)
  })
}

function navigateToParticipant(participantId) {
  if (!participantId) return
  if (!requireAuthOrPrompt()) return
  // Navigate first so /missions deep-link cleanup does not race and cancel profile.
  router.push(`/heroes/${participantId}`).finally(() => {
    handleVisibility(false)
  })
}


async function handleParticipantSave({ closeAfter = false } = {}) {
  if (!props.challenge || !currentUserId.value || !isCurrentUserParticipant.value) {
    return false
  }
  
  participantSaveLoading.value = true
  
  try {
    const completedDays = currentUserCompletedDays.value

    if (isDemoChallenge.value) {
      const updated = completeDemoToday(props.challenge._id)
      if (updated) emit('update')
      if (closeAfter) {
        emit('update:modelValue', false)
        navigateAfterDialogClose()
      }
      return true
    }

    if (shouldTriggerHabitMissionCompletion(props.challenge, completedDays)) {
      await completeHabitMission(props.challenge, completedDays, {
        onUpdate: () => emit('update'),
        closeDialog: () => {
          handleVisibility(false)
          navigateAfterDialogClose()
        }
      })
      return true
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
    if (closeAfter) {
      emit('update:modelValue', false)
      navigateAfterDialogClose()
    }
    return true
  } catch (error) {
    showFeedback(error.response?.data?.message || t('challenges.endMissionError'))
    return false
  } finally {
    participantSaveLoading.value = false
  }
}
</script>
