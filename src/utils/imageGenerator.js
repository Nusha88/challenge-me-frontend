import html2canvas from 'html2canvas'
import crystalImage from '../assets/crystal.png'

export async function generateImage(options) {
  const {
    userName = 'HERO',
    challenges = [],
    checklistTasks = [],
    streakDays = null,
    filenamePrefix = 'ignite-victory',
    translations = {}
  } = options

  const t = {
    reportSuccess: 'LEGENDARY MOMENT',
    excellentWork: 'EXCELLENT WORK',
    activeMissions: 'ACTIVE MISSIONS',
    progress: 'PROGRESS',
    operationalLog: 'DAILY STEPS',
    dailyGoalsCompleted: 'DAILY GOALS COMPLETED',
    systemStatus: 'YOUR JORNEY TO MASTERY',
    dayStreak: 'DAY STREAK',
    ...translations
  }

  try {
    const container = document.createElement('div')
    // Стили контейнера (Формат Story)
    Object.assign(container.style, {
      position: 'absolute',
      left: '-9999px',
      width: '540px',
      height: '960px',
      padding: '60px 45px',
      background: '#0f172a', // ЧЕТКИЙ ФОН
      color: '#ffffff',
      fontFamily: '"Plus Jakarta Sans", "Roboto", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflow: 'hidden',
      zIndex: '1' // Для верного наложения фоновых элементов
    })

    // 1. ФОН: СЕТКА И ДВА ГРАДИЕНТНЫХ СВЕЧЕНИЯ
    // Сетка
    const grid = document.createElement('div')
    Object.assign(grid.style, {
      position: 'absolute',
      inset: '0',
      opacity: '0.1',
      background: `linear-gradient(to right, rgba(79, 209, 197, 0.1) 1px, transparent 1px),
                   linear-gradient(to bottom, rgba(79, 209, 197, 0.1) 1px, transparent 1px)`,
      backgroundSize: '30px 30px',
      zIndex: '2'
    })
    container.appendChild(grid)

    // Свечение 1 (Справа вверху)
    const glow1 = document.createElement('div')
    Object.assign(glow1.style, {
      position: 'absolute',
      top: '-15%',
      right: '-15%',
      width: '350px',
      height: '350px',
      background: 'rgba(166, 46, 232, 0.3)', // Purple glow
      borderRadius: '50%',
      filter: 'blur(100px)',
      zIndex: '2'
    })
    container.appendChild(glow1)

    // Свечение 2 (Слева внизу)
    const glow2 = document.createElement('div')
    Object.assign(glow2.style, {
      position: 'absolute',
      bottom: '10%',
      left: '-10%',
      width: '300px',
      height: '300px',
      background: 'rgba(79, 209, 197, 0.2)', // Cyan glow
      borderRadius: '50%',
      filter: 'blur(90px)',
      zIndex: '2'
    })
    container.appendChild(glow2)

    // 2. HEADER
    const header = document.createElement('div')
    Object.assign(header.style, {
      position: 'relative',
      zIndex: '10',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '60px'
    })

    // Левая часть Хедера
    const headerLeft = document.createElement('div')
    Object.assign(headerLeft.style, { display: 'flex', flexDirection: 'column' })

    const badge = document.createElement('div')
    badge.textContent = t.reportSuccess
    Object.assign(badge.style, {
      display: 'inline-block',
      padding: '4px 12px',
      border: '1px solid #4FD1C5',
      borderRadius: '20px',
      color: '#4FD1C5',
      fontSize: '11px',
      letterSpacing: '2px',
      fontWeight: '800',
      marginBottom: '18px',
      background: 'rgba(79, 209, 197, 0.1)'
    })
    headerLeft.appendChild(badge)

    const title = document.createElement('h1')
    title.innerHTML = `${t.excellentWork},<br><span style="color: #4FD1C5;">${userName.toUpperCase()}</span>`
    Object.assign(title.style, {
      fontSize: '40px',
      fontWeight: '900',
      margin: '0',
      lineHeight: '1.1',
      whiteSpace: 'pre-line'
    })
    headerLeft.appendChild(title)
    header.appendChild(headerLeft)

    // Правая часть Хедера (КРИСТАЛЛ)
    const crystalContainer = document.createElement('div')
    Object.assign(crystalContainer.style, { position: 'relative' })

    // Дополнительный GLOW специально за кристаллом
    const crystalGlow = document.createElement('div')
    Object.assign(crystalGlow.style, {
      position: 'absolute',
      inset: '0',
      background: '#4FD1C5',
      borderRadius: '50%',
      filter: 'blur(30px)',
      opacity: '0.3',
      zIndex: '1'
    })
    crystalContainer.appendChild(crystalGlow)

    const crystal = document.createElement('img')
    crystal.src = crystalImage
    Object.assign(crystal.style, {
      width: '120px',
      height: '120px',
      position: 'relative',
      zIndex: '2',
      filter: 'drop-shadow(0 0 15px rgba(79, 209, 197, 0.4))',
      objectFit: 'contain'
    })
    crystalContainer.appendChild(crystal)
    header.appendChild(crystalContainer)
    container.appendChild(header)

    // 3. CONTENT AREA
    const content = document.createElement('div')
    Object.assign(content.style, { position: 'relative', zIndex: '10', flex: '1' })

    // Missions Section (Active Missions)
    if (challenges.length > 0) {
      const mSection = document.createElement('div')
      mSection.innerHTML = `<div style="color: #A62EE8; font-size: 13px; font-weight: 800; letter-spacing: 3px; margin-bottom: 20px;">${t.activeMissions}</div>`

      challenges.forEach(m => {
        const card = document.createElement('div')
        Object.assign(card.style, {
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '22px 25px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        })
        card.innerHTML = `
          <div style="font-weight: 700; font-size: 19px; max-width: 70%;">${m.title.toUpperCase()}</div>
          <div style="text-align: right;">
            <div style="color: #4FD1C5; font-weight: 900; font-size: 20px;">${m.completedDays}/${m.totalDays}</div>
            <div style="font-size: 10px; opacity: 0.5; letter-spacing: 1px;">${t.progress}</div>
          </div>
        `
        mSection.appendChild(card)
      })
      content.appendChild(mSection)
    }

    // Daily Steps Section (Operational Log)
    // ЛОГИКА АГРЕГАЦИИ: если задач много, выводим одну красивую плашку
    const doneSteps = checklistTasks.filter(task => task.done !== false)
    if (doneSteps.length > 0) {
      const sSection = document.createElement('div')
      sSection.style.marginTop = '45px'
      sSection.innerHTML = `<div style="color: #4FD1C5; font-size: 13px; font-weight: 800; letter-spacing: 3px; margin-bottom: 20px;">${t.operationalLog}</div>`

      if (doneSteps.length > 3) {
        const sItem = document.createElement('div')
        Object.assign(sItem.style, {
          background: 'linear-gradient(90deg, rgba(79, 209, 197, 0.2), transparent)',
          padding: '16px 22px',
          borderRadius: '12px',
          fontSize: '16px',
          marginBottom: '12px',
          borderLeft: '4px solid #4FD1C5'
        })
        // Используйте корректный заголовок
        sItem.innerHTML = `<span style="color: #4FD1C5; margin-right: 12px;">⚡</span> ${t.dailyGoalsCompleted}: ${doneSteps.length}`
        sSection.appendChild(sItem)
      } else {
        doneSteps.forEach(step => {
          const sItem = document.createElement('div')
          Object.assign(sItem.style, {
            background: 'rgba(79, 209, 197, 0.08)',
            padding: '16px 22px',
            borderRadius: '12px',
            fontSize: '16px',
            marginBottom: '12px',
            borderLeft: '4px solid #4FD1C5'
          })
          sItem.innerHTML = `<span style="color: #4FD1C5; margin-right: 12px;">⚡</span> ${step.title || step}`
          sSection.appendChild(sItem)
        })
      }
      content.appendChild(sSection)
    }
    container.appendChild(content)

    // 4. FOOTER
    const footer = document.createElement('div')
    Object.assign(footer.style, {
      marginTop: 'auto',
      paddingTop: '30px',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: '10'
    })
    footer.innerHTML = `
      <div>
        <div style="letter-spacing: 4px; font-weight: 900; color:#4FD1C5; font-size: 22px;">IGNITE-ME.APP</div>
        <div style="font-size: 10px; color: #94a3b8; letter-spacing: 1px; margin-top: 5px;">${t.systemStatus}</div>
      </div>
    `
    if (streakDays) {
      const st = document.createElement('div')
      Object.assign(st.style, {
        background: 'linear-gradient(135deg, #4FD1C5, #A62EE8)',
        padding: '10px 20px',
        borderRadius: '12px',
        fontWeight: '900',
        fontSize: '16px',
        boxShadow: '0 4px 15px rgba(166, 46, 232, 0.3)'
      })
      st.textContent = `🔥 ${streakDays} ${t.dayStreak}`
      footer.appendChild(st)
    }
    container.appendChild(footer)

    // RENDER
    document.body.appendChild(container)
    const canvas = await html2canvas(container, {
      scale: 2, // 1080x1920 для Story
      useCORS: true,
      backgroundColor: '#0f172a',
      logging: false
    })
    document.body.removeChild(container)

    // DOWNLOAD
    const link = document.createElement('a')
    link.download = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

  } catch (error) {
    console.error('Render failed:', error)
  }
}
