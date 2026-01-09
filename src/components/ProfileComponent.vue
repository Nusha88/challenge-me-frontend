<template>
  <div class="profile-container">
    <v-card class="profile-card">
      <v-card-title class="text-h4 mb-4">{{ t('profile.title') }}</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <v-alert v-if="uploadError" type="error" class="mb-4">{{ uploadError }}</v-alert>
        <v-alert v-if="uploadSuccess" type="success" class="mb-4">{{ uploadSuccess }}</v-alert>
        <v-skeleton-loader v-if="loading" type="card"></v-skeleton-loader>
        <div v-else-if="user">
          <div class="avatar-wrapper mb-4">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden-file-input"
              :disabled="uploading"
              @change="handleFileInputChange"
            />
            <div
              class="avatar-clickable"
              :class="{ 'uploading': uploading }"
              @click="triggerFileInput"
            >
              <v-avatar size="128" class="avatar-display" :class="{ 'avatar-no-image': !user.avatarUrl }">
                <template v-if="user.avatarUrl">
                  <v-img :src="user.avatarUrl" :alt="user.name" cover></v-img>
                </template>
                <template v-else>
                  <span class="avatar-initials">{{ userInitials }}</span>
                </template>
              </v-avatar>
              <div class="avatar-overlay">
                <v-progress-circular
                  v-if="uploading"
                  indeterminate
                  color="white"
                  size="32"
                  width="3"
                ></v-progress-circular>
                <v-icon v-else size="32" color="white">mdi-camera</v-icon>
                <span class="avatar-overlay-text">{{ uploading ? t('profile.uploading') : t('profile.clickToUpload') }}</span>
              </div>
            </div>
          </div>
          <v-list>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.name') }}:</strong> {{ user.name }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.age') }}:</strong> {{ user.age }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.country') }}:</strong> {{ formatCountry(user.country) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title><strong>{{ t('profile.registered') }}:</strong> {{ formatDate(user.createdAt) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
        <v-alert v-else-if="!error" type="info">{{ t('profile.noData') }}</v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { userService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { getCountryDisplayName } from '../utils/countries'

const user = ref(null)
const loading = ref(false)
const error = ref('')
const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
const { t, locale } = useI18n()
const fileInputRef = ref(null)

// Hardcoded ImgBB API key for all users
const IMGBB_API_KEY = 'd8a4925b372143b44469009f92023386'

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(new Date(dateString))
  } catch (err) {
    return dateString
  }
}

const formatCountry = (value) => {
  if (!value) return t('common.unknown')
  const name = getCountryDisplayName(value, locale.value)
  return name || t('common.unknown')
}

const fetchProfile = async () => {
  // Check if user is logged in
  const token = localStorage.getItem('token')
  if (!token) {
    error.value = t('profile.notLoggedIn')
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''
  try {
    const response = await userService.getProfile()
    if (response.data?.user) {
      user.value = response.data.user
    } else {
      error.value = t('profile.noData')
    }
  } catch (err) {
    // Handle specific error cases
    if (err.response?.status === 401 || err.response?.status === 403) {
      error.value = t('profile.invalidToken')
      // Clear invalid token
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event('auth-changed'))
    } else if (err.response?.status === 404) {
      error.value = t('profile.userNotFound')
    } else {
      error.value = err.response?.data?.message || t('notifications.profileError')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
})

const userInitials = computed(() => {
  if (!user.value?.name) return '?'
  const parts = user.value.name.trim().split(' ')
  const initials = parts.length === 1
    ? parts[0].slice(0, 2)
    : `${parts[0][0] || ''}${parts[1][0] || ''}`
  return initials.toUpperCase()
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

const handleAvatarSelection = async (files) => {
  uploadError.value = ''
  uploadSuccess.value = ''

  if (!files || (Array.isArray(files) && files.length === 0)) {
    return
  }

  const file = Array.isArray(files) ? files[0] : files
  if (!file) return

  if (!file.type.startsWith('image/')) {
    uploadError.value = t('profile.uploadInvalidType')
    return
  }

  const maxSizeMb = 5
  if (file.size > maxSizeMb * 1024 * 1024) {
    uploadError.value = t('profile.uploadTooLarge', { size: maxSizeMb })
    return
  }

  uploading.value = true

  try {
    const base64 = await readFileAsBase64(file)
    
    // ImgBB API expects form-encoded data, not FormData
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
      console.error('ImgBB API error:', payload)
      throw new Error(errorMsg)
    }

    const imageUrl = payload?.data?.url || payload?.data?.display_url
    if (!imageUrl) {
      throw new Error('Upload did not return an image URL')
    }

    const updateResponse = await userService.updateProfile({ avatarUrl: imageUrl })
    user.value = updateResponse.data.user

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      storedUser.avatarUrl = imageUrl
      if (user.value?.name) {
        storedUser.name = user.value.name
      }
      localStorage.setItem('user', JSON.stringify(storedUser))
    } catch (storageError) {
      console.warn('Unable to update localStorage user payload:', storageError)
    }

    uploadSuccess.value = t('profile.uploadSuccess')
    window.dispatchEvent(new Event('auth-changed'))
  } catch (err) {
    console.error('Avatar upload failed:', err)
    uploadError.value = err.message || t('profile.uploadError')
  } finally {
    uploading.value = false
  }
}

const triggerFileInput = () => {
  if (uploading.value || !fileInputRef.value) return
  fileInputRef.value.click()
}

const handleFileInputChange = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    handleAvatarSelection(files[0])
  }
  // Reset input so same file can be selected again
  if (event.target) {
    event.target.value = ''
  }
}
</script>

<style scoped>
.profile-container {
  min-height: calc(100vh - 24px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.profile-card {
  width: 100%;
  max-width: 500px;
  padding: 24px;
}

.v-card-title {
  text-align: center;
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.avatar-clickable {
  position: relative;
  cursor: pointer;
  display: inline-block;
}

.avatar-clickable:hover .avatar-overlay {
  opacity: 1;
}

.avatar-clickable.uploading .avatar-overlay {
  opacity: 1;
}

.avatar-display {
  transition: opacity 0.2s;
}

.avatar-clickable:hover .avatar-display {
  opacity: 0.8;
}

.avatar-no-image {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.avatar-overlay-text {
  color: white;
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
}

.hidden-file-input {
  display: none;
}

.avatar-initials {
  font-size: 32px;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
}
</style> 