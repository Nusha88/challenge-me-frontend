import html2canvas from 'html2canvas'
import crystalImage from '../assets/crystal.png' 
import motivationalMessagesEn from '../data/motivationalMessages.en.json'
import motivationalMessagesRu from '../data/motivationalMessages.ru.json'

export async function generateCompletionImage(options) {
  const {
    userName = 'Hero',
    challenges = [],
    completedChallenges = [],
    checklistTasks = [],
    streakDays = null,
    locale = 'en',
    t = null,
    filenamePrefix = 'victory'
  } = options

  try {
    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'absolute',
      left: '-9999px',
      width: '540px',
      height: '960px',
      padding: '50px 40px',
      background: '#0f172a',
      color: '#ffffff',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    })

    // 1. ФОН: СЕТКА И СВЕЧЕНИЕ
    const grid = document.createElement('div')
    Object.assign(grid.style, {
      position: 'absolute',
      inset: '0',
      opacity: '0.4',
      background: `linear-gradient(to right, rgba(79, 209, 197, 0.05) 1px, transparent 1px),
                   linear-gradient(to bottom, rgba(79, 209, 197, 0.05) 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
      zIndex: '1'
    })
    container.appendChild(grid)

    // 2. HEADER С КРИСТАЛЛОМ
    const header = document.createElement('div')
    Object.assign(header.style, {
      position: 'relative',
      zIndex: '10',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '40px'
    })

    const titleBlock = document.createElement('div')
    
    // Бейдж
    const badge = document.createElement('div')
    badge.textContent = 'REPORT: OPERATIONAL SUCCESS'
    Object.assign(badge.style, {
      display: 'inline-block',
      padding: '4px 12px',
      border: '1px solid #4FD1C5',
      borderRadius: '20px',
      color: '#4FD1C5',
      fontSize: '10px',
      letterSpacing: '2px',
      fontWeight: '800',
      marginBottom: '12px'
    })
    titleBlock.appendChild(badge)

    // Заголовок (Без иконки)
    const title = document.createElement('h1')
    title.textContent = `ALL DONE,\n${userName.toUpperCase()}!`
    Object.assign(title.style, {
      fontSize: '36px',
      fontWeight: '900',
      margin: '0',
      lineHeight: '1.1',
      whiteSpace: 'pre-line'
    })
    titleBlock.appendChild(title)
    header.appendChild(titleBlock)

    // КРИСТАЛЛ (Справа от текста)
    const crystal = document.createElement('img')
    crystal.src = crystalImage
    Object.assign(crystal.style, {
      width: '110px',
      height: '110px',
      filter: 'drop-shadow(0 0 25px rgba(79, 209, 197, 0.5))',
      objectFit: 'contain'
    })
    header.appendChild(crystal)
    container.appendChild(header)

    // 3. CONTENT AREA
    const content = document.createElement('div')
    Object.assign(content.style, { position: 'relative', zIndex: '10', flex: '1' })

    // Active Missions
    const activeMissions = completedChallenges.length > 0 ? completedChallenges : challenges.filter(c => c.completed !== false)
    if (activeMissions.length > 0) {
      const mSection = document.createElement('div')
      mSection.innerHTML = `<div style="color: #A62EE8; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 15px;">ACTIVE MISSIONS</div>`
      
      activeMissions.forEach(m => {
        const card = document.createElement('div')
        Object.assign(card.style, {
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(79, 209, 197, 0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        })
        card.innerHTML = `
          <div style="font-weight: 700; font-size: 16px;">${(m.title || m).toUpperCase()}</div>
          <div style="color: #4FD1C5; font-weight: 900;">${m.completedDays || 1}/${m.totalDays || 30}</div>
        `
        mSection.appendChild(card)
      })
      content.appendChild(mSection)
    }

    // Daily Steps
    const doneSteps = checklistTasks.filter(task => task.done !== false)
    if (doneSteps.length > 0) {
      const sSection = document.createElement('div')
      sSection.style.marginTop = '30px'
      sSection.innerHTML = `<div style="color: #4FD1C5; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 15px;">DAILY STEPS</div>`
      
      doneSteps.forEach(step => {
        const sItem = document.createElement('div')
        Object.assign(sItem.style, {
          background: 'rgba(79, 209, 197, 0.05)',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '14px',
          marginBottom: '8px',
          borderLeft: '3px solid #4FD1C5'
        })
        sItem.innerHTML = `<span style="color: #4FD1C5; margin-right: 8px;">✓</span> ${step.title || step}`
        sSection.appendChild(sItem)
      })
      content.appendChild(sSection)
    }
    container.appendChild(content)

    // 4. FOOTER
    const footer = document.createElement('div')
    Object.assign(footer.style, {
      marginTop: 'auto',
      paddingTop: '20px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: '10'
    })
    footer.innerHTML = `
      <div>
        <div style="letter-spacing: 4px; font-weight: 900; font-size: 20px;">IGNITE<span style="color:#4FD1C5">.</span></div>
        <div style="font-size: 9px; color: #94a3b8; letter-spacing: 1px;">START YOUR MISSION</div>
      </div>
    `
    if (streakDays) {
      const st = document.createElement('div')
      Object.assign(st.style, {
        background: 'linear-gradient(135deg, #4FD1C5, #A62EE8)',
        padding: '8px 16px',
        borderRadius: '10px',
        fontWeight: '900',
        fontSize: '14px'
      })
      st.textContent = `🔥 ${streakDays} DAYS STREAK`
      footer.appendChild(st)
    }
    container.appendChild(footer)

    // RENDER
    document.body.appendChild(container)
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#0f172a' })
    document.body.removeChild(container)

    const link = document.createElement('a')
    link.download = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

  } catch (error) {
    console.error('Render failed:', error)
  }
}