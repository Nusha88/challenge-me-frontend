const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i

export function isImageFile(file) {
  if (!file) return false
  if (file.type?.startsWith('image/')) return true
  return IMAGE_EXTENSIONS.test(file.name || '')
}

export function readFileAsBase64(file) {
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

export function compressImageFile(file, { maxWidth = 1920, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = image
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Unable to prepare image'))
        return
      }

      ctx.drawImage(image, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Unable to prepare image'))
            return
          }
          resolve(blob)
        },
        'image/jpeg',
        quality
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read image'))
    }

    image.src = objectUrl
  })
}

export async function prepareImageForUpload(file, { maxSizeMb = 5 } = {}) {
  let uploadBlob = file

  if (file.size > maxSizeMb * 1024 * 1024 || !file.type?.startsWith('image/jpeg')) {
    try {
      uploadBlob = await compressImageFile(file)
    } catch (error) {
      console.warn('Image compression failed, uploading original file:', error)
      uploadBlob = file
    }
  }

  if (uploadBlob.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`Image exceeds ${maxSizeMb}MB after compression`)
  }

  return readFileAsBase64(uploadBlob)
}
