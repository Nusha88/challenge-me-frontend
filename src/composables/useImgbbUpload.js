import { ref } from 'vue'

const IMGBB_API_KEY = 'd8a4925b372143b44469009f92023386'

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

export function useImgbbUpload() {
  const uploadingImage = ref(false)

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

  return {
    uploadingImage,
    uploadImage,
    readFileAsBase64
  }
}

export { IMGBB_API_KEY, readFileAsBase64 }
