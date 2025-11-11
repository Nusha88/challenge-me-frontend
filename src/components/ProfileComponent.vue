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
          <v-card
            v-if="isApiKeyConfigurable"
            class="mb-4"
            variant="tonal"
          >
            <v-card-title class="text-subtitle-1">
              {{ t('profile.apiKeyTitle') }}
            </v-card-title>
            <v-card-text>
              <p class="mb-2">{{ t('profile.apiKeyDescription') }}</p>
              <v-text-field
                v-model="apiKeyInput"
                :label="t('profile.apiKeyLabel')"
                prepend-icon="mdi-key"
                variant="outlined"
                density="comfortable"
                autocomplete="off"
              ></v-text-field>
              <div class="d-flex" style="gap: 8px;">
                <v-btn
                  color="primary"
                  :loading="apiKeySaving"
                  :disabled="apiKeySaving"
                  @click="saveApiKey"
                >
                  {{ t('profile.apiKeySave') }}
                </v-btn>
                <v-btn
                  color="secondary"
                  variant="text"
                  @click="clearApiKey"
                >
                  {{ t('profile.apiKeyClear') }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
          <div class="avatar-wrapper mb-4">
            <v-avatar size="128">
              <template v-if="user.avatarUrl">
                <v-img :src="user.avatarUrl" :alt="user.name" cover></v-img>
              </template>
              <template v-else>
                <span class="avatar-initials">{{ userInitials }}</span>
              </template>
            </v-avatar>
          </div>
          <v-file-input
            v-if="effectiveApiKey"
            accept="image/*"
            :label="t('profile.uploadLabel')"
            show-size
            prepend-icon="mdi-camera"
            :loading="uploading"
            :disabled="uploading"
            @update:model-value="handleAvatarSelection"
            clearable
            density="comfortable"
            :hint="t('profile.uploadHint')"
            persistent-hint
          ></v-file-input>
          <v-alert v-else type="info" class="mb-4">
            {{ t('profile.missingApiKey') }}
          </v-alert>
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
        <v-alert v-else type="info">{{ t('profile.noData') }}</v-alert>
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
const envApiKey = import.meta.env.VITE_IMGBB_API_KEY || ''
const storedApiKey = ref('')
const apiKeyInput = ref('')
const apiKeySaving = ref(false)

const effectiveApiKey = computed(() => envApiKey || storedApiKey.value)
const isApiKeyConfigurable = computed(() => !envApiKey)

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
  loading.value = true
  error.value = ''
  try {
    const response = await userService.getProfile()
    user.value = response.data.user
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.profileError')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProfile()
  try {
    const cachedKey = localStorage.getItem('imgbbApiKey') || ''
    storedApiKey.value = cachedKey
    apiKeyInput.value = cachedKey
  } catch (storageError) {
    storedApiKey.value = ''
  }
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

  const apiKey = effectiveApiKey.value
  if (!apiKey) {
    uploadError.value = t('profile.missingApiKey')
    return
  }

  uploading.value = true

  try {
    const base64 = await readFileAsBase64(file)
    const formData = new FormData()
    formData.append('image', base64)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
    })

    const payload = await response.json()

    if (!response.ok || !payload.success) {
      throw new Error(payload?.data?.error?.message || 'Upload failed')
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

const saveApiKey = () => {
  uploadError.value = ''
  uploadSuccess.value = ''
  const trimmed = apiKeyInput.value.trim()

  if (!trimmed) {
    apiKeySaving.value = true
    try {
      storedApiKey.value = ''
      localStorage.removeItem('imgbbApiKey')
      uploadSuccess.value = t('profile.apiKeyCleared')
    } catch (storageError) {
      uploadError.value = t('profile.apiKeySaveFailed')
    } finally {
      apiKeySaving.value = false
    }
    return
  }

  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    uploadError.value = t('profile.apiKeyInvalid')
    return
  }

  apiKeySaving.value = true
  try {
    localStorage.setItem('imgbbApiKey', trimmed)
    storedApiKey.value = trimmed
    uploadSuccess.value = t('profile.apiKeySaved')
  } catch (storageError) {
    uploadError.value = t('profile.apiKeySaveFailed')
  } finally {
    apiKeySaving.value = false
  }
}

const clearApiKey = () => {
  apiKeyInput.value = ''
  saveApiKey()
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
}
</style> 