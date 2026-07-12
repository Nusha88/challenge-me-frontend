import { uploadService } from '../services/api'

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

function resolveViaImageElement(src) {
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

async function resolveViaBackendProxy(src) {
  const response = await uploadService.fetchImageDataUrl(src)
  const dataUrl = response?.data?.dataUrl
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Backend image proxy did not return dataUrl')
  }
  return dataUrl
}

export async function resolveImageDataUrl(src) {
  if (!src || src.startsWith('data:')) return src

  try {
    const response = await fetch(src, { mode: 'cors', cache: 'no-cache' })
    if (!response.ok) throw new Error('fetch failed')
    return await blobToDataUrl(await response.blob())
  } catch {
    try {
      return await resolveViaImageElement(src)
    } catch {
      return resolveViaBackendProxy(src)
    }
  }
}

function paintImageCover(ctx, width, height, image) {
  if (!ctx) return

  const imgRatio = image.naturalWidth / image.naturalHeight
  const canvasRatio = width / height
  let drawWidth
  let drawHeight
  let offsetX
  let offsetY

  if (imgRatio > canvasRatio) {
    drawHeight = height
    drawWidth = height * imgRatio
    offsetX = (width - drawWidth) / 2
    offsetY = 0
  } else {
    drawWidth = width
    drawHeight = width / imgRatio
    offsetX = 0
    offsetY = (height - drawHeight) / 2
  }

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
}

async function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = dataUrl
  })
}

export async function replaceHeroWithCanvasForExport(rootElement, imageSrc, selector = '.invite-card-hero-image') {
  const hero = rootElement?.querySelector('.invite-card-hero')
  const existingImg = rootElement?.querySelector(selector)
  if (!hero || !imageSrc) {
    return () => {}
  }

  const dataUrl = imageSrc.startsWith('data:') ? imageSrc : await resolveImageDataUrl(imageSrc)
  const image = await loadImageFromDataUrl(dataUrl)

  const width = existingImg?.clientWidth || hero.clientWidth || 420
  const height = existingImg?.clientHeight || hero.clientHeight || 210
  const pixelRatio = 2

  const canvas = document.createElement('canvas')
  canvas.width = width * pixelRatio
  canvas.height = height * pixelRatio
  canvas.className = `${selector.replace('.', '')} invite-card-hero-canvas`
  canvas.style.position = 'absolute'
  canvas.style.inset = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'

  const ctx = canvas.getContext('2d')
  ctx.scale(pixelRatio, pixelRatio)
  paintImageCover(ctx, width, height, image)

  if (existingImg) {
    existingImg.style.display = 'none'
  }
  hero.insertBefore(canvas, hero.firstChild)

  return () => {
    canvas.remove()
    if (existingImg) {
      existingImg.style.display = ''
    }
  }
}

export async function prepareHeroImageForExport(rootElement, imageSrc, selector = '.invite-card-hero-image') {
  const heroImg = rootElement?.querySelector(selector)
  if (!imageSrc) {
    return () => {}
  }

  if (heroImg?.src?.startsWith('data:')) {
    return () => {}
  }

  try {
    const dataUrl = await resolveImageDataUrl(imageSrc)
    if (heroImg) {
      const previousSrc = heroImg.src
      heroImg.src = dataUrl
      await new Promise((resolve) => {
        if (heroImg.complete) {
          resolve()
          return
        }
        heroImg.onload = () => resolve()
        heroImg.onerror = () => resolve()
      })
      return () => {
        heroImg.src = previousSrc
      }
    }

    return await replaceHeroWithCanvasForExport(rootElement, dataUrl, selector)
  } catch (error) {
    console.warn('Hero image export preparation failed:', error)
    return await replaceHeroWithCanvasForExport(rootElement, imageSrc, selector)
  }
}
