<template>
  <div class="tactical-input-wrapper">
    <v-textarea
      :model-value="text"
      :placeholder="placeholder"
      auto-grow
      rows="1"
      max-rows="6"
      variant="plain"
      class="comment-field px-4 pt-3"
      hide-details
      :disabled="loading"
      @update:model-value="$emit('update:text', $event)"
      @keydown.enter.exact.prevent="onEnter"
    ></v-textarea>

    <div v-if="imagePreview" class="px-4 pb-3">
      <div class="preview-thumb">
        <v-img :src="imagePreview" width="64" height="64" cover class="rounded-lg border-accent"></v-img>
        <v-btn
          icon="mdi-close"
          size="x-small"
          color="error"
          class="remove-img-btn"
          @click="removeImage"
        ></v-btn>
      </div>
    </div>

    <div class="input-footer pa-2">
      <input ref="fileInputRef" type="file" accept="image/*" class="d-none" @change="onImageSelect" />
      <v-btn
        icon="mdi-camera-plus-outline"
        variant="text"
        color="rgba(255,255,255,0.5)"
        size="small"
        :disabled="loading"
        @click="fileInputRef?.click()"
      ></v-btn>

      <div v-if="showShareSwitch" class="share-switch-row">
        <v-switch
          :model-value="shareToCommunity"
          color="#4FD1C5"
          density="compact"
          hide-details
          inset
          class="share-switch"
          :label="t('challenges.diary.shareToCommunity')"
          @update:model-value="$emit('update:shareToCommunity', $event)"
        ></v-switch>
      </div>

      <v-spacer class="footer-spacer"></v-spacer>

      <v-btn
        v-if="!hideSubmit"
        color="#4FD1C5"
        variant="flat"
        size="small"
        class="post-btn px-6 font-weight-black"
        :loading="loading || uploadingImage"
        :disabled="submitDisabled"
        @click="$emit('submit')"
      >
        {{ submitLabel || t('challenges.comments.post') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useImgbbUpload } from '../composables/useImgbbUpload'

const props = defineProps({
  text: { type: String, default: '' },
  imageUrl: { type: String, default: null },
  shareToCommunity: { type: Boolean, default: false },
  showShareSwitch: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  submitLabel: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  hideSubmit: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:text',
  'update:imageUrl',
  'update:shareToCommunity',
  'submit',
  'uploading'
])

const { t } = useI18n()
const { uploadingImage, uploadImage } = useImgbbUpload()

const fileInputRef = ref(null)
const imagePreview = ref(null)

const submitDisabled = computed(() => {
  return (!props.text.trim() && !props.imageUrl) || uploadingImage.value
})

async function onImageSelect(event) {
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
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)

  emit('uploading', true)
  try {
    const url = await uploadImage(file)
    emit('update:imageUrl', url)
  } catch (error) {
    alert(error.message || t('challenges.uploadError'))
    imagePreview.value = null
    emit('update:imageUrl', null)
  } finally {
    emit('uploading', false)
  }

  if (event.target) {
    event.target.value = ''
  }
}

function removeImage() {
  imagePreview.value = null
  emit('update:imageUrl', null)
}

function onEnter() {
  if (props.hideSubmit) return
  if (!submitDisabled.value) {
    emit('submit')
  }
}

function reset() {
  imagePreview.value = null
}

function getImagePreview() {
  return imagePreview.value
}

defineExpose({ reset, getImagePreview })
</script>

<style scoped>
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

.border-accent {
  border: 1px solid rgba(79, 209, 197, 0.2);
}

.preview-thumb {
  position: relative;
  display: inline-block;
  width: 64px;
  height: 64px;
}

.remove-img-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}
</style>
