import {
  captureElementToPng,
  waitForPaint,
  dataUrlToFile,
  downloadImage,
  shareOrDownloadImage,
  rasterizeImageToPngDataUrl
} from './shareImage'

const CARD_WIDTH = 540
const CARD_HEIGHT = 960

function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'))
  return Promise.all(imgs.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve()
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true })
      img.addEventListener('error', resolve, { once: true })
    })
  }))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForQrImage(root, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const qr = root.querySelector('.qr-container img')
    if (qr && qr.getAttribute('src') && qr.complete && qr.naturalWidth > 0) return
    await sleep(40)
  }
}

async function bakeAvatarForCapture(root) {
  const img = root.querySelector('.ranked-avatar-face img')
  if (!img) return

  const src = img.currentSrc || img.getAttribute('src') || ''
  if (!src) return

  const cssSize = Math.max(
    Math.round(img.getBoundingClientRect().width || 0),
    img.clientWidth || 0,
    160
  )

  const pngSrc = src.includes('image/svg+xml') || /\.svg(\?|$)/i.test(src)
    ? await rasterizeImageToPngDataUrl(src, cssSize * 2)
    : src

  const image = new Image()
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.src = pngSrc
  })

  const canvas = document.createElement('canvas')
  const pixelRatio = 2
  canvas.width = cssSize * pixelRatio
  canvas.height = cssSize * pixelRatio
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  canvas.style.borderRadius = '50%'
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  img.replaceWith(canvas)
}

export async function captureVictoryCard(element) {
  if (!element) {
    throw new Error('Victory card element missing')
  }

  await waitForQrImage(element)

  const host = document.createElement('div')
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${CARD_WIDTH}px`,
    height: `${CARD_HEIGHT}px`,
    pointerEvents: 'none',
    zIndex: '-1'
  })

  const clone = element.cloneNode(true)
  clone.style.transform = 'none'
  clone.style.margin = '0'
  clone.style.position = 'relative'
  clone.style.left = '0'
  clone.style.top = '0'
  clone.style.width = `${CARD_WIDTH}px`
  clone.style.height = `${CARD_HEIGHT}px`
  host.appendChild(clone)
  document.body.appendChild(host)

  try {
    await bakeAvatarForCapture(clone)
    await waitForImages(clone)
    await waitForPaint()
    return await captureElementToPng(clone, {
      backgroundColor: '#0b0d12',
      scale: 2,
      useHtml2Canvas: true
    })
  } finally {
    host.remove()
  }
}

export function buildVictoryShareFile(dataUrl, fileName) {
  return dataUrlToFile(dataUrl, fileName)
}

export async function shareVictoryImage(dataUrl, fileName, shareOptions = {}) {
  return shareOrDownloadImage(dataUrl, fileName, shareOptions)
}

export async function downloadVictoryImage(dataUrl, fileName) {
  downloadImage(dataUrl, fileName)
  return 'downloaded'
}
