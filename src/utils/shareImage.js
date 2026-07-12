export function dataUrlToFile(dataUrl, fileName) {
  const [head, body] = dataUrl.split(',')
  const mime = head.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], fileName, { type: mime })
}

export function downloadImage(dataUrl, fileName) {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

/**
 * @returns {'shared' | 'cancelled' | 'unsupported'}
 */
export async function shareImageFile(dataUrl, fileName, { title = 'Ignite', text = '' } = {}) {
  try {
    if (typeof navigator === 'undefined' || !navigator.canShare) return 'unsupported'

    const file = dataUrlToFile(dataUrl, fileName)
    if (!navigator.canShare({ files: [file] })) return 'unsupported'

    await navigator.share({
      files: [file],
      title,
      text
    })
    return 'shared'
  } catch (error) {
    if (error?.name === 'AbortError') return 'cancelled'
    console.warn('Native share unavailable, falling back to download:', error)
    return 'unsupported'
  }
}

/**
 * @returns {'shared' | 'cancelled' | 'downloaded'}
 */
export async function shareOrDownloadImage(dataUrl, fileName, options = {}) {
  const shareResult = await shareImageFile(dataUrl, fileName, options)
  if (shareResult === 'shared' || shareResult === 'cancelled') {
    return shareResult
  }

  downloadImage(dataUrl, fileName)
  return 'downloaded'
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function resolveImageDataUrl(src) {
  if (!src || src.startsWith('data:')) return src

  try {
    const response = await fetch(src, { mode: 'cors', cache: 'no-cache' })
    if (!response.ok) throw new Error('fetch failed')
    return await blobToDataUrl(await response.blob())
  } catch {
    return new Promise((resolve, reject) => {
      const loader = new Image()
      loader.crossOrigin = 'anonymous'
      loader.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = loader.naturalWidth
          canvas.height = loader.naturalHeight
          canvas.getContext('2d').drawImage(loader, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } catch (err) {
          reject(err)
        }
      }
      loader.onerror = () => reject(new Error('Image load failed'))
      loader.src = src.includes('?') ? `${src}&_=${Date.now()}` : `${src}?_=${Date.now()}`
    })
  }
}

export async function prepareHeroImageForExport(rootElement, selector = '.invite-card-hero-image') {
  const heroImg = rootElement?.querySelector(selector)
  if (!heroImg?.src || heroImg.src.startsWith('data:')) {
    return () => {}
  }

  const previousSrc = heroImg.src

  try {
    heroImg.src = await resolveImageDataUrl(previousSrc)
    await new Promise((resolve) => {
      if (heroImg.complete) {
        resolve()
        return
      }
      heroImg.onload = () => resolve()
      heroImg.onerror = () => resolve()
    })
  } catch (error) {
    console.warn('Hero image export preparation failed:', error)
  }

  return () => {
    heroImg.src = previousSrc
  }
}
