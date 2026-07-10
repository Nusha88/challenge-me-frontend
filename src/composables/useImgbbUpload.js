import { ref } from 'vue'
import { uploadService } from '../services/api'

function readFileAsBase64(file) {
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

// Uploads an image via the backend proxy (which holds the ImgBB key) and
// returns the resulting URL.
async function uploadImageFile(file) {
  const base64 = await readFileAsBase64(file)
  const response = await uploadService.uploadImageBase64(base64)
  const imageUrl = response?.data?.url
  if (!imageUrl) {
    throw new Error('Upload did not return an image URL')
  }
  return imageUrl
}

export function useImgbbUpload() {
  const uploadingImage = ref(false)

  async function uploadImage(file) {
    uploadingImage.value = true
    try {
      return await uploadImageFile(file)
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
