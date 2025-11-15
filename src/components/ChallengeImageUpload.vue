<template>
  <div class="challenge-image-upload">
    <template v-if="editable">
      <div class="image-upload-section mb-4">
        <label class="text-body-2 mb-2 d-block">{{ t('challenges.challengeImage') }}</label>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden-file-input"
          :disabled="uploadingImage"
          @change="handleImageSelection"
        />
        <div class="image-upload-wrapper">
          <div
            class="image-upload-area"
            :class="{ 'uploading': uploadingImage, 'has-image': modelValue }"
            @click="triggerFileInput"
          >
            <div v-if="modelValue" class="image-preview">
              <v-img :src="modelValue" cover class="preview-img"></v-img>
              <div class="image-overlay">
                <v-icon color="white" size="24">mdi-camera</v-icon>
                <span class="overlay-text">{{ uploadingImage ? t('challenges.uploading') : t('challenges.clickToChange') }}</span>
              </div>
            </div>
            <div v-else class="image-placeholder">
              <v-icon size="48" color="grey">mdi-image-plus</v-icon>
              <p class="mt-2 text-body-2">{{ uploadingImage ? t('challenges.uploading') : t('challenges.clickToUpload') }}</p>
            </div>
          </div>
          <v-btn
            v-if="modelValue && !uploadingImage"
            icon
            color="error"
            size="small"
            class="delete-image-btn"
            @click.stop="deleteImage"
          >
            <v-icon color="#b71c1c">mdi-delete</v-icon>
          </v-btn>
        </div>
        <v-alert v-if="imageError" type="error" class="mt-2" density="compact">
          {{ imageError }}
        </v-alert>
      </div>
    </template>
    <template v-else>
      <div v-if="modelValue" class="mb-4">
        <v-img :src="modelValue" cover class="challenge-image-display" max-height="300"></v-img>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  editable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

// Hardcoded ImgBB API key
const IMGBB_API_KEY = 'd8a4925b372143b44469009f92023386'

const fileInputRef = ref(null)
const uploadingImage = ref(false)
const imageError = ref('')

const triggerFileInput = () => {
  if (uploadingImage.value || !fileInputRef.value) return
  fileInputRef.value.click()
}

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

const deleteImage = () => {
  emit('update:modelValue', '')
  imageError.value = ''
}

const handleImageSelection = async (event) => {
  imageError.value = ''
  const files = event.target.files
  if (!files || files.length === 0) {
    return
  }

  const file = files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    imageError.value = t('challenges.uploadInvalidType')
    return
  }

  const maxSizeMb = 5
  if (file.size > maxSizeMb * 1024 * 1024) {
    imageError.value = t('challenges.uploadTooLarge', { size: maxSizeMb })
    return
  }

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

    emit('update:modelValue', imageUrl)
  } catch (err) {
    console.error('Image upload failed:', err)
    imageError.value = err.message || t('challenges.uploadError')
  } finally {
    uploadingImage.value = false
    // Reset input so same file can be selected again
    if (event.target) {
      event.target.value = ''
    }
  }
}
</script>

<style scoped>
.challenge-image-display {
  border-radius: 8px;
  overflow: hidden;
}

.image-upload-section {
  width: 100%;
}

.image-upload-wrapper {
  position: relative;
  width: 100%;
}

.hidden-file-input {
  display: none;
}

.delete-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9) !important;
}

.delete-image-btn :deep(.v-icon) {
  color: #b71c1c !important;
}

.image-upload-area {
  width: 100%;
  min-height: 200px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.image-upload-area:hover {
  border-color: #1976d2;
  background-color: #f5f5f5;
}

.image-upload-area.uploading {
  border-color: #1976d2;
  pointer-events: none;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 200px;
}

.preview-img {
  width: 100%;
  height: 100%;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.image-upload-area.has-image:hover .image-overlay {
  opacity: 1;
}

.image-upload-area.uploading .image-overlay {
  opacity: 1;
}

.overlay-text {
  color: white;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}
</style>

