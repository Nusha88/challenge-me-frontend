<template>
  <div class="diary-component">
    <div class="diary-header d-flex align-center mb-6">
      <div class="diary-icon-glow mr-3">
        <v-icon color="#4FD1C5" size="small">mdi-message-text-clock-outline</v-icon>
      </div>
      <h3 class="text-h6 font-weight-bold text-white mb-0">{{ t('challenges.diary.title') }}</h3>
      <v-chip v-if="comments.length > 0" size="x-small" color="#4FD1C5" class="ml-3 tactical-count-chip">
        {{ comments.length }}
      </v-chip>
    </div>

    <div v-if="canComment" class="add-comment-container mb-8">
      <div class="tactical-input-wrapper">
        <v-textarea
          v-model="newCommentText"
          :placeholder="commentPlaceholder"
          auto-grow
          rows="1"
          max-rows="6"
          variant="plain"
          class="comment-field px-4 pt-3"
          hide-details
          :disabled="addingComment"
        ></v-textarea>

        <div v-if="newCommentImagePreview" class="px-4 pb-3">
          <div class="preview-frame">
            <v-img :src="newCommentImagePreview" max-height="180" cover class="rounded-lg border-accent">
              <v-btn icon="mdi-close" size="x-small" color="error" class="remove-img-btn" @click="removeImagePreview('comment')"></v-btn>
            </v-img>
          </div>
        </div>

        <div class="input-footer d-flex align-center pa-2">
          <input ref="fileInputRef" type="file" accept="image/*" class="d-none" @change="handleImageSelect($event, 'comment')" />
          <v-btn icon="mdi-camera-plus-outline" variant="text" color="rgba(255,255,255,0.5)" size="small" @click="fileInputRef?.click()"></v-btn>
          
          <v-spacer></v-spacer>
          
          <v-btn
            color="#4FD1C5"
            variant="flat"
            size="small"
            class="post-btn px-6 font-weight-black"
            :loading="addingComment || uploadingImage"
            :disabled="(!newCommentText.trim() && !newCommentImageUrl) || uploadingImage"
            @click="addComment"
          >
            {{ t('challenges.comments.post') }}
          </v-btn>
        </div>
      </div>
    </div>

    <div v-else-if="!isCurrentUserParticipant && props.currentUserId && props.challengeType === 'habit'" class="join-mission-card pa-6 text-center mb-8">
      <v-icon color="rgba(255,255,255,0.2)" size="48" class="mb-3">mdi-shield-lock-outline</v-icon>
      <p class="text-body-2 text-white opacity-70 mb-4">{{ t('challenges.comments.joinPrompt') }}</p>
      <v-btn color="#4FD1C5" variant="outlined" class="rounded-lg" @click="emitJoin">
        {{ t('challenges.joinMission') }}
      </v-btn>
    </div>

    <div v-if="feedItems.length > 0" class="comments-feed">
      <div
        v-for="item in feedItems"
        :key="item._id || item.createdAt"
        class="feed-item-container"
        :class="item.type === 'system' ? 'system-log' : 'user-comment'"
      >
        <div v-if="item.type === 'system'" class="system-log-entry text-center py-2 px-4 mb-4">
          <span class="log-text">{{ item.text }}</span>
        </div>

        <div v-else class="comment-block mb-6">
          <div v-if="shouldShowDayLabel(item)" class="tactical-day-label mb-3">
            <span class="label-text">{{ getDayLabel(item) }}</span>
          </div>

          <div class="d-flex align-start">
            <div class="comment-main flex-grow-1">
              <div class="d-flex align-center mb-1">
                <span class="author-name font-weight-bold" @click.stop="navigateToUser(item.userId)">
                  {{ getCommentName(item) }}
                </span>
                <span v-if="getParticipantStreak(item.userId?._id || item.userId) > 0" class="streak-indicator ml-2">
                  <v-icon size="12" color="#F4A782">mdi-fire</v-icon>
                  {{ getParticipantStreak(item.userId?._id || item.userId) }}
                </span>
                <span class="post-time ml-3">{{ formatDate(item.createdAt) }}</span>
                
                <v-spacer></v-spacer>
                
                <v-btn v-if="canDeleteComment(item)" icon="mdi-delete-outline" size="x-small" variant="text" color="rgba(255,255,255,0.3)" @click="deleteComment(item)"></v-btn>
              </div>

              <div class="comment-body pa-3">
                <p v-if="item.text" class="text-content mb-0">{{ item.text }}</p>
                <v-img v-if="item.imageUrl" :src="item.imageUrl" max-height="350" class="rounded-lg mt-3 border-accent"></v-img>
                
                <div class="d-flex align-center mt-3 gap-2">
                  <div class="reactions-row d-flex">
                    <div
                      v-for="emoji in ['👏', '🔥', '💪']"
                      :key="emoji"
                      class="reaction-capsule"
                      :class="{ 'active': hasUserReacted(item, emoji) }"
                      @click="toggleReaction(item, emoji, 'comment')"
                    >
                      <span class="emoji">{{ emoji }}</span>
                      <span v-if="getReactionCount(item, emoji) > 0" class="count ml-1">{{ getReactionCount(item, emoji) }}</span>
                    </div>
                  </div>
                  <v-btn size="x-small" variant="text" color="#4FD1C5" class="ml-2 font-weight-bold" @click="startReply(item)">
                    {{ t('challenges.comments.reply') }}
                  </v-btn>
                </div>
              </div>

              <div v-if="item.replies && item.replies.length > 0" class="replies-thread ml-6 mt-3">
                <div v-for="reply in item.replies" :key="reply._id" class="reply-entry pl-4 mb-3 border-left-tactical">
                  <div class="d-flex align-center mb-1">
                    <span class="reply-author text-caption font-weight-bold" @click.stop="navigateToUser(reply.userId)">{{ getReplyName(reply) }}</span>
                    <v-icon size="10" class="mx-1 opacity-50 text-white">mdi-chevron-right</v-icon>
                    <span v-if="reply.mentionedUserId" class="mention text-caption">@{{ getMentionedName(reply) }}</span>
                    <span class="post-time ml-2">{{ formatDate(reply.createdAt) }}</span>
                  </div>
                  <div class="reply-body text-caption opacity-90">{{ reply.text }}</div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- BASE THEME (Command Post Dark) --- */
.diary-component { color: #ffffff; }

.diary-icon-glow {
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.3);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.1);
}

.tactical-count-chip {
  background: rgba(79, 209, 197, 0.2) !important;
  border: 1px solid #4FD1C5 !important;
  font-weight: 800;
  font-family: 'Montserrat', sans-serif;
}

/* --- INPUT FIELD (Tactical Glass) --- */
.tactical-input-wrapper {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: 0.3s;
}

.tactical-input-wrapper:focus-within {
  border-color: #4FD1C5;
  box-shadow: 0 0 15px rgba(79, 209, 197, 0.2);
}

.comment-field :deep(textarea) {
  color: #fff !important;
  font-size: 0.95rem;
  line-height: 1.5;
}

.input-footer {
  background: rgba(15, 23, 42, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.post-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(79, 209, 197, 0.3) !important;
}

/* --- COMMENT BLOCKS --- */
.comment-body {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border-left: 3px solid rgba(79, 209, 197, 0.4);
}

.author-name {
  color: #4FD1C5;
  font-size: 0.9rem;
  cursor: pointer;
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

/* --- REACTIONS --- */
.reaction-capsule {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px 10px;
  border-radius: 50px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
}

.reaction-capsule:hover {
  background: rgba(255, 255, 255, 0.1);
}

.reaction-capsule.active {
  background: rgba(79, 209, 197, 0.2);
  border-color: #4FD1C5;
  color: #4FD1C5;
}

.reaction-capsule .count {
  font-size: 0.75rem;
  font-weight: 700;
}

/* --- THREADS & LOGS --- */
.border-left-tactical {
  border-left: 1px solid rgba(79, 209, 197, 0.3);
}

.system-log-entry {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.log-text {
  font-size: 0.75rem;
  font-style: italic;
  opacity: 0.5;
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
  background: rgba(30, 41, 59, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.border-accent {
  border: 1px solid rgba(79, 209, 197, 0.2);
}
</style>
<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { Flame } from 'lucide-vue-next'

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
    default: 'habit'
  },
  challengeOwner: {
    type: [Object, String],
    default: null
  },
  challengeParticipants: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['comment-added', 'comment-deleted', 'user-navigated', 'join'])

const { t, locale } = useI18n()

// Store selected placeholder index in a ref to persist across re-renders
const selectedPlaceholderIndex = ref(Math.floor(Math.random() * 5))

// Dynamic placeholder for comment input
const commentPlaceholder = computed(() => {
  const placeholders = [
    t('challenges.comments.placeholder1'),
    t('challenges.comments.placeholder2'),
    t('challenges.comments.placeholder3'),
    t('challenges.comments.placeholder4'),
    t('challenges.comments.placeholder5')
  ]
  return placeholders[selectedPlaceholderIndex.value]
})

// Image upload helper
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      } else {
        reject(new Error('Unable to read file'))
      }
    }
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

async function uploadImage(file) {
  uploadingImage.value = true
  try {
    const base64 = await readFileAsBase64(file)
    const formData = new URLSearchParams()
    formData.append('image', base64)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    const payload = await response.json()

    if (!response.ok || !payload.success) {
      const errorMsg = payload?.error?.message || payload?.data?.error?.message || 'Upload failed'
      throw new Error(errorMsg)
    }

    const imageUrl = payload?.data?.url || payload?.data?.display_url
    if (!imageUrl) {
      throw new Error('Upload did not return an image URL')
    }

    return imageUrl
  } finally {
    uploadingImage.value = false
  }
}

async function handleImageSelect(event, type = 'comment', commentId = null, replyId = null) {
  const files = event.target.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file.type.startsWith('image/')) {
    alert(t('challenges.uploadInvalidType'))
    return
  }

  const maxSizeMb = 5
  if (file.size > maxSizeMb * 1024 * 1024) {
    alert(t('challenges.uploadTooLarge', { size: maxSizeMb }))
    return
  }

  // Set uploading state
  if (type === 'reply') {
    uploadingReplyImages.value[commentId] = true
  } else if (type === 'nestedReply') {
    uploadingReplyToReplyImages.value[replyId] = true
  }

  // Show preview and store filename
  const reader = new FileReader()
  reader.onload = (e) => {
    if (type === 'comment') {
      newCommentImagePreview.value = e.target.result
      newCommentImageName.value = file.name
    } else if (type === 'reply') {
      replyImagePreviews.value[commentId] = e.target.result
    } else if (type === 'nestedReply') {
      replyToReplyImagePreviews.value[replyId] = e.target.result
    }
  }
  reader.readAsDataURL(file)

  // Upload image
  try {
    const imageUrl = await uploadImage(file)
    if (type === 'comment') {
      newCommentImageUrl.value = imageUrl
    } else if (type === 'reply') {
      replyImageUrls.value[commentId] = imageUrl
      uploadingReplyImages.value[commentId] = false
    } else if (type === 'nestedReply') {
      replyToReplyImageUrls.value[replyId] = imageUrl
      uploadingReplyToReplyImages.value[replyId] = false
    }
  } catch (error) {
    console.error('Image upload failed:', error)
    alert(error.message || t('challenges.uploadError'))
    if (type === 'comment') {
      newCommentImagePreview.value = null
      newCommentImageName.value = null
      newCommentImageUrl.value = null
    } else if (type === 'reply') {
      replyImagePreviews.value[commentId] = null
      replyImageUrls.value[commentId] = null
      uploadingReplyImages.value[commentId] = false
    } else if (type === 'nestedReply') {
      replyToReplyImagePreviews.value[replyId] = null
      replyToReplyImageUrls.value[replyId] = null
      uploadingReplyToReplyImages.value[replyId] = false
    }
  }
}

function removeImagePreview(type = 'comment', commentId = null, replyId = null) {
  if (type === 'comment') {
    newCommentImageUrl.value = null
    newCommentImagePreview.value = null
    newCommentImageName.value = null
  } else if (type === 'reply') {
    replyImageUrls.value[commentId] = null
    replyImagePreviews.value[commentId] = null
  } else if (type === 'nestedReply') {
    replyToReplyImageUrls.value[replyId] = null
    replyToReplyImagePreviews.value[replyId] = null
  }
}

// System events generation
function generateSystemEvents() {
  const events = []
  if (!props.challengeParticipants || !props.challengeStartDate) return events

  const participants = props.challengeParticipants || []
  const startDate = new Date(props.challengeStartDate)
  const endDate = props.challengeEndDate ? new Date(props.challengeEndDate) : null

  // Generate join events - approximate join time as when they first completed a day
  // For simplicity, we'll use the first completed day as join time
  participants.forEach(participant => {
    if (participant.completedDays && participant.completedDays.length > 0) {
      const firstCompletedDay = participant.completedDays
        .map(d => {
          try {
            let dateStr = String(d)
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0]
            return new Date(dateStr.substring(0, 10))
          } catch {
            return null
          }
        })
        .filter(Boolean)
        .sort((a, b) => a - b)[0]

      if (firstCompletedDay) {
        const user = participant.userId
        const userName = user?.name || t('common.unknown')
        events.push({
          _id: `system-join-${participant.userId?._id || participant.userId}`,
          type: 'system',
          eventType: 'join',
          text: t('challenges.diary.heroJoined', { name: userName }),
          createdAt: firstCompletedDay,
          userId: participant.userId
        })
      }
    }
  })

  // Generate progress milestones for habit challenges
  if (props.challengeType === 'habit' && endDate) {
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const milestones = [25, 50, 75, 100]

    participants.forEach(participant => {
      if (participant.completedDays && participant.completedDays.length > 0) {
        const completedCount = participant.completedDays.length
        const progress = Math.round((completedCount / totalDays) * 100)

        milestones.forEach(milestone => {
          if (progress >= milestone) {
            // Approximate milestone date based on progress
            const milestoneDate = new Date(startDate)
            milestoneDate.setDate(startDate.getDate() + Math.floor((totalDays * milestone) / 100))

            events.push({
              _id: `system-milestone-${participant.userId?._id || participant.userId}-${milestone}`,
              type: 'system',
              eventType: 'milestone',
              text: t('challenges.diary.missionProgress', { percent: milestone }),
              createdAt: milestoneDate,
              userId: participant.userId
            })
          }
        })
      }
    })
  }

  return events
}

// Calculate streak for a participant
function getParticipantStreak(userId) {
  if (!userId || !props.challengeParticipants || props.challengeType !== 'habit') return 0

  const participant = props.challengeParticipants.find(p => {
    const pUserId = p.userId?._id || p.userId || p._id
    return pUserId && pUserId.toString() === userId.toString()
  })

  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return 0

  function formatDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const completedDateStrings = participant.completedDays
    .map(date => {
      try {
        if (!date) return null
        let dateStr = String(date)
        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0]
        return dateStr.substring(0, 10)
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))

  if (completedDateStrings.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)

  let startDate = new Date(today)
  if (!completedDateStrings.includes(todayStr)) {
    startDate.setDate(today.getDate() - 1)
  }

  let streak = 0
  let currentDate = new Date(startDate)

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDateString(currentDate)
    if (completedDateStrings.includes(dateStr)) {
      streak++
    } else {
      break
    }
    currentDate.setDate(currentDate.getDate() - 1)
    currentDate.setHours(0, 0, 0, 0)
  }

  return streak
}

// Combined feed with system events
const feedItems = computed(() => {
  const systemEvents = generateSystemEvents()
  const allItems = [...comments.value, ...systemEvents]
  
  return allItems.sort((a, b) => {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
    return dateB - dateA // Newest first
  })
})

const comments = ref([])
const loading = ref(false)
const addingComment = ref(false)
const deletingCommentId = ref(null)
const newCommentText = ref('')
const newCommentImageUrl = ref(null)
const newCommentImagePreview = ref(null)
const newCommentImageName = ref(null)
const uploadingImage = ref(false)
const replyingToCommentId = ref(null)
const replyTexts = ref({})
const replyImageUrls = ref({})
const replyImagePreviews = ref({})
const uploadingReplyImages = ref({})
const replyingCommentId = ref(null)
const deletingReplyId = ref(null)
const replyingToReplyId = ref(null)
const replyToReplyTexts = ref({})
const replyToReplyImageUrls = ref({})
const replyToReplyImagePreviews = ref({})
const uploadingReplyToReplyImages = ref({})
const replyingToReplyCommentId = ref(null)
const reactingCommentId = ref(null)
const reactingReplyId = ref(null)
const reactingNestedReplyId = ref(null)

const fileInputRef = ref(null)
const replyFileInputs = ref({})
const replyToReplyFileInputs = ref({})

// ImgBB API key
const IMGBB_API_KEY = 'd8a4925b372143b44469009f92023386'

async function loadComments() {
  if (!props.challengeId || props.allowComments === false) return

  loading.value = true
  try {
    const { data } = await challengeService.getComments(props.challengeId)
    comments.value = data.comments || []
  } catch (error) {
    console.error('Error loading comments:', error)
  } finally {
    loading.value = false
  }
}

async function addComment() {
  if ((!newCommentText.value.trim() && !newCommentImageUrl.value) || !props.currentUserId || addingComment.value) return

  // Wait for image upload to complete if preview exists but URL doesn't
  if (newCommentImagePreview.value && !newCommentImageUrl.value && uploadingImage.value) {
    // Image is still uploading, wait a bit
    await new Promise(resolve => setTimeout(resolve, 500))
    if (!newCommentImageUrl.value) {
      alert(t('challenges.uploadInProgress'))
      return
    }
  }

  addingComment.value = true
  try {
    const commentText = newCommentText.value.trim() || (newCommentImageUrl.value ? ' ' : '')
    const imageUrl = newCommentImageUrl.value ? String(newCommentImageUrl.value).trim() : null
    
    if (!commentText && !imageUrl) {
      addingComment.value = false
      return
    }
    
    const { data } = await challengeService.addComment(
      props.challengeId,
      props.currentUserId,
      commentText,
      imageUrl
    )
    newCommentText.value = ''
    newCommentImageUrl.value = null
    newCommentImagePreview.value = null
    newCommentImageName.value = null
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

// Check if current user is a participant
const isCurrentUserParticipant = computed(() => {
  if (!props.currentUserId || !props.challengeParticipants || !Array.isArray(props.challengeParticipants)) {
    return false
  }
  
  const currentUserIdStr = props.currentUserId.toString()
  
  // Check if user is the owner
  if (props.challengeOwner) {
    const ownerId = props.challengeOwner._id || props.challengeOwner
    if (ownerId && ownerId.toString() === currentUserIdStr) {
      return true
    }
  }
  
  // Check if user is in participants list
  return props.challengeParticipants.some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === currentUserIdStr
  })
})

const canComment = computed(() => {
  if (props.allowComments === false || !props.currentUserId || props.isFinished) {
    return false
  }
  
  // For quest (result) challenges, any logged-in user can comment
  if (props.challengeType === 'result') {
    return true
  }
  
  // For habit challenges, only participants can comment
  return isCurrentUserParticipant.value
})

function canDeleteComment(comment) {
  if (!props.currentUserId) return false
  const commentUserId = comment.userId?._id || comment.userId
  return props.isOwner || (commentUserId && commentUserId.toString() === props.currentUserId.toString())
}

// Check if comment author is the challenge owner or a participant
function isCommentAuthorOwnerOrParticipant(comment) {
  if (!comment || !comment.userId) return false
  
  const commentUserId = comment.userId._id || comment.userId
  
  // Check if comment author is the challenge owner
  if (props.challengeOwner) {
    const ownerId = props.challengeOwner._id || props.challengeOwner
    if (ownerId && ownerId.toString() === commentUserId.toString()) {
      return true
    }
  }
  
  // Check if comment author is a participant
  if (props.challengeParticipants && Array.isArray(props.challengeParticipants)) {
    return props.challengeParticipants.some(participant => {
      const userId = participant.userId?._id || participant.userId || participant._id || participant
      return userId && userId.toString() === commentUserId.toString()
    })
  }
  
  return false
}

// Calculate day number from challenge start date to comment date
function calculateDayNumber(commentDate) {
  if (!props.challengeStartDate || !commentDate) return null
  
  try {
    const startDate = new Date(props.challengeStartDate)
    const commentDateObj = new Date(commentDate)
    
    // Set both dates to midnight for accurate day calculation
    startDate.setHours(0, 0, 0, 0)
    commentDateObj.setHours(0, 0, 0, 0)
    
    const diffTime = commentDateObj - startDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // Day 0 is the start date, so add 1 to get day number
    return diffDays + 1
  } catch (error) {
    console.error('Error calculating day number:', error)
    return null
  }
}

// Get day label text
function getDayLabel(comment) {
  const dayNumber = calculateDayNumber(comment.createdAt)
  if (dayNumber === null) return ''
  
  if (locale.value === 'ru') {
    // Russian: always use "день" regardless of number
    return `${dayNumber} день`
  } else {
    // English
    return dayNumber === 1 ? `${dayNumber} day` : `${dayNumber} days`
  }
}

// Check if day label should be shown
function shouldShowDayLabel(comment) {
  return isCommentAuthorOwnerOrParticipant(comment) && calculateDayNumber(comment.createdAt) !== null
}

function startReply(comment) {
  replyingToCommentId.value = comment._id
  const commentName = getCommentName(comment)
  // Pre-fill with @mention
  replyTexts.value[comment._id] = `@${commentName} `
  replyImageUrls.value[comment._id] = null
  replyImagePreviews.value[comment._id] = null
}

function cancelReply(commentId) {
  replyingToCommentId.value = null
  replyTexts.value[commentId] = ''
  replyImageUrls.value[commentId] = null
  replyImagePreviews.value[commentId] = null
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
      commentUserId.toString() === props.currentUserId.toString() ? null : commentUserId,
      replyImageUrls.value[comment._id] || null
    )
    replyTexts.value[comment._id] = ''
    replyImageUrls.value[comment._id] = null
    replyImagePreviews.value[comment._id] = null
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
  replyToReplyImageUrls.value[reply._id] = null
  replyToReplyImagePreviews.value[reply._id] = null
}

function cancelReplyToReply(replyId) {
  replyingToReplyId.value = null
  replyingToReplyCommentId.value = null
  replyToReplyTexts.value[replyId] = ''
  replyToReplyImageUrls.value[replyId] = null
  replyToReplyImagePreviews.value[replyId] = null
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
      replyUserId.toString() === props.currentUserId.toString() ? null : replyUserId,
      replyToReplyImageUrls.value[reply._id] || null
    )
    replyToReplyTexts.value[reply._id] = ''
    replyToReplyImageUrls.value[reply._id] = null
    replyToReplyImagePreviews.value[reply._id] = null
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
  const challengePath = `/missions/${props.challengeId}`
  
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

function navigateToUser(userId) {
  if (!userId) return
  
  // Get user ID - handle both populated object and ID string
  const id = userId._id || userId
  
  if (!id) return
  
  // Emit event to notify parent component (e.g., dialog should close)
  emit('user-navigated')
  
  router.push(`/heroes/${id}`)
}

function emitJoin() {
  emit('join')
}

// Reaction handling
async function toggleReaction(item, emoji, type = 'comment', commentId = null, replyId = null) {
  if (!props.currentUserId || reactingCommentId.value) return

  const itemId = item._id
  const reactions = item.reactions || new Map()
  
  // Convert Map to object if needed
  const reactionsObj = reactions instanceof Map 
    ? Object.fromEntries(reactions) 
    : (reactions || {})

  const emojiReactions = reactionsObj[emoji] || []
  const userIdStr = props.currentUserId.toString()
  const hasReacted = emojiReactions.some(r => {
    const rUserId = r.userId?._id || r.userId
    return rUserId && rUserId.toString() === userIdStr
  })

  // Optimistic update
  if (!reactionsObj[emoji]) {
    reactionsObj[emoji] = []
  }
  
  if (hasReacted) {
    reactionsObj[emoji] = emojiReactions.filter(r => {
      const rUserId = r.userId?._id || r.userId
      return !rUserId || rUserId.toString() !== userIdStr
    })
    if (reactionsObj[emoji].length === 0) {
      delete reactionsObj[emoji]
    }
  } else {
    reactionsObj[emoji].push({ userId: props.currentUserId })
  }

  // Update local state
  if (type === 'comment') {
    item.reactions = reactionsObj
    reactingCommentId.value = itemId
  } else if (type === 'reply') {
    item.reactions = reactionsObj
    reactingReplyId.value = itemId
  } else if (type === 'nestedReply') {
    item.reactions = reactionsObj
    reactingNestedReplyId.value = itemId
  }

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
    // Revert optimistic update
    await loadComments()
  } finally {
    if (type === 'comment') {
      reactingCommentId.value = null
    } else if (type === 'reply') {
      reactingReplyId.value = null
    } else if (type === 'nestedReply') {
      reactingNestedReplyId.value = null
    }
  }
}

function getReactionCount(item, emoji) {
  if (!item.reactions) return 0
  const reactions = item.reactions instanceof Map 
    ? Object.fromEntries(item.reactions) 
    : (item.reactions || {})
  return (reactions[emoji] || []).length
}

function hasUserReacted(item, emoji) {
  if (!item.reactions || !props.currentUserId) return false
  const reactions = item.reactions instanceof Map 
    ? Object.fromEntries(item.reactions) 
    : (item.reactions || {})
  const emojiReactions = reactions[emoji] || []
  const userIdStr = props.currentUserId.toString()
  return emojiReactions.some(r => {
    const rUserId = r.userId?._id || r.userId
    return rUserId && rUserId.toString() === userIdStr
  })
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


