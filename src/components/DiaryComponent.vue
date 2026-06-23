<template>
  <div class="diary-component">
    <div class="diary-header d-flex align-center mb-6">
      <div class="diary-icon-glow mr-3">
        <v-icon color="#4FD1C5" size="small">mdi-notebook-outline</v-icon>
      </div>
      <h3 class="text-h6 font-weight-bold text-white mb-0">{{ t('challenges.diary.tabTitle') }}</h3>
      <v-chip v-if="state.entries.length > 0" size="x-small" color="#4FD1C5" class="ml-3 tactical-count-chip">
        {{ state.entries.length }}
      </v-chip>
    </div>

    <div v-if="canWrite" class="add-comment-container mb-8">
      <div class="tactical-input-wrapper">
        <v-textarea
          v-model="state.newEntryText"
          :placeholder="t('challenges.diary.placeholder')"
          auto-grow
          rows="1"
          max-rows="6"
          variant="plain"
          class="comment-field px-4 pt-3"
          hide-details
          :disabled="state.addingEntry"
        ></v-textarea>

        <div v-if="state.newEntryImagePreview" class="px-4 pb-3">
          <div class="preview-frame">
            <v-img :src="state.newEntryImagePreview" max-height="180" cover class="rounded-lg border-accent">
              <v-btn icon="mdi-close" size="x-small" color="error" class="remove-img-btn" @click="removeImagePreview"></v-btn>
            </v-img>
          </div>
        </div>

        <div class="input-footer pa-2">
          <input ref="fileInputRef" type="file" accept="image/*" class="d-none" @change="handleImageSelect" />
          <v-btn icon="mdi-camera-plus-outline" variant="text" color="rgba(255,255,255,0.5)" size="small" @click="fileInputRef?.click()"></v-btn>

          <div class="share-switch-row">
            <v-switch
              v-model="state.shareToCommunity"
              color="#4FD1C5"
              density="compact"
              hide-details
              inset
              class="share-switch"
              :label="t('challenges.diary.shareToCommunity')"
            ></v-switch>
          </div>

          <v-spacer class="footer-spacer"></v-spacer>

          <v-btn
            color="#4FD1C5"
            variant="flat"
            size="small"
            class="post-btn px-6 font-weight-black"
            :loading="state.addingEntry || state.uploadingImage"
            :disabled="(!state.newEntryText.trim() && !state.newEntryImageUrl) || state.uploadingImage"
            @click="addEntry"
          >
            {{ t('challenges.comments.post') }}
          </v-btn>
        </div>
      </div>
    </div>

    <div v-if="state.entries.length > 0" class="comments-feed">
      <div
        v-for="entry in sortedEntries"
        :key="entry._id || entry.createdAt"
        class="feed-item-container user-comment"
      >
        <div class="comment-block mb-6">
          <div class="d-flex align-start">
            <div class="comment-main flex-grow-1">
              <div class="d-flex align-center mb-1">
                <v-avatar size="28" class="author-avatar mr-2">
                  <v-img v-if="getEntryAvatar(entry)" :src="getEntryAvatar(entry)" cover></v-img>
                  <span v-else>{{ getEntryInitial(entry) }}</span>
                </v-avatar>
                <span class="author-name font-weight-bold">{{ getEntryName(entry) }}</span>
                <span class="post-time ml-3">{{ formatDate(entry.createdAt) }}</span>

                <v-spacer></v-spacer>

                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="rgba(255,255,255,0.3)" @click="deleteEntry(entry)"></v-btn>
              </div>

              <div class="comment-body pa-3">
                <p v-if="entry.text" class="text-content mb-0">{{ entry.text }}</p>
                <v-img v-if="entry.imageUrl" :src="entry.imageUrl" max-height="350" class="rounded-lg mt-3 border-accent"></v-img>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-diary text-center py-8">
      <v-icon color="rgba(255,255,255,0.2)" size="48" class="mb-3">mdi-notebook-outline</v-icon>
      <p class="text-body-2 text-white opacity-50 mb-0">{{ t('challenges.diary.empty') }}</p>
    </div>
  </div>
</template>

<style scoped>
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.share-switch-row {
  flex: 1 1 100%;
  width: 100%;
  order: -1;
}

.share-switch {
  width: 100%;
}

.share-switch :deep(.v-input__control),
.share-switch :deep(.v-selection-control) {
  width: 100%;
}

.share-switch :deep(.v-selection-control) {
  justify-content: space-between;
}

.share-switch :deep(.v-label) {
  font-size: 0.75rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (min-width: 601px) {
  .input-footer {
    flex-wrap: nowrap;
    gap: 0;
  }

  .share-switch-row {
    flex: 0 1 auto;
    width: auto;
    order: 0;
    margin-left: 8px;
  }

  .share-switch {
    width: auto;
  }

  .share-switch :deep(.v-input__control),
  .share-switch :deep(.v-selection-control) {
    width: auto;
  }

  .share-switch :deep(.v-selection-control) {
    justify-content: flex-start;
  }
}

.post-btn {
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(79, 209, 197, 0.3) !important;
}

.comment-body {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border-left: 3px solid rgba(79, 209, 197, 0.4);
}

.author-avatar {
  border: 1px solid rgba(79, 209, 197, 0.45);
  background: rgba(15, 23, 42, 0.9);
  color: #FFFFFF;
  font-weight: 700;
  font-size: 12px;
}

.author-name {
  color: #4FD1C5;
  font-size: 0.9rem;
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

.border-accent {
  border: 1px solid rgba(79, 209, 197, 0.2);
}

.preview-frame {
  position: relative;
  display: inline-block;
}

.remove-img-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.empty-diary {
  background: rgba(30, 41, 59, 0.3);
  border: 2px dashed rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}
</style>
<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  challengeId: {
    type: String,
    required: true
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

const emit = defineEmits(['entry-shared'])

const { t, locale } = useI18n()

const state = reactive({
  entries: [],
  loading: false,
  addingEntry: false,
  newEntryText: '',
  newEntryImageUrl: null,
  newEntryImagePreview: null,
  newEntryImageName: null,
  uploadingImage: false,
  shareToCommunity: false
})

const fileInputRef = ref(null)

const IMGBB_API_KEY = 'd8a4925b372143b44469009f92023386'

const canWrite = computed(() => props.isOwner && !!props.currentUserId && !props.isFinished)

const sortedEntries = computed(() => {
  return [...state.entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

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
  state.uploadingImage = true
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
    state.uploadingImage = false
  }
}

async function handleImageSelect(event) {
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

  const reader = new FileReader()
  reader.onload = (e) => {
    state.newEntryImagePreview = e.target.result
    state.newEntryImageName = file.name
  }
  reader.readAsDataURL(file)

  try {
    state.newEntryImageUrl = await uploadImage(file)
  } catch (error) {
    alert(error.message || t('challenges.uploadError'))
    state.newEntryImagePreview = null
    state.newEntryImageName = null
    state.newEntryImageUrl = null
  }
}

function removeImagePreview() {
  state.newEntryImageUrl = null
  state.newEntryImagePreview = null
  state.newEntryImageName = null
}

async function loadEntries() {
  if (!props.challengeId || !props.currentUserId || !props.isOwner) {
    state.entries = []
    return
  }

  state.loading = true
  try {
    const { data } = await challengeService.getDiaryEntries(props.challengeId, props.currentUserId)
    state.entries = data.entries || []
  } catch (error) {
    state.entries = []
  } finally {
    state.loading = false
  }
}

async function addEntry() {
  if ((!state.newEntryText.trim() && !state.newEntryImageUrl) || !props.currentUserId || state.addingEntry) return

  if (state.newEntryImagePreview && !state.newEntryImageUrl && state.uploadingImage) {
    await new Promise(resolve => setTimeout(resolve, 500))
    if (!state.newEntryImageUrl) {
      alert(t('challenges.uploadInProgress'))
      return
    }
  }

  state.addingEntry = true
  try {
    const entryText = state.newEntryText.trim() || (state.newEntryImageUrl ? ' ' : '')
    const imageUrl = state.newEntryImageUrl ? String(state.newEntryImageUrl).trim() : null

    if (!entryText && !imageUrl) {
      state.addingEntry = false
      return
    }

    const shared = state.shareToCommunity
    const { data } = await challengeService.addDiaryEntry(
      props.challengeId,
      props.currentUserId,
      entryText,
      imageUrl,
      shared
    )

    state.newEntryText = ''
    state.newEntryImageUrl = null
    state.newEntryImagePreview = null
    state.newEntryImageName = null
    state.shareToCommunity = false

    await loadEntries()

    if (shared && data?.sharedCommentId) {
      emit('entry-shared', data.sharedCommentId)
    }
  } finally {
    state.addingEntry = false
  }
}

async function deleteEntry(entry) {
  if (!entry?._id) return
  if (!confirm(t('challenges.comments.deleteConfirm'))) return

  try {
    await challengeService.deleteDiaryEntry(props.challengeId, entry._id, props.currentUserId)
    await loadEntries()
  } catch (error) {
  }
}

function getEntryName(entry) {
  return entry.userId?.name || t('common.unknown')
}

function getEntryAvatar(entry) {
  return entry.userId?.avatarUrl || ''
}

function getEntryInitial(entry) {
  const name = entry.userId?.name
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

watch(() => props.challengeId, () => {
  loadEntries()
})

watch(() => props.currentUserId, () => {
  loadEntries()
})

onMounted(() => {
  loadEntries()
})
</script>
