import html2canvas from 'html2canvas'
import roketImage from '../assets/roket.png'
import motivationalMessagesEn from '../data/motivationalMessages.en.json'
import motivationalMessagesRu from '../data/motivationalMessages.ru.json'

/**
 * Генерирует изображение триумфа для Hero's Journal
 */
export async function generateCompletionImage(options) {
  const {
    userName = 'Hero',
    date = new Date(),
    challenges = [],
    completedChallenges = [],
    checklistTasks = [],
    streakDays = null,
    locale = 'en',
    t = null,
    includeMotivationalMessage = true,
    filenamePrefix = 'victory'
  } = options

  try {
    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'absolute',
      left: '-9999px',
      width: '600px',
      minHeight: '850px',
      padding: '40px',
      background: `
        radial-gradient(circle at 50% 0%, rgba(126, 70, 196, 0.6) 0%, transparent 70%),
        radial-gradient(circle at 100% 100%, rgba(244, 167, 130, 0.2) 0%, transparent 50%),
        #1A1A2E
      `,
      color: '#ffffff',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      position: 'relative',
      overflow: 'hidden'
    })

    // Иконка ракеты
    const rocketIcon = document.createElement('img')
    rocketIcon.src = roketImage
    Object.assign(rocketIcon.style, {
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '130px',
      height: 'auto',
      zIndex: '10',
      filter: 'drop-shadow(0 0 25px rgba(244, 167, 130, 0.6))',
      transform: 'rotate(12deg)'
    })
    container.appendChild(rocketIcon)

    // Звезды
    for (let i = 0; i < 25; i++) {
      const star = document.createElement('div')
      Object.assign(star.style, {
        position: 'absolute',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 2 + 1}px`,
        height: `${Math.random() * 2 + 1}px`,
        background: '#fff',
        borderRadius: '50%',
        opacity: Math.random() * 0.6,
        boxShadow: '0 0 4px #fff'
      })
      container.appendChild(star)
    }

    // --- ГЕОМЕТРИЧЕСКИЙ ПАТТЕРН И СВЕЧЕНИЯ ---
    // Сетка
    const gridOverlay = document.createElement('div');
    Object.assign(gridOverlay.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px', // Размер ячейки сетки
        zIndex: '1',
        opacity: '0.4'
    });
    container.appendChild(gridOverlay);

    // Мягкие свечения (добавляют глубину)
    const glow1 = document.createElement('div');
    Object.assign(glow1.style, {
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(126, 70, 196, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        zIndex: '2'
    });
    container.appendChild(glow1);

    const glow2 = document.createElement('div');
    Object.assign(glow2.style, {
        position: 'absolute',
        bottom: '5%',
        right: '15%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(244, 167, 130, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        zIndex: '2'
    });
    container.appendChild(glow2);
    // --- КОНЕЦ ГЕОМЕТРИЧЕСКОГО ПАТТЕРНА И СВЕЧЕНИЙ ---


    // --- HEADER ---
    const header = document.createElement('div')
    Object.assign(header.style, {
      textAlign: 'left',
      padding: '35px 30px',
      background: 'rgba(0, 0, 0, 0.4)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      zIndex: '5',
      position: 'relative',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
    })
    
    const title = document.createElement('h1')
    const displayTitle = t && typeof t === 'function' 
      ? t('home.loggedIn.completionImage.title', { name: userName }).toUpperCase()
      : `${userName.toUpperCase()} - LEGEND DAY`

    title.textContent = displayTitle
    Object.assign(title.style, {
      fontSize: '40px',
      fontWeight: '900',
      margin: '0',
      lineHeight: '1.1',
      color: '#ffffff',
      textShadow: '2px 4px 12px rgba(0, 0, 0, 0.9), 0 0 20px rgba(126, 70, 196, 0.4)'
    })

    const dateObj = typeof date === 'string' ? new Date(date) : date
    const dateStr = dateObj.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    const dateText = document.createElement('p')
    dateText.textContent = dateStr.toUpperCase()
    Object.assign(dateText.style, {
      fontSize: '16px',
      fontWeight: '800',
      color: '#F4A782',
      marginTop: '12px',
      letterSpacing: '2px'
    })

    header.appendChild(title)
    header.appendChild(dateText)
    container.appendChild(header)

    // Мотивация
    if (includeMotivationalMessage) {
      const messages = locale === 'ru' ? motivationalMessagesRu : motivationalMessagesEn
      const selectedMessage = messages[Math.floor(Math.random() * messages.length)]
      
      const quoteBox = document.createElement('div')
      Object.assign(quoteBox.style, {
        fontSize: '22px',
        lineHeight: '1.5',
        color: 'rgba(255, 255, 255, 0.95)',
        padding: '0 20px',
        fontWeight: '500',
        fontStyle: 'italic',
        borderLeft: '4px solid #F4A782',
        zIndex: '5'
      })
      quoteBox.textContent = `"${selectedMessage}"`
      container.appendChild(quoteBox)
    }

    // Контент (Миссии)
    const listContainer = document.createElement('div')
    Object.assign(listContainer.style, {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      zIndex: '5'
    })

    const missionsToShow = completedChallenges.length > 0 
      ? completedChallenges 
      : challenges.filter(c => c.completed !== false)

    if (missionsToShow.length > 0) {
      const mSection = document.createElement('div')
      const mTitle = document.createElement('h2')
      mTitle.textContent = 'MISSIONS ACCOMPLISHED'
      Object.assign(mTitle.style, { fontSize: '13px', color: '#F4A782', letterSpacing: '3px', marginBottom: '15px', fontWeight: '800' })
      mSection.appendChild(mTitle)

      missionsToShow.forEach(m => {
        const item = document.createElement('div')
        Object.assign(item.style, {
          background: 'linear-gradient(90deg, rgba(126, 70, 196, 0.3), transparent)',
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          border: '1px solid rgba(126, 70, 196, 0.2)'
        })
        item.innerHTML = `<span style="color:#F4A782; margin-right:12px; font-size:18px;">✦</span><span style="font-weight:700; font-size:17px;">${m.title || m}</span>`
        mSection.appendChild(item)
      })
      listContainer.appendChild(mSection)
    }

    container.appendChild(listContainer)

    // --- ФУТЕР ---
    const footer = document.createElement('div')
    Object.assign(footer.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center', // Теперь центрирует по вертикали Ignite и правый блок
      marginTop: 'auto',
      paddingTop: '30px',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: '5'
    })

    // Левая часть футера: Название бренда
    const brandName = document.createElement('div')
    brandName.textContent = 'IGNITE'
    Object.assign(brandName.style, {
      fontSize: '26px',
      fontWeight: '900',
      color: '#ffffff',
      letterSpacing: '5px',
      lineHeight: '1',
      textShadow: '0 0 20px rgba(126, 70, 196, 0.8)'
    })

    // Правая часть футера: Слоган и/или Стрик
    const rightSide = document.createElement('div')
    Object.assign(rightSide.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end', // Выравнивание по правому краю внутри этого блока
      gap: '6px' // Уменьшил зазор
    })

    // Стрик (если есть)
    if (streakDays !== null) {
      const streakBadge = document.createElement('div')
      Object.assign(streakBadge.style, {
        background: 'linear-gradient(135deg, #7E46C4, #F4A782)',
        padding: '6px 16px',
        borderRadius: '50px',
        fontWeight: '900',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(126, 70, 196, 0.4)'
      })
      const streakLabel = t ? t('navigation.streakDays').toUpperCase() : 'DAYS STREAK'
      streakBadge.innerHTML = `🔥 ${streakDays} ${streakLabel}`
      rightSide.appendChild(streakBadge)
    }

    // Слоган
    const slogan = document.createElement('div')
    slogan.textContent = 'START YOUR MISSION'
    Object.assign(slogan.style, {
      fontSize: '10px',
      fontWeight: '800',
      color: '#F4A782',
      letterSpacing: '1.5px'
    })

    rightSide.appendChild(slogan)
    
    footer.appendChild(brandName)
    footer.appendChild(rightSide)
    
    container.appendChild(footer)

    // Рендеринг
    document.body.appendChild(container)
    const canvas = await html2canvas(container, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      logging: false
    })
    document.body.removeChild(container)

    const dateForFilename = typeof date === 'string' ? date : dateObj.toISOString().split('T')[0]
    const filename = `${filenamePrefix}-${dateForFilename}.png`

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')

  } catch (error) {
    console.error('Failed to generate Ignite achievement image:', error)
    throw error
  }
}