<template>
  <div class="comments-component">
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-comment-multiple-outline</v-icon>
        {{ t('challenges.comments.title') }}
        <v-chip v-if="comments.length > 0" size="small" class="ml-2">{{ comments.length }}</v-chip>
      </v-card-title>
      
      <v-card-text>
        <!-- Add comment form -->
        <div v-if="canComment" class="add-comment-section mb-4">
          <v-textarea
            v-model="newCommentText"
            :label="t('challenges.comments.addComment')"
            variant="outlined"
            :rows="mobile ? 2 : 3"
            :maxlength="1000"
            counter
            :disabled="addingComment"
            :density="mobile ? 'compact' : 'default'"
            @keydown.ctrl.enter="addComment"
            @keydown.meta.enter="addComment"
          ></v-textarea>
          <div class="d-flex justify-end mt-2">
            <v-btn
              color="primary"
              size="small"
              :loading="addingComment"
              :disabled="!newCommentText.trim()"
              @click="addComment"
            >
              {{ t('challenges.comments.post') }}
            </v-btn>
          </div>
        </div>

        <!-- Comments disabled message -->
        <v-alert v-if="allowComments === false" type="info" variant="tonal" class="mb-4">
          {{ t('challenges.comments.disabled') }}
        </v-alert>

        <!-- Comments list -->
        <div v-if="comments.length > 0" class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment._id || comment.createdAt"
            :id="`comment-${comment._id}`"
            class="comment-item mb-3"
          >
            <div class="d-flex align-start">
              <div class="comment-avatar" :class="mobile ? 'mr-2' : 'mr-3'">
                <img
                  v-if="getCommentAvatar(comment)"
                  :src="getCommentAvatar(comment)"
                  :alt="getCommentName(comment)"
                  class="avatar-img"
                />
                <div v-else class="avatar-placeholder">
                  {{ getCommentInitial(comment) }}
                </div>
              </div>
              <div class="comment-content flex-grow-1">
                <div class="comment-header mb-1" :class="mobile ? 'flex-column align-start' : ''">
                  <div class="d-flex align-center" style="width: 100%;">
                    <span class="comment-author font-weight-medium">{{ getCommentName(comment) }}</span>
                    <span class="comment-date text-caption text-medium-emphasis" :class="mobile ? 'ml-2' : 'ml-2'">
                      {{ formatDate(comment.createdAt) }}
                    </span>
                    <v-btn
                      v-if="canDeleteComment(comment)"
                      icon="mdi-delete-outline"
                      size="x-small"
                      variant="text"
                      color="error"
                      class="ml-auto"
                      @click="deleteComment(comment)"
                    ></v-btn>
                  </div>
                </div>
                <div class="comment-text">{{ comment.text }}</div>
                
                <!-- Reply button -->
                <div v-if="canComment" class="mt-2">
                  <v-btn
                    v-if="replyingToCommentId !== comment._id"
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="startReply(comment)"
                  >
                    {{ t('challenges.comments.reply') }}
                  </v-btn>
                  
                  <!-- Reply input -->
                  <div v-else class="reply-input-section mt-2">
                    <v-textarea
                      v-model="replyTexts[comment._id]"
                      :label="t('challenges.comments.replyPlaceholder', { name: getCommentName(comment) })"
                      variant="outlined"
                      rows="2"
                      :maxlength="1000"
                      counter
                      :disabled="replyingCommentId === comment._id"
                      density="compact"
                      @keydown.ctrl.enter="submitReply(comment)"
                      @keydown.meta.enter="submitReply(comment)"
                    ></v-textarea>
                    <div class="d-flex justify-end gap-2 mt-2">
                      <v-btn
                        size="small"
                        variant="text"
                        @click="cancelReply(comment._id)"
                      >
                        {{ t('common.cancel') }}
                      </v-btn>
                      <v-btn
                        size="small"
                        color="primary"
                        :loading="replyingCommentId === comment._id"
                        :disabled="!replyTexts[comment._id]?.trim()"
                        @click="submitReply(comment)"
                      >
                        {{ t('challenges.comments.post') }}
                      </v-btn>
                    </div>
                  </div>
                </div>

                <!-- Replies list -->
                <div v-if="comment.replies && comment.replies.length > 0" class="replies-list mt-3">
                  <div
                    v-for="reply in comment.replies"
                    :key="reply._id || reply.createdAt"
                    :id="`comment-${comment._id}-${reply._id}`"
                    class="reply-item border-l-2"
                    :class="mobile ? 'ml-2 pl-2' : 'ml-4 pl-4'"
                  >
                    <div class="d-flex align-start">
                      <div class="comment-avatar reply-avatar mr-2">
                        <img
                          v-if="getReplyAvatar(reply)"
                          :src="getReplyAvatar(reply)"
                          :alt="getReplyName(reply)"
                          class="avatar-img reply-avatar-img"
                        />
                        <div v-else class="avatar-placeholder reply-avatar-placeholder">
                          {{ getReplyInitial(reply) }}
                        </div>
                      </div>
                      <div class="reply-content flex-grow-1">
                        <div class="reply-header mb-1" :class="mobile ? 'flex-column align-start' : ''">
                          <div class="d-flex align-center" style="width: 100%;">
                            <span class="comment-author font-weight-medium reply-author">
                              {{ getReplyName(reply) }}
                              <span v-if="reply.mentionedUserId" class="text-primary">
                                → 
                                <span 
                                  class="mention-link" 
                                  @click.stop="navigateToMention(comment, reply)"
                                  :title="t('challenges.comments.goToMention')"
                                >
                                  @{{ getMentionedName(reply) }}
                                </span>
                              </span>
                            </span>
                            <span class="comment-date text-caption text-medium-emphasis reply-date ml-2">
                              {{ formatDate(reply.createdAt) }}
                            </span>
                            <v-btn
                              v-if="canDeleteReply(reply, comment)"
                              icon="mdi-delete-outline"
                              size="x-small"
                              variant="text"
                              color="error"
                              class="ml-auto"
                              @click="deleteReply(comment, reply)"
                            ></v-btn>
                          </div>
                        </div>
                        <div class="comment-text reply-text">{{ reply.text }}</div>
                        
                        <!-- Reply to reply button -->
                        <div v-if="canComment" class="mt-2">
                          <v-btn
                            v-if="replyingToReplyId !== reply._id"
                            size="x-small"
                            variant="text"
                            color="primary"
                            style="font-size: 0.75rem;"
                            @click="startReplyToReply(comment, reply)"
                          >
                            {{ t('challenges.comments.reply') }}
                          </v-btn>
                          
                          <!-- Reply to reply input -->
                          <div v-else class="reply-input-section mt-2">
                            <v-textarea
                              v-model="replyToReplyTexts[reply._id]"
                              :label="t('challenges.comments.replyPlaceholder', { name: getReplyName(reply) })"
                              variant="outlined"
                              rows="2"
                              :maxlength="1000"
                              counter
                              :disabled="!!replyingToReplyCommentId && replyingToReplyCommentId === comment._id"
                              density="compact"
                              style="font-size: 0.875rem;"
                              @keydown.ctrl.enter="submitReplyToReply(comment, reply)"
                              @keydown.meta.enter="submitReplyToReply(comment, reply)"
                            ></v-textarea>
                            <div class="d-flex justify-end gap-2 mt-2">
                              <v-btn
                                size="small"
                                variant="text"
                                :disabled="!!replyingToReplyCommentId && replyingToReplyCommentId === comment._id"
                                @click="cancelReplyToReply(reply._id)"
                              >
                                {{ t('common.cancel') }}
                              </v-btn>
                              <v-btn
                                size="small"
                                color="primary"
                                :loading="!!replyingToReplyCommentId && replyingToReplyCommentId === comment._id"
                                :disabled="!replyToReplyTexts[reply._id]?.trim() || (!!replyingToReplyCommentId && replyingToReplyCommentId === comment._id)"
                                @click="submitReplyToReply(comment, reply)"
                              >
                                {{ t('challenges.comments.post') }}
                              </v-btn>
                            </div>
                          </div>
                        </div>

                        <!-- Nested replies (replies to replies) -->
                        <div v-if="reply.replies && reply.replies.length > 0" class="nested-replies-list mt-2">
                          <div
                            v-for="nestedReply in reply.replies"
                            :key="nestedReply._id || nestedReply.createdAt"
                            :id="`comment-${comment._id}-${nestedReply._id}`"
                            class="nested-reply-item border-l-2"
                            :class="mobile ? 'ml-1 pl-2' : 'ml-4 pl-3'"
                          >
                            <div class="d-flex align-start">
                              <div class="comment-avatar nested-reply-avatar mr-2">
                                <img
                                  v-if="getNestedReplyAvatar(nestedReply)"
                                  :src="getNestedReplyAvatar(nestedReply)"
                                  :alt="getNestedReplyName(nestedReply)"
                                  class="avatar-img nested-reply-avatar-img"
                                />
                                <div v-else class="avatar-placeholder nested-reply-avatar-placeholder">
                                  {{ getNestedReplyInitial(nestedReply) }}
                                </div>
                              </div>
                              <div class="nested-reply-content flex-grow-1">
                                <div class="reply-header mb-1" :class="mobile ? 'flex-column align-start' : ''">
                                  <div class="d-flex align-center" style="width: 100%;">
                                    <span class="comment-author font-weight-medium nested-reply-author">
                                      {{ getNestedReplyName(nestedReply) }}
                                      <span v-if="nestedReply.mentionedUserId" class="text-primary">
                                        → 
                                        <span 
                                          class="mention-link" 
                                          @click.stop="navigateToMention(comment, reply, nestedReply)"
                                          :title="t('challenges.comments.goToMention')"
                                        >
                                          @{{ getNestedMentionedName(nestedReply) }}
                                        </span>
                                      </span>
                                    </span>
                                    <span class="comment-date text-caption text-medium-emphasis nested-reply-date ml-2">
                                      {{ formatDate(nestedReply.createdAt) }}
                                    </span>
                                    <v-btn
                                      v-if="canDeleteNestedReply(nestedReply, reply, comment)"
                                      icon="mdi-delete-outline"
                                      size="x-small"
                                      variant="text"
                                      color="error"
                                      class="ml-auto"
                                      @click="deleteNestedReply(comment, reply, nestedReply)"
                                    ></v-btn>
                                  </div>
                                </div>
                                <div class="comment-text nested-reply-text">{{ nestedReply.text }}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <v-alert v-else-if="allowComments !== false && !loading" type="info" variant="tonal">
          {{ t('challenges.comments.noComments') }}
        </v-alert>

        <!-- Loading state -->
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mt-4"></v-progress-linear>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

const router = useRouter()
const { mobile, smAndUp } = useDisplay()

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
  }
})

const emit = defineEmits(['comment-added', 'comment-deleted'])

const { t, locale } = useI18n()

const comments = ref([])
const loading = ref(false)
const addingComment = ref(false)
const deletingCommentId = ref(null)
const newCommentText = ref('')
const replyingToCommentId = ref(null)
const replyTexts = ref({})
const replyingCommentId = ref(null)
const deletingReplyId = ref(null)
const replyingToReplyId = ref(null)
const replyToReplyTexts = ref({})
const replyingToReplyCommentId = ref(null)

async function loadComments() {
  if (!props.challengeId || props.allowComments === false) return

  loading.value = true
  try {
    const { data } = await challengeService.getComments(props.challengeId)
    comments.value = (data.comments || []).sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB - dateA // Newest first
    })
  } catch (error) {
    console.error('Error loading comments:', error)
  } finally {
    loading.value = false
  }
}

async function addComment() {
  if (!newCommentText.value.trim() || !props.currentUserId || addingComment.value) return

  addingComment.value = true
  try {
    const { data } = await challengeService.addComment(
      props.challengeId,
      props.currentUserId,
      newCommentText.value
    )
    newCommentText.value = ''
    await loadComments()
    emit('comment-added', data.comment)
  } catch (error) {
    console.error('Error adding comment:', error)
    alert(error.response?.data?.message || t('challenges.comments.addError'))
  } finally {
    addingComment.value = false
  }
}

async function deleteComment(comment) {
  if (!confirm(t('challenges.comments.deleteConfirm'))) return

  deletingCommentId.value = comment._id
  try {
    await challengeService.deleteComment(props.challengeId, comment._id, props.currentUserId)
    await loadComments()
    emit('comment-deleted', comment._id)
  } catch (error) {
    console.error('Error deleting comment:', error)
    alert(error.response?.data?.message || t('challenges.comments.deleteError'))
  } finally {
    deletingCommentId.value = null
  }
}

function getCommentName(comment) {
  return comment.userId?.name || t('common.unknown')
}

function getCommentAvatar(comment) {
  return comment.userId?.avatarUrl || null
}

function getCommentInitial(comment) {
  const name = getCommentName(comment)
  return name.charAt(0).toUpperCase()
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

const canComment = computed(() => {
  return props.allowComments !== false && !!props.currentUserId && !props.isFinished
})

function canDeleteComment(comment) {
  if (!props.currentUserId) return false
  const commentUserId = comment.userId?._id || comment.userId
  return props.isOwner || (commentUserId && commentUserId.toString() === props.currentUserId.toString())
}

function startReply(comment) {
  replyingToCommentId.value = comment._id
  const commentName = getCommentName(comment)
  // Pre-fill with @mention
  replyTexts.value[comment._id] = `@${commentName} `
}

function cancelReply(commentId) {
  replyingToCommentId.value = null
  replyTexts.value[commentId] = ''
}

async function submitReply(comment) {
  if (!replyTexts.value[comment._id]?.trim() || !props.currentUserId || replyingCommentId.value) return

  replyingCommentId.value = comment._id
  const commentUserId = comment.userId?._id || comment.userId
  
  try {
    await challengeService.replyToComment(
      props.challengeId,
      comment._id,
      props.currentUserId,
      replyTexts.value[comment._id],
      commentUserId.toString() === props.currentUserId.toString() ? null : commentUserId
    )
    replyTexts.value[comment._id] = ''
    replyingToCommentId.value = null
    await loadComments()
  } catch (error) {
    console.error('Error adding reply:', error)
    alert(error.response?.data?.message || t('challenges.comments.replyError'))
  } finally {
    replyingCommentId.value = null
  }
}

async function deleteReply(comment, reply) {
  if (!confirm(t('challenges.comments.deleteReplyConfirm'))) return

  deletingReplyId.value = reply._id
  try {
    await challengeService.deleteReply(props.challengeId, comment._id, reply._id, props.currentUserId)
    await loadComments()
  } catch (error) {
    console.error('Error deleting reply:', error)
    alert(error.response?.data?.message || t('challenges.comments.deleteReplyError'))
  } finally {
    deletingReplyId.value = null
  }
}

function getReplyName(reply) {
  return reply.userId?.name || t('common.unknown')
}

function getReplyAvatar(reply) {
  return reply.userId?.avatarUrl || null
}

function getReplyInitial(reply) {
  const name = getReplyName(reply)
  return name.charAt(0).toUpperCase()
}

function getMentionedName(reply) {
  return reply.mentionedUserId?.name || t('common.unknown')
}

function canDeleteReply(reply, comment) {
  if (!props.currentUserId) return false
  const replyUserId = reply.userId?._id || reply.userId
  const commentUserId = comment.userId?._id || comment.userId
  
  return props.isOwner || 
         (replyUserId && replyUserId.toString() === props.currentUserId.toString()) ||
         (commentUserId && commentUserId.toString() === props.currentUserId.toString())
}

function startReplyToReply(comment, reply) {
  replyingToReplyId.value = reply._id
  // Don't set replyingToReplyCommentId here - only set it when actually submitting
  const replyName = getReplyName(reply)
  // Pre-fill with @mention
  replyToReplyTexts.value[reply._id] = `@${replyName} `
}

function cancelReplyToReply(replyId) {
  replyingToReplyId.value = null
  replyingToReplyCommentId.value = null
  replyToReplyTexts.value[replyId] = ''
}

async function submitReplyToReply(comment, reply) {
  if (!replyToReplyTexts.value[reply._id]?.trim() || !props.currentUserId) return
  if (replyingToReplyCommentId.value) return // Already submitting

  replyingToReplyCommentId.value = comment._id
  const replyUserId = reply.userId?._id || reply.userId
  
  try {
    await challengeService.replyToReply(
      props.challengeId,
      comment._id,
      reply._id,
      props.currentUserId,
      replyToReplyTexts.value[reply._id],
      replyUserId.toString() === props.currentUserId.toString() ? null : replyUserId
    )
    replyToReplyTexts.value[reply._id] = ''
    replyingToReplyId.value = null
    replyingToReplyCommentId.value = null
    await loadComments()
  } catch (error) {
    console.error('Error adding nested reply:', error)
    alert(error.response?.data?.message || t('challenges.comments.replyError'))
  } finally {
    replyingToReplyCommentId.value = null
  }
}

async function deleteNestedReply(comment, parentReply, nestedReply) {
  if (!confirm(t('challenges.comments.deleteReplyConfirm'))) return

  try {
    await challengeService.deleteNestedReply(
      props.challengeId,
      comment._id,
      parentReply._id,
      nestedReply._id,
      props.currentUserId
    )
    await loadComments()
  } catch (error) {
    console.error('Error deleting nested reply:', error)
    alert(error.response?.data?.message || t('challenges.comments.deleteReplyError'))
  }
}

function getNestedReplyName(nestedReply) {
  if (!nestedReply) return t('common.unknown')
  // Handle both populated and unpopulated userId
  if (nestedReply.userId && typeof nestedReply.userId === 'object' && nestedReply.userId.name) {
    return nestedReply.userId.name
  }
  if (typeof nestedReply.userId === 'string') {
    // If userId is just an ID string, we need to find the user in the comment's context
    return t('common.unknown')
  }
  return nestedReply.userId?.name || t('common.unknown')
}

function getNestedReplyAvatar(nestedReply) {
  if (!nestedReply) return null
  if (nestedReply.userId && typeof nestedReply.userId === 'object' && nestedReply.userId.avatarUrl) {
    return nestedReply.userId.avatarUrl
  }
  return nestedReply.userId?.avatarUrl || null
}

function getNestedReplyInitial(nestedReply) {
  const name = getNestedReplyName(nestedReply)
  return name.charAt(0).toUpperCase()
}

function getNestedMentionedName(nestedReply) {
  if (!nestedReply) return t('common.unknown')
  // Handle both populated and unpopulated mentionedUserId
  if (nestedReply.mentionedUserId && typeof nestedReply.mentionedUserId === 'object' && nestedReply.mentionedUserId.name) {
    return nestedReply.mentionedUserId.name
  }
  return nestedReply.mentionedUserId?.name || t('common.unknown')
}

function canDeleteNestedReply(nestedReply, parentReply, comment) {
  if (!props.currentUserId) return false
  const nestedReplyUserId = nestedReply.userId?._id || nestedReply.userId
  const parentReplyUserId = parentReply.userId?._id || parentReply.userId
  const commentUserId = comment.userId?._id || comment.userId
  
  return props.isOwner || 
         (nestedReplyUserId && nestedReplyUserId.toString() === props.currentUserId.toString()) ||
         (parentReplyUserId && parentReplyUserId.toString() === props.currentUserId.toString()) ||
         (commentUserId && commentUserId.toString() === props.currentUserId.toString())
}

function navigateToMention(comment, reply, nestedReply = null) {
  // Navigate to challenge with comment/reply ID in URL hash
  const targetId = nestedReply ? nestedReply._id : reply._id
  const commentId = comment._id
  
  // Check if we're already on the challenge page
  const currentPath = router.currentRoute.value.path
  const challengePath = `/challenges/${props.challengeId}`
  
  if (currentPath === challengePath || currentPath.startsWith(challengePath + '/')) {
    // Already on challenge page, scroll to the comment/reply
    nextTick(() => {
      scrollToComment(commentId, targetId)
    })
  } else {
    // Navigate to challenge and scroll after navigation
    router.push(`${challengePath}#comment-${commentId}-${targetId}`).then(() => {
      nextTick(() => {
        scrollToComment(commentId, targetId)
      })
    })
  }
}

function scrollToComment(commentId, replyId) {
  // Wait a bit for the page to render
  setTimeout(() => {
    const elementId = replyId ? `comment-${commentId}-${replyId}` : `comment-${commentId}`
    const element = document.getElementById(elementId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Highlight the element briefly
      element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)'
      setTimeout(() => {
        element.style.backgroundColor = ''
      }, 2000)
    }
  }, 300)
}

watch(() => props.challengeId, () => {
  loadComments()
})

watch(() => props.allowComments, () => {
  if (props.allowComments !== false) {
    loadComments()
  } else {
    comments.value = []
  }
})

onMounted(() => {
  if (props.allowComments !== false) {
    loadComments()
  }
  
  // Check if there's a hash in URL to scroll to specific comment/reply
  if (router.currentRoute.value.hash) {
    const hash = router.currentRoute.value.hash.replace('#', '')
    if (hash.startsWith('comment-')) {
      const parts = hash.split('-')
      if (parts.length >= 2) {
        const commentId = parts[1]
        const replyId = parts.length >= 3 ? parts[2] : null
        // Wait for comments to load, then scroll
        watch(() => comments.value.length, () => {
          if (comments.value.length > 0) {
            nextTick(() => {
              scrollToComment(commentId, replyId)
            })
          }
        }, { immediate: true })
      }
    }
  }
})
</script>


<style scoped>
.comments-component {
  width: 100%;
}

.add-comment-section {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.comments-list {
  /* Auto height - grows with content */
}

.comment-item {
  padding: 12px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.02);
  transition: background-color 0.2s;
}

@media (max-width: 599px) {
  .comment-item {
    padding: 8px;
  }
}

.comment-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.comment-avatar {
  flex-shrink: 0;
}

.avatar-img,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  color: white;
  font-weight: 600;
  font-size: 16px;
}

/* Reply avatars */
.reply-avatar-img,
.reply-avatar-placeholder {
  width: 32px;
  height: 32px;
  font-size: 12px;
}

/* Nested reply avatars */
.nested-reply-avatar-img,
.nested-reply-avatar-placeholder {
  width: 28px;
  height: 28px;
  font-size: 10px;
}

@media (max-width: 599px) {
  .avatar-img,
  .avatar-placeholder {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  .reply-avatar-img,
  .reply-avatar-placeholder {
    width: 28px;
    height: 28px;
    font-size: 11px;
  }
  
  .nested-reply-avatar-img,
  .nested-reply-avatar-placeholder {
    width: 24px;
    height: 24px;
    font-size: 9px;
  }
}

.comment-content {
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
}

.comment-author {
  color: rgba(0, 0, 0, 0.87);
}

.comment-date {
  color: rgba(0, 0, 0, 0.6);
}

.comment-text {
  color: rgba(0, 0, 0, 0.87);
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

.reply-text {
  font-size: 0.875rem;
}

.nested-reply-text {
  font-size: 0.8125rem;
}

.reply-author {
  font-size: 0.875rem;
}

.nested-reply-author {
  font-size: 0.8125rem;
}

.reply-date {
  font-size: 0.75rem;
}

.nested-reply-date {
  font-size: 0.6875rem;
}

@media (max-width: 599px) {
  .comment-text {
    font-size: 0.875rem;
  }
  
  .reply-text {
    font-size: 0.8125rem;
  }
  
  .nested-reply-text {
    font-size: 0.75rem;
  }
  
  .reply-author {
    font-size: 0.8125rem;
  }
  
  .nested-reply-author {
    font-size: 0.75rem;
  }
  
  .reply-date {
    font-size: 0.6875rem;
  }
  
  .nested-reply-date {
    font-size: 0.625rem;
  }
}

.reply-input-section {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

@media (max-width: 599px) {
  .reply-input-section {
    padding: 8px;
  }
}

.replies-list {
  margin-top: 12px;
}

.reply-item {
  padding: 8px 0;
  border-left: 2px solid rgba(0, 0, 0, 0.12);
}

@media (min-width: 600px) {
  .reply-item {
    padding-left: 12px;
    margin-left: 16px;
  }
}

@media (max-width: 599px) {
  .reply-item {
    padding-left: 8px;
    margin-left: 8px;
  }
}

.reply-item:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.reply-content {
  min-width: 0;
}

.reply-header {
  display: flex;
  align-items: center;
}

.nested-replies-list {
  margin-top: 8px;
}

.nested-reply-item {
  padding: 6px 0;
  border-left: 2px solid rgba(0, 0, 0, 0.1);
}

@media (min-width: 600px) {
  .nested-reply-item {
    padding-left: 10px;
    margin-left: 12px;
  }
}

@media (max-width: 599px) {
  .nested-reply-item {
    padding-left: 6px;
    margin-left: 4px;
  }
}

.nested-reply-item:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.nested-reply-content {
  min-width: 0;
}

.mention-link {
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.2s;
}

.mention-link:hover {
  opacity: 0.7;
}
</style>

