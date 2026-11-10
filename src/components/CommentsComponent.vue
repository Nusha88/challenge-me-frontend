<template>
  <div class="diary-component" :class="{ 'diary-component--phone': isPhone }">
    <div v-if="commentCount > 0 || previousRunId" class="community-meta">
      <span v-if="commentCount > 0" class="community-count">{{ commentCount }}</span>
      <button
        v-if="previousRunId"
        type="button"
        class="previous-run-link"
        @click="emit('open-previous-run', previousRunId)"
      >
        <v-icon size="16" class="mr-1">mdi-history</v-icon>
        {{ t('challenges.community.viewPreviousRun') }}
      </button>
    </div>

    <div v-if="state.loading" class="feed-status">
      <v-progress-linear indeterminate color="#4FD1C5" height="2" />
    </div>

    <div v-else-if="state.loadError" class="feed-status state-block">
      <p class="state-text">{{ state.loadError }}</p>
      <v-btn variant="text" color="#4FD1C5" class="text-none mt-2" @click="loadComments">
        {{ t('challenges.comments.retry') }}
      </v-btn>
    </div>

    <div v-else-if="feedItems.length === 0 && props.allowComments !== false" class="feed-status state-block">
      <p class="state-text">{{ t('challenges.comments.noComments') }}</p>
    </div>

    <div v-else ref="feedRef" class="comments-feed">
      <p v-if="state.actionError" class="action-error">{{ state.actionError }}</p>
      <div
        v-for="item in feedItems"
        :key="item._id"
        class="comment-block mb-6"
        :class="{ 'comment-highlight': highlightId === item._id }"
        :id="item._id ? `comment-${item._id}` : undefined"
      >
        <div v-if="shouldShowDayLabel(item)" class="tactical-day-label mb-3">
          <span class="label-text">{{ getDayLabel(item) }}</span>
        </div>

        <div class="d-flex align-start">
          <div class="comment-main flex-grow-1">
            <div class="d-flex align-center mb-1">
              <v-avatar size="28" class="comment-avatar mr-2" @click.stop="navigateToUser(item.userId)">
                <v-img v-if="getCommentAvatar(item)" :src="getCommentAvatar(item)" cover></v-img>
                <span v-else>{{ getCommentInitial(item) }}</span>
              </v-avatar>
              <span class="author-name font-weight-bold" @click.stop="navigateToUser(item.userId)">
                {{ getCommentName(item) }}
              </span>
              <span v-if="getParticipantStreak(item.userId?._id || item.userId) > 0" class="streak-indicator ml-2">
                <v-icon size="12" color="#F4A782">mdi-fire</v-icon>
                {{ getParticipantStreak(item.userId?._id || item.userId) }}
              </span>
              <span class="post-time ml-3">{{ formatDate(item.createdAt) }}</span>
              <v-spacer></v-spacer>
              <v-btn
                v-if="canDeleteComment(item)"
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="rgba(255,255,255,0.3)"
                :aria-label="t('challenges.delete')"
                @click="askDelete({ kind: 'comment', comment: item })"
              />
            </div>

            <div class="comment-body pa-3" :class="{ 'comment-body--triumph': item.isTriumph }">
              <div v-if="item.isTriumph" class="comment-triumph-badge mb-2">
                <v-icon size="13" color="#FBBF24" class="mr-1">mdi-trophy</v-icon>
                {{ t('challenges.comments.triumphBadge') }}
              </div>
              <div v-else-if="item.actionTitle" class="comment-action-title mb-2">
                <v-icon size="13" color="#4FD1C5" class="mr-1">mdi-target-variant</v-icon>
                {{ item.actionTitle }}
              </div>
              <p v-if="item.text" class="text-content mb-0">{{ item.text }}</p>
              <button
                v-if="item.imageUrl"
                type="button"
                class="comment-image-btn"
                @click="previewImageUrl = item.imageUrl"
              >
                <v-img :src="item.imageUrl" max-height="350" class="rounded-lg mt-3 border-accent"></v-img>
              </button>

              <div class="d-flex align-center mt-3 comment-actions">
                <ReactionRow
                  :item="item"
                  :current-user-id="currentUserId"
                  @toggle="toggleReaction(item, $event, 'comment')"
                />
                <v-btn
                  v-if="canComment"
                  size="small"
                  variant="text"
                  color="#4FD1C5"
                  class="ml-2 font-weight-bold reply-btn"
                  @click="startReply(item)"
                >
                  {{ t('challenges.comments.reply') }}
                </v-btn>
              </div>
            </div>

            <div v-if="flatReplies(item).length > 0" class="replies-thread mt-3">
              <div
                v-for="reply in flatReplies(item)"
                :key="reply._id"
                class="reply-entry pl-4 mb-3 border-left-tactical"
                :class="{ 'comment-highlight': highlightId === reply._id }"
                :id="replyAnchorId(item, reply)"
              >
                <div class="d-flex align-center mb-1">
                  <v-avatar size="22" class="comment-avatar mr-2" @click.stop="navigateToUser(reply.userId)">
                    <v-img v-if="getCommentAvatar(reply)" :src="getCommentAvatar(reply)" cover></v-img>
                    <span v-else>{{ getCommentInitial(reply) }}</span>
                  </v-avatar>
                  <span class="reply-author text-caption font-weight-bold" @click.stop="navigateToUser(reply.userId)">
                    {{ getReplyName(reply) }}
                  </span>
                  <span class="post-time ml-3">{{ formatDate(reply.createdAt) }}</span>
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="canComment"
                    size="small"
                    variant="text"
                    color="#4FD1C5"
                    class="font-weight-bold reply-btn"
                    @click="startReplyToThread(item, reply)"
                  >
                    {{ t('challenges.comments.reply') }}
                  </v-btn>
                  <v-btn
                    v-if="canDeleteThreadReply(item, reply)"
                    icon="mdi-delete-outline"
                    size="small"
                    variant="text"
                    color="rgba(255,255,255,0.3)"
                    :aria-label="t('challenges.delete')"
                    @click="askDelete({ kind: reply.nestedReplyId ? 'nested' : 'reply', comment: item, reply })"
                  />
                </div>

                <div class="reply-body text-caption opacity-90">
                  <div v-if="reply.text">{{ reply.text }}</div>
                  <button
                    v-if="reply.imageUrl"
                    type="button"
                    class="comment-image-btn"
                    @click="previewImageUrl = reply.imageUrl"
                  >
                    <v-img :src="reply.imageUrl" max-height="260" class="rounded-lg mt-2 border-accent"></v-img>
                  </button>
                  <div class="mt-2">
                    <ReactionRow
                      :item="reply"
                      :current-user-id="currentUserId"
                      @toggle="toggleReaction(
                        reply,
                        $event,
                        reply.nestedReplyId ? 'nestedReply' : 'reply',
                        item._id,
                        reply.threadReplyId
                      )"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="canComment"
      class="add-comment-container"
      :class="isPhone ? 'add-comment-container--docked' : 'mb-8'"
    >
      <p v-if="state.actionError && feedItems.length === 0" class="action-error mb-2">{{ state.actionError }}</p>
      <CommentComposer
        ref="composerRef"
        v-model:text="state.newCommentText"
        v-model:image-url="state.newCommentImageUrl"
        :placeholder="activePlaceholder"
        :loading="composerLoading"
        :reply-name="replyTarget?.name || ''"
        @uploading="state.uploadingImage = $event"
        @cancel-reply="cancelReplyTarget"
        @submit="submitComposer"
      />
    </div>

    <div
      v-else-if="!props.currentUserId && props.allowComments !== false && !props.isFinished"
      class="join-mission-card pa-6 text-center"
      :class="isPhone ? 'join-mission-card--docked' : 'mb-8'"
    >
      <v-icon color="rgba(255,255,255,0.2)" size="48" class="mb-3">mdi-account-lock-outline</v-icon>
      <p class="text-body-2 text-white opacity-70 mb-4">{{ t('challenges.comments.loginPrompt') }}</p>
      <v-btn color="#4FD1C5" variant="outlined" class="rounded-lg" @click="goToLogin">
        {{ t('navigation.login') }}
      </v-btn>
    </div>

    <div
      v-else-if="!isCurrentUserParticipant && props.currentUserId && props.challengeType === CHALLENGE_TYPES.HABIT && props.allowComments !== false"
      class="join-mission-card pa-6 text-center"
      :class="isPhone ? 'join-mission-card--docked' : 'mb-8'"
    >
      <v-icon color="rgba(255,255,255,0.2)" size="48" class="mb-3">mdi-shield-lock-outline</v-icon>
      <p class="text-body-2 text-white opacity-70 mb-4">{{ t('challenges.comments.joinPrompt') }}</p>
      <v-btn color="#4FD1C5" variant="outlined" class="rounded-lg" @click="emitJoin">
        {{ t('challenges.joinMission') }}
      </v-btn>
    </div>

    <div
      v-else-if="props.allowComments === false"
      class="join-mission-card pa-6 text-center"
      :class="isPhone ? 'join-mission-card--docked' : 'mb-8'"
    >
      <p class="text-body-2 text-white opacity-70 mb-0">{{ t('challenges.comments.disabled') }}</p>
    </div>

    <DeleteChallengeDialog
      v-model="deleteDialogOpen"
      :loading="Boolean(state.deletingCommentId || state.deletingReplyId)"
      :error="state.deleteError"
      :title="t('challenges.delete')"
      :message="deleteDialogMessage"
      @confirm="confirmDelete"
    />

    <v-dialog
      :model-value="Boolean(previewImageUrl)"
      max-width="720"
      @update:model-value="onPreviewToggle"
    >
      <v-card class="image-preview-card">
        <v-btn
          icon="mdi-close"
          variant="text"
          class="image-preview-close"
          :aria-label="t('common.close')"
          @click="previewImageUrl = null"
        />
        <v-img v-if="previewImageUrl" :src="previewImageUrl" />
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.diary-component {
  color: #ffffff;
  display: flex;
  flex-direction: column;
}

.diary-component:not(.diary-component--phone) .add-comment-container,
.diary-component:not(.diary-component--phone) .join-mission-card {
  order: 1;
}

.diary-component:not(.diary-component--phone) .comments-feed,
.diary-component:not(.diary-component--phone) .feed-status {
  order: 2;
}

.diary-component--phone {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.diary-component--phone .community-meta {
  order: 0;
  flex-shrink: 0;
}

.diary-component--phone .comments-feed,
.diary-component--phone .feed-status {
  order: 1;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 12px;
}

.diary-component--phone .add-comment-container--docked,
.diary-component--phone .join-mission-card--docked {
  order: 2;
  position: sticky;
  bottom: 0;
  z-index: 3;
  flex-shrink: 0;
  margin-top: auto;
  background: var(--home-bg, #0b0d12);
  border-top: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.diary-component--phone .add-comment-container--docked {
  padding-top: 10px;
  padding-bottom: var(--safe-bottom, 0px);
}

.diary-component--phone .join-mission-card--docked {
  margin-bottom: 0;
  padding-bottom: calc(24px + var(--safe-bottom, 0px));
}

.community-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.community-count {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--home-teal, #4fd1c5);
}

.feed-status {
  min-height: 48px;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

.state-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--home-text-dim, #94a3b8);
}

.action-error {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #f87171;
}

.comment-body {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border-left: 3px solid rgba(79, 209, 197, 0.4);
}

.comment-body--triumph {
  border-left-color: rgba(251, 191, 36, 0.5);
  background: rgba(245, 158, 11, 0.06);
}

.comment-triumph-badge,
.comment-action-title {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 8px;
  padding: 3px 10px;
}

.comment-triumph-badge {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.35);
}

.comment-action-title {
  color: #4FD1C5;
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.25);
}

.author-name,
.reply-author {
  color: #4FD1C5;
  font-size: 0.9rem;
  cursor: pointer;
}

.comment-avatar {
  border: 1px solid rgba(79, 209, 197, 0.45);
  background: var(--home-surface-hi, rgba(30, 38, 56, 0.9));
  color: #FFFFFF;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.post-time {
  font-size: 0.7rem;
  opacity: 0.4;
  font-family: 'Montserrat', sans-serif;
}

.text-content {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.comment-image-btn {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: zoom-in;
  text-align: left;
}

.comment-actions {
  flex-wrap: wrap;
  gap: 8px;
}

.reply-btn {
  min-height: 36px;
}

.comment-highlight {
  background-color: rgba(79, 209, 197, 0.15);
  border-radius: 12px;
  transition: background-color 0.4s ease;
}

.border-left-tactical {
  border-left: 1px solid rgba(79, 209, 197, 0.3);
}

.tactical-day-label {
  display: inline-block;
  background: linear-gradient(90deg, #4FD1C5 0%, transparent 100%);
  padding: 2px 12px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.streak-indicator {
  background: rgba(244, 167, 130, 0.15);
  color: #F4A782;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
}

.join-mission-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.45));
  border: 2px dashed rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.previous-run-link {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--home-teal, #4FD1C5);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.previous-run-link:hover {
  opacity: 0.85;
  text-decoration: underline;
}

.border-accent {
  border: 1px solid rgba(79, 209, 197, 0.2);
}

.image-preview-card {
  background: #0b0d12 !important;
  position: relative;
}

.image-preview-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  color: #f1f5f9 !important;
}
</style>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { challengeService } from '../services/api'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import { useI18n } from 'vue-i18n'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { getEffectiveCompletedDays } from '../utils/participantDays'
import { resolveStreak } from '../utils/streakUtils'
import CommentComposer from './CommentComposer.vue'
import DeleteChallengeDialog from './challenge-form/DeleteChallengeDialog.vue'
import ReactionRow from './comments/ReactionRow.vue'

const router = useRouter()
const { smAndDown } = useDisplay()
const isPhone = smAndDown
const { applyRewardResponse } = useXpAwardFeedback()

const props = defineProps({
  challengeId: {
    type: String,
    required: true
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  currentUserId: {
    type: String,
    default: null
  },
  isOwner: {
    type: Boolean,
    default: false
  },
  isFinished: {
    type: Boolean,
    default: false
  },
  challengeStartDate: {
    type: String,
    default: null
  },
  challengeEndDate: {
    type: String,
    default: null
  },
  challengeType: {
    type: String,
    default: CHALLENGE_TYPES.HABIT
  },
  challengeOwner: {
    type: [Object, String],
    default: null
  },
  challengeParticipants: {
    type: Array,
    default: () => []
  },
  previousRunId: {
    type: String,
    default: null
  },
  scrollTarget: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['comment-added', 'comment-deleted', 'user-navigated', 'join', 'open-previous-run'])

const { t, locale } = useI18n()

const commentPlaceholder = computed(() => {
  if (!isCurrentUserParticipant.value) {
    return t('challenges.comments.placeholder5')
  }
  const placeholders = [
    t('challenges.comments.placeholder1'),
    t('challenges.comments.placeholder2'),
    t('challenges.comments.placeholder3'),
    t('challenges.comments.placeholder4'),
    t('challenges.comments.placeholder5')
  ]
  return placeholders[state.selectedPlaceholderIndex]
})

const activePlaceholder = computed(() => {
  if (replyTarget.value?.name) {
    return t('challenges.comments.replyPlaceholder', { name: replyTarget.value.name })
  }
  return commentPlaceholder.value
})

function getParticipantStreak(userId) {
  if (!userId || !props.challengeParticipants || props.challengeType !== CHALLENGE_TYPES.HABIT) return 0

  const participant = props.challengeParticipants.find((p) => {
    const pUserId = p.userId?._id || p.userId || p._id
    return pUserId && pUserId.toString() === userId.toString()
  })

  if (!participant) return 0
  return resolveStreak(new Set(getEffectiveCompletedDays(participant))).days
}

const feedItems = computed(() => {
  return [...state.comments].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })
})

const commentCount = computed(() => {
  return state.comments.reduce((total, comment) => {
    const replies = (comment.replies || []).reduce(
      (sum, reply) => sum + 1 + (reply.replies?.length || 0),
      0
    )
    return total + 1 + replies
  }, 0)
})

const state = reactive({
  comments: [],
  loading: false,
  loadError: '',
  actionError: '',
  deleteError: '',
  addingComment: false,
  deletingCommentId: null,
  deletingReplyId: null,
  newCommentText: '',
  newCommentImageUrl: null,
  uploadingImage: false,
  reactingId: null,
  selectedPlaceholderIndex: Math.floor(Math.random() * 5)
})

const composerRef = ref(null)
const feedRef = ref(null)
const replyTarget = ref(null)
const highlightId = ref(null)
const previewImageUrl = ref(null)
const deleteDialogOpen = ref(false)
const pendingDelete = ref(null)

const composerLoading = computed(() => (
  state.addingComment || state.uploadingImage
))

const deleteDialogMessage = computed(() => {
  if (pendingDelete.value?.kind === 'comment') return t('challenges.comments.deleteConfirm')
  return t('challenges.comments.deleteReplyConfirm')
})

function flatReplies(comment) {
  const list = []
  for (const reply of comment.replies || []) {
    list.push({
      ...reply,
      threadReplyId: reply._id,
      nestedReplyId: null
    })
    for (const nested of reply.replies || []) {
      list.push({
        ...nested,
        threadReplyId: reply._id,
        nestedReplyId: nested._id
      })
    }
  }
  return list
}

function replyAnchorId(comment, reply) {
  if (reply.nestedReplyId) {
    return `comment-${comment._id}-${reply.threadReplyId}-${reply.nestedReplyId}`
  }
  return `comment-${comment._id}-${reply._id}`
}

async function loadComments() {
  if (!props.challengeId || props.allowComments === false) return

  state.loading = true
  state.loadError = ''
  try {
    const { data } = await challengeService.getComments(props.challengeId)
    state.comments = data.comments || []
  } catch (error) {
    console.error('Error loading comments:', error)
    state.comments = []
    state.loadError = t('challenges.comments.loadError')
  } finally {
    state.loading = false
  }
}

function cancelReplyTarget() {
  replyTarget.value = null
}

async function startReply(comment) {
  replyTarget.value = {
    commentId: comment._id,
    threadReplyId: null,
    mentionedUserId: comment.userId?._id || comment.userId,
    name: getCommentName(comment)
  }
  await composerRef.value?.focus?.()
}

async function startReplyToThread(comment, reply) {
  replyTarget.value = {
    commentId: comment._id,
    threadReplyId: reply.threadReplyId,
    mentionedUserId: reply.userId?._id || reply.userId,
    name: getReplyName(reply)
  }
  await composerRef.value?.focus?.()
}

async function submitComposer() {
  if (replyTarget.value) {
    await submitReplyFromComposer()
    return
  }
  await addComment()
}

async function addComment() {
  if ((!state.newCommentText.trim() && !state.newCommentImageUrl) || !props.currentUserId || state.addingComment) return

  if (state.uploadingImage && !state.newCommentImageUrl) {
    state.actionError = t('challenges.uploadInProgress')
    return
  }

  state.addingComment = true
  state.actionError = ''
  try {
    const commentText = state.newCommentText.trim() || (state.newCommentImageUrl ? ' ' : '')
    const imageUrl = state.newCommentImageUrl ? String(state.newCommentImageUrl).trim() : null

    const response = await challengeService.addComment(
      props.challengeId,
      props.currentUserId,
      commentText,
      imageUrl
    )
    applyRewardResponse(response)
    const { data } = response
    state.newCommentText = ''
    state.newCommentImageUrl = null
    composerRef.value?.reset()
    await loadComments()
    emit('comment-added', data.comment)
    const newId = data.comment?._id
    if (newId) scrollToComment(String(newId))
  } catch (error) {
    console.error('Error adding comment:', error)
    state.actionError = t('challenges.comments.addError')
  } finally {
    state.addingComment = false
  }
}

async function submitReplyFromComposer() {
  const target = replyTarget.value
  if (!target || !props.currentUserId || state.addingComment) return
  if (!state.newCommentText.trim() && !state.newCommentImageUrl) return

  if (state.uploadingImage && !state.newCommentImageUrl) {
    state.actionError = t('challenges.uploadInProgress')
    return
  }

  state.addingComment = true
  state.actionError = ''
  const mentioned = target.mentionedUserId
    && String(target.mentionedUserId) !== String(props.currentUserId)
    ? target.mentionedUserId
    : null
  const replyText = state.newCommentText.trim() || (state.newCommentImageUrl ? ' ' : '')
  const imageUrl = state.newCommentImageUrl ? String(state.newCommentImageUrl).trim() : null

  try {
    let response
    if (target.threadReplyId) {
      response = await challengeService.replyToReply(
        props.challengeId,
        target.commentId,
        target.threadReplyId,
        props.currentUserId,
        replyText,
        mentioned,
        imageUrl
      )
    } else {
      response = await challengeService.replyToComment(
        props.challengeId,
        target.commentId,
        props.currentUserId,
        replyText,
        mentioned,
        imageUrl
      )
    }
    applyRewardResponse(response)
    const newReplyId = response?.data?.reply?._id
    state.newCommentText = ''
    state.newCommentImageUrl = null
    composerRef.value?.reset()
    cancelReplyTarget()
    await loadComments()
    if (newReplyId) {
      scrollToComment(String(target.commentId), String(target.threadReplyId || newReplyId), target.threadReplyId ? String(newReplyId) : null)
    }
  } catch (error) {
    console.error('Error adding reply:', error)
    state.actionError = t('challenges.comments.replyError')
  } finally {
    state.addingComment = false
  }
}

function askDelete(payload) {
  pendingDelete.value = payload
  state.deleteError = ''
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  const pending = pendingDelete.value
  if (!pending) return
  try {
    if (pending.kind === 'comment') {
      await deleteComment(pending.comment)
    } else if (pending.kind === 'nested') {
      await deleteNestedReply(pending.comment, pending.reply)
    } else {
      await deleteReply(pending.comment, pending.reply)
    }
    deleteDialogOpen.value = false
    pendingDelete.value = null
  } catch (error) {
    state.deleteError = pending.kind === 'comment'
      ? t('challenges.comments.deleteError')
      : t('challenges.comments.deleteReplyError')
  }
}

async function deleteComment(comment) {
  state.deletingCommentId = comment._id
  try {
    await challengeService.deleteComment(props.challengeId, comment._id, props.currentUserId)
    await loadComments()
    emit('comment-deleted', comment._id)
  } finally {
    state.deletingCommentId = null
  }
}

function getCommentName(comment) {
  return comment.userId?.name || t('common.unknown')
}

function getCommentAvatar(comment) {
  return comment.userId?.avatarUrl || ''
}

function getCommentInitial(comment) {
  const name = comment.userId?.name
  if (!name) return '?'
  return String(name).trim().charAt(0).toUpperCase() || '?'
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  try {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('challenges.comments.justNow')
    if (diffMins < 60) return t('challenges.comments.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('challenges.comments.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('challenges.comments.daysAgo', { count: diffDays })

    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(date)
  } catch (err) {
    return date.toLocaleDateString()
  }
}

const isCurrentUserParticipant = computed(() => {
  if (!props.currentUserId || !props.challengeParticipants || !Array.isArray(props.challengeParticipants)) {
    return false
  }

  const currentUserIdStr = props.currentUserId.toString()

  if (props.challengeOwner) {
    const ownerId = props.challengeOwner._id || props.challengeOwner.id || props.challengeOwner
    if (ownerId && ownerId.toString() === currentUserIdStr) {
      return true
    }
  }

  return props.challengeParticipants.some((participant) => {
    const userId = participant.userId?._id
      || participant.userId?.id
      || participant.userId
      || participant._id
      || participant.id
      || participant
    return userId && userId.toString() === currentUserIdStr
  })
})

const canComment = computed(() => {
  if (props.allowComments === false || !props.currentUserId || props.isFinished) {
    return false
  }
  if (props.challengeType === CHALLENGE_TYPES.RESULT) {
    return true
  }
  return isCurrentUserParticipant.value
})

function canDeleteComment(comment) {
  if (!props.currentUserId) return false
  const commentUserId = comment.userId?._id || comment.userId
  return props.isOwner || (commentUserId && commentUserId.toString() === props.currentUserId.toString())
}

function canDeleteReply(comment, reply) {
  if (!props.currentUserId || !comment || !reply) return false
  const commentUserId = comment.userId?._id || comment.userId
  const replyUserId = reply.userId?._id || reply.userId
  const currentUserId = props.currentUserId.toString()
  return (
    props.isOwner ||
    (commentUserId && commentUserId.toString() === currentUserId) ||
    (replyUserId && replyUserId.toString() === currentUserId)
  )
}

function canDeleteNestedReply(nestedReply) {
  if (!props.currentUserId || !nestedReply) return false
  const nestedReplyUserId = nestedReply.userId?._id || nestedReply.userId
  return props.isOwner || (nestedReplyUserId && nestedReplyUserId.toString() === props.currentUserId.toString())
}

function canDeleteThreadReply(comment, reply) {
  if (reply.nestedReplyId) return canDeleteNestedReply(reply)
  return canDeleteReply(comment, reply)
}

function isCommentAuthorOwnerOrParticipant(comment) {
  if (!comment || !comment.userId) return false

  const commentUserId = comment.userId._id || comment.userId

  if (props.challengeOwner) {
    const ownerId = props.challengeOwner._id || props.challengeOwner
    if (ownerId && ownerId.toString() === commentUserId.toString()) {
      return true
    }
  }

  if (props.challengeParticipants && Array.isArray(props.challengeParticipants)) {
    return props.challengeParticipants.some((participant) => {
      const userId = participant.userId?._id || participant.userId || participant._id || participant
      return userId && userId.toString() === commentUserId.toString()
    })
  }

  return false
}

function calculateDayNumber(commentDate) {
  if (!props.challengeStartDate || !commentDate) return null

  try {
    const startDate = new Date(props.challengeStartDate)
    const commentDateObj = new Date(commentDate)

    startDate.setHours(0, 0, 0, 0)
    commentDateObj.setHours(0, 0, 0, 0)

    const diffTime = commentDateObj - startDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const dayNumber = diffDays + 1
    if (dayNumber < 1) return null
    return dayNumber
  } catch (error) {
    return null
  }
}

function getDayLabel(comment) {
  const dayNumber = calculateDayNumber(comment.createdAt)
  if (dayNumber === null) return ''
  return t('challenges.comments.dayLabel', { n: dayNumber })
}

function shouldShowDayLabel(comment) {
  return isCommentAuthorOwnerOrParticipant(comment) && calculateDayNumber(comment.createdAt) !== null
}

async function deleteReply(comment, reply) {
  if (!comment?._id || !reply?._id) return
  state.deletingReplyId = reply._id
  try {
    await challengeService.deleteReply(props.challengeId, comment._id, reply._id, props.currentUserId)
    await loadComments()
  } finally {
    state.deletingReplyId = null
  }
}

async function deleteNestedReply(comment, reply) {
  if (!comment?._id || !reply?.threadReplyId || !reply?._id) return
  state.deletingReplyId = reply._id
  try {
    await challengeService.deleteNestedReply(
      props.challengeId,
      comment._id,
      reply.threadReplyId,
      reply._id,
      props.currentUserId
    )
    await loadComments()
  } finally {
    state.deletingReplyId = null
  }
}

function getReplyName(reply) {
  return reply.userId?.name || t('common.unknown')
}

function navigateToUser(userId) {
  if (!userId) return
  const id = userId._id || userId
  if (!id) return
  emit('user-navigated')
  router.push(`/heroes/${id}`)
}

function goToLogin() {
  emit('user-navigated')
  router.push('/login')
}

function emitJoin() {
  emit('join')
}

function onPreviewToggle(open) {
  if (!open) previewImageUrl.value = null
}

async function toggleReaction(item, emoji, type = 'comment', commentId = null, replyId = null) {
  if (!props.currentUserId || state.reactingId) return

  const itemId = item._id
  const reactions = item.reactions || {}
  const reactionsObj = reactions instanceof Map
    ? Object.fromEntries(reactions)
    : (reactions || {})

  const emojiReactions = reactionsObj[emoji] || []
  const userIdStr = props.currentUserId.toString()
  const hasReacted = emojiReactions.some((r) => {
    const rUserId = r.userId?._id || r.userId
    return rUserId && rUserId.toString() === userIdStr
  })

  if (!reactionsObj[emoji]) reactionsObj[emoji] = []

  if (hasReacted) {
    reactionsObj[emoji] = emojiReactions.filter((r) => {
      const rUserId = r.userId?._id || r.userId
      return !rUserId || rUserId.toString() !== userIdStr
    })
    if (reactionsObj[emoji].length === 0) delete reactionsObj[emoji]
  } else {
    reactionsObj[emoji].push({ userId: props.currentUserId })
  }

  item.reactions = reactionsObj
  state.reactingId = itemId

  try {
    await challengeService.addReaction(
      props.challengeId,
      commentId || itemId,
      emoji,
      props.currentUserId,
      replyId || null,
      type === 'nestedReply' ? itemId : null
    )
    await loadComments()
  } catch (error) {
    console.error('Error toggling reaction:', error)
  } finally {
    state.reactingId = null
  }
}

function findCommentElement(commentId, replyId, nestedReplyId) {
  if (nestedReplyId && replyId) {
    const nested = document.getElementById(`comment-${commentId}-${replyId}-${nestedReplyId}`)
    if (nested) return nested
  }
  if (replyId) {
    const reply = document.getElementById(`comment-${commentId}-${replyId}`)
    if (reply) return reply
    const nestedMatch = document.querySelector(`[id^="comment-${commentId}-"][id$="-${replyId}"]`)
    if (nestedMatch) return nestedMatch
  }
  return document.getElementById(`comment-${commentId}`)
}

function scrollToComment(commentId, replyId, nestedReplyId) {
  if (!commentId) return

  const tryScroll = () => {
    const element = findCommentElement(commentId, replyId, nestedReplyId)
    if (!element) return false

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const id = nestedReplyId || replyId || commentId
    highlightId.value = String(id)
    setTimeout(() => {
      if (highlightId.value === String(id)) highlightId.value = null
    }, 2000)
    return true
  }

  nextTick(() => {
    if (tryScroll()) return
    requestAnimationFrame(() => {
      tryScroll()
    })
  })
}

function resolveScrollTargetFromHash() {
  const hash = router.currentRoute.value.hash?.replace('#', '') || ''
  if (!hash.startsWith('comment-')) return null

  const parts = hash.split('-')
  if (parts.length < 2) return null

  return {
    commentId: parts[1],
    replyId: parts.length >= 3 ? parts[2] : null,
    nestedReplyId: parts.length >= 4 ? parts[3] : null
  }
}

function getActiveScrollTarget() {
  if (props.scrollTarget?.commentId) {
    return props.scrollTarget
  }
  return resolveScrollTargetFromHash()
}

function maybeScrollToTarget() {
  const target = getActiveScrollTarget()
  if (!target?.commentId || state.comments.length === 0) return
  scrollToComment(target.commentId, target.replyId, target.nestedReplyId)
}

watch(() => props.challengeId, () => {
  loadComments()
})

watch(() => props.allowComments, () => {
  if (props.allowComments !== false) {
    loadComments()
  } else {
    state.comments = []
  }
})

watch(
  () => props.scrollTarget,
  () => {
    maybeScrollToTarget()
  },
  { deep: true }
)

watch(
  () => state.comments.length,
  (length) => {
    if (length > 0) {
      maybeScrollToTarget()
    }
  }
)

onMounted(() => {
  if (props.allowComments !== false) {
    loadComments()
  }
})
</script>
