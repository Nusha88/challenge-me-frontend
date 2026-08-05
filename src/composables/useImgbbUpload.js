import { ref } from 'vue'
import { uploadService } from '../services/api'
import { prepareImageForUpload, readFileAsBase64 } from '../utils/imageUpload'

// Uploads an image via the backend proxy (which holds the ImgBB key) and
// returns the resulting URL. Compresses first to keep the base64 payload small.
async function uploadImageFile(file, { maxSizeMb = 5 } = {}) {
  const base64 = await prepareImageForUpload(file, { maxSizeMb })
  const response = await uploadService.uploadImageBase64(base64)
  const imageUrl = response?.data?.url
  if (!imageUrl) {
    throw new Error('Upload did not return an image URL')
  }
  return imageUrl
}

export function useImgbbUpload() {
  const uploadingImage = ref(false)

  async function uploadImage(file, options) {
    uploadingImage.value = true
    try {
      return await uploadImageFile(file, options)
    } finally {
      uploadingImage.value = false
    }
  }

  return {
    uploadingImage,
    uploadImage,
    readFileAsBase64
  }
}

export { readFileAsBase64, uploadImageFile }
