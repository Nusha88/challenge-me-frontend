import html2canvas from 'html2canvas'
import crystalImage from '../assets/home/crystal-320.webp'
import { shareOrDownloadImage, waitForPaint, dataUrlToFile, downloadImage } from './shareImage'

function waitForImageLoad(img) {
  if (img.complete && img.naturalWidth > 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Crystal image failed to load'))
  })
}

function titleCaseReadable(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  // Avoid shouting UPPERCASE walls on Stories while keeping intentional acronyms short.
  if (text === text.toUpperCase() && text.length > 4) {
    return text.charAt(0) + text.slice(1).toLowerCase()
  }
  return text
}

/**
 * Builds a shareable victory poster.
 * @param {object} options
 * @param {'story'|'square'} [options.format='story'] — 9:16 Stories or 1:1 feed post
 */
export async function buildVictoryImageDataUrl(options) {
  const {
    userName = 'Hero',
    challenges = [],
    checklistTasks = [],
    streakDays = null,
    format = 'story',
    translations = {}
  } = options

  const t = {
    conqueredTitle: 'DAY CONQUERED',
    missionsLabel: 'Missions',
    stepsLabel: 'Daily steps',
    stepsCompleted: 'Daily steps completed',
    dayStreak: 'day streak',
    tagline: 'Show up. Level up.',
    ...translations
  }

  const isSquare = format === 'square'
  const width = isSquare ? 1080 : 540
  const height = isSquare ? 1080 : 960
  const padX = isSquare ? 72 : 45
  const padY = isSquare ? 72 : 56
  const titleSize = isSquare ? 64 : 42
  const nameSize = isSquare ? 48 : 34
  const missionTitleSize = isSquare ? 28 : 18

  const container = document.createElement('div')
  Object.assign(container.style, {
    position: 'absolute',
    left: '-9999px',
    width: `${width}px`,
    height: `${height}px`,
    padding: `${padY}px ${padX}px`,
    background: '#0b0d12',
    color: '#ffffff',
    fontFamily: '"Plus Jakarta Sans", "Montserrat", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflow: 'hidden',
    zIndex: '1'
  })

  const grid = document.createElement('div')
  Object.assign(grid.style, {
    position: 'absolute',
    inset: '0',
    opacity: '0.08',
    background: `linear-gradient(to right, rgba(79, 209, 197, 0.14) 1px, transparent 1px),
                 linear-gradient(to bottom, rgba(79, 209, 197, 0.14) 1px, transparent 1px)`,
    backgroundSize: '32px 32px',
    zIndex: '2'
  })
  container.appendChild(grid)

  const glow1 = document.createElement('div')
  Object.assign(glow1.style, {
    position: 'absolute',
    top: '-12%',
    right: '-12%',
    width: isSquare ? '480px' : '340px',
    height: isSquare ? '480px' : '340px',
    background: 'rgba(166, 46, 232, 0.32)',
    borderRadius: '50%',
    filter: 'blur(100px)',
    zIndex: '2'
  })
  container.appendChild(glow1)

  const glow2 = document.createElement('div')
  Object.assign(glow2.style, {
    position: 'absolute',
    bottom: '8%',
    left: '-12%',
    width: isSquare ? '420px' : '300px',
    height: isSquare ? '420px' : '300px',
    background: 'rgba(79, 209, 197, 0.22)',
    borderRadius: '50%',
    filter: 'blur(90px)',
    zIndex: '2'
  })
  container.appendChild(glow2)

  // Hero header
  const header = document.createElement('div')
  Object.assign(header.style, {
    position: 'relative',
    zIndex: '10',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: isSquare ? '48px' : '36px'
  })

  const headerLeft = document.createElement('div')
  Object.assign(headerLeft.style, { display: 'flex', flexDirection: 'column', flex: '1', minWidth: '0' })

  const badge = document.createElement('div')
  badge.textContent = 'IGNITE'
  Object.assign(badge.style, {
    display: 'inline-block',
    alignSelf: 'flex-start',
    padding: '6px 14px',
    border: '1px solid #4FD1C5',
    borderRadius: '999px',
    color: '#4FD1C5',
    fontSize: isSquare ? '16px' : '12px',
    letterSpacing: '0.14em',
    fontWeight: '800',
    marginBottom: '16px',
    background: 'rgba(79, 209, 197, 0.12)'
  })
  headerLeft.appendChild(badge)

  const title = document.createElement('h1')
  title.textContent = t.conqueredTitle
  Object.assign(title.style, {
    fontSize: `${titleSize}px`,
    fontWeight: '900',
    margin: '0 0 10px',
    lineHeight: '1.05',
    letterSpacing: '-0.02em'
  })
  headerLeft.appendChild(title)

  const nameEl = document.createElement('div')
  nameEl.textContent = userName
  Object.assign(nameEl.style, {
    fontSize: `${nameSize}px`,
    fontWeight: '800',
    color: '#4FD1C5',
    marginBottom: streakDays ? '18px' : '0'
  })
  headerLeft.appendChild(nameEl)

  if (streakDays) {
    const streak = document.createElement('div')
    Object.assign(streak.style, {
      display: 'inline-flex',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: '8px',
      padding: isSquare ? '12px 22px' : '10px 18px',
      borderRadius: '999px',
      background: 'linear-gradient(135deg, #4FD1C5, #A62EE8)',
      fontWeight: '900',
      fontSize: isSquare ? '22px' : '16px',
      boxShadow: '0 8px 24px rgba(166, 46, 232, 0.35)'
    })
    streak.textContent = `🔥 ${streakDays} ${t.dayStreak}`
    headerLeft.appendChild(streak)
  }

  header.appendChild(headerLeft)

  const crystalWrap = document.createElement('div')
  Object.assign(crystalWrap.style, {
    position: 'relative',
    flexShrink: '0',
    width: isSquare ? '180px' : '120px',
    height: isSquare ? '180px' : '120px'
  })

  const crystalGlow = document.createElement('div')
  Object.assign(crystalGlow.style, {
    position: 'absolute',
    inset: '10%',
    background: '#4FD1C5',
    borderRadius: '50%',
    filter: 'blur(28px)',
    opacity: '0.35',
    zIndex: '1'
  })
  crystalWrap.appendChild(crystalGlow)

  const crystal = document.createElement('img')
  crystal.src = crystalImage
  Object.assign(crystal.style, {
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: '2',
    filter: 'drop-shadow(0 0 18px rgba(79, 209, 197, 0.45))',
    objectFit: 'contain'
  })
  crystalWrap.appendChild(crystal)
  header.appendChild(crystalWrap)
  container.appendChild(header)

  await waitForImageLoad(crystal)

  // Content
  const content = document.createElement('div')
  Object.assign(content.style, {
    position: 'relative',
    zIndex: '10',
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: isSquare ? '28px' : '22px',
    minHeight: '0'
  })

  const missionsToShow = challenges.slice(0, 3)
  if (missionsToShow.length > 0) {
    const section = document.createElement('div')
    const label = document.createElement('div')
    label.textContent = t.missionsLabel
    Object.assign(label.style, {
      color: '#C4B5FD',
      fontSize: isSquare ? '18px' : '13px',
      fontWeight: '800',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom: isSquare ? '16px' : '12px'
    })
    section.appendChild(label)

    missionsToShow.forEach((mission) => {
      const card = document.createElement('div')
      Object.assign(card.style, {
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: isSquare ? '22px 26px' : '16px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: isSquare ? '14px' : '10px'
      })

      const titleEl = document.createElement('div')
      titleEl.textContent = titleCaseReadable(mission.title)
      Object.assign(titleEl.style, {
        fontWeight: '700',
        fontSize: `${missionTitleSize}px`,
        lineHeight: '1.25',
        maxWidth: '72%'
      })

      const meta = document.createElement('div')
      meta.textContent = `${mission.completedDays}/${mission.totalDays}`
      Object.assign(meta.style, {
        color: '#4FD1C5',
        fontWeight: '900',
        fontSize: isSquare ? '28px' : '18px',
        flexShrink: '0'
      })

      card.appendChild(titleEl)
      card.appendChild(meta)
      section.appendChild(card)
    })

    content.appendChild(section)
  }

  const summaryTask = checklistTasks.find((task) => task.isSummary)
  const doneSteps = checklistTasks.filter((task) => task.done !== false && !task.isSummary)
  if (summaryTask || doneSteps.length > 0) {
    const section = document.createElement('div')
    const label = document.createElement('div')
    label.textContent = t.stepsLabel
    Object.assign(label.style, {
      color: '#4FD1C5',
      fontSize: isSquare ? '18px' : '13px',
      fontWeight: '800',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom: isSquare ? '16px' : '12px'
    })
    section.appendChild(label)

    if (summaryTask || doneSteps.length > 3) {
      const pill = document.createElement('div')
      Object.assign(pill.style, {
        background: 'linear-gradient(90deg, rgba(79, 209, 197, 0.22), transparent)',
        padding: isSquare ? '18px 24px' : '14px 18px',
        borderRadius: '14px',
        fontSize: isSquare ? '24px' : '16px',
        fontWeight: '700',
        borderLeft: '4px solid #4FD1C5'
      })
      pill.textContent = summaryTask
        ? `⚡ ${summaryTask.title}`
        : `⚡ ${t.stepsCompleted}: ${doneSteps.length}`
      section.appendChild(pill)
    } else {
      doneSteps.forEach((step) => {
        const row = document.createElement('div')
        Object.assign(row.style, {
          background: 'rgba(79, 209, 197, 0.08)',
          padding: isSquare ? '16px 22px' : '12px 16px',
          borderRadius: '12px',
          fontSize: isSquare ? '22px' : '15px',
          marginBottom: '10px',
          borderLeft: '4px solid #4FD1C5'
        })
        row.textContent = `⚡ ${titleCaseReadable(step.title || step)}`
        section.appendChild(row)
      })
    }

    content.appendChild(section)
  }

  container.appendChild(content)

  // Footer
  const footer = document.createElement('div')
  Object.assign(footer.style, {
    marginTop: 'auto',
    paddingTop: isSquare ? '36px' : '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: '10',
    position: 'relative'
  })

  const brand = document.createElement('div')
  brand.innerHTML = `
    <div style="letter-spacing: 0.18em; font-weight: 900; color:#4FD1C5; font-size: ${isSquare ? '28px' : '18px'};">IGNITE-ME.APP</div>
    <div style="font-size: ${isSquare ? '16px' : '12px'}; color: #94a3b8; margin-top: 6px;">${t.tagline}</div>
  `
  footer.appendChild(brand)

  const mark = document.createElement('img')
  mark.src = crystalImage
  Object.assign(mark.style, {
    width: isSquare ? '56px' : '36px',
    height: isSquare ? '56px' : '36px',
    objectFit: 'contain',
    opacity: '0.9',
    filter: 'drop-shadow(0 0 10px rgba(112, 72, 232, 0.45))'
  })
  footer.appendChild(mark)
  container.appendChild(footer)

  document.body.appendChild(container)
  await waitForPaint()

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0b0d12',
      logging: false
    })
    return canvas.toDataURL('image/png')
  } finally {
    document.body.removeChild(container)
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

export async function generateImage(options) {
  const { filenamePrefix = 'ignite-victory', translations = {}, ...buildOptions } = options
  const dataUrl = await buildVictoryImageDataUrl({ ...buildOptions, translations })
  const fileName = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.png`

  return shareVictoryImage(dataUrl, fileName, {
    title: 'Ignite',
    text: translations.shareCaption || translations.conqueredTitle || 'DAY CONQUERED'
  })
}
