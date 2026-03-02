import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useI18n } from 'vue-i18n'

export function useOnboarding() {
  const { t } = useI18n()

  const startTour = () => {
    const isMobile = window.innerWidth < 768
    const desktopSteps = [
      {
        element: '.start-mission-btn',
        popover: {
          title: t('onboarding.steps.startMission.title'),
          description: t('onboarding.steps.startMission.description'),
          side: 'bottom'
        }
      },
      {
        element: '.my-missions-link',
        popover: {
          title: t('onboarding.steps.myMissions.title'),
          description: t('onboarding.steps.myMissions.description'),
          side: 'bottom'
        }
      },
      {
        element: '.achievement-radar',
        popover: {
          title: t('onboarding.steps.achievementRadar.title'),
          description: t('onboarding.steps.achievementRadar.description'),
          side: 'left'
        }
      },
      {
        element: '.settings-icon',
        popover: {
          title: t('onboarding.steps.settings.title'),
          description: t('onboarding.steps.settings.description'),
          side: 'bottom'
        }
      }
    ]

    const mobileSteps = [
      {
        element: '.start-mission-btn',
        popover: {
          title: t('onboarding.mobile.title'),
          description: t('onboarding.mobile.description'),
          side: 'bottom',
          align: 'center'
        }
      }
    ]

    const steps = (isMobile ? mobileSteps : desktopSteps).filter((step) => !!document.querySelector(step.element))

    if (steps.length === 0) {
      localStorage.setItem('onboarding_complete', 'true')
      localStorage.removeItem('onboarding_pending')
      return
    }

    const driverObj = driver({
      showProgress: !isMobile,
      animate: true,
      popoverClass: 'ignite-popover',
      allowClose: true,
      overlayColor: 'rgba(10, 11, 20, 0.85)',
      disableActiveInteraction: isMobile,
      nextBtnText: t('onboarding.nextBtnText'),
      prevBtnText: t('onboarding.prevBtnText'),
      doneBtnText: t('onboarding.doneBtnText'),
      closeBtnText: t('onboarding.closeBtnText'),
      onDestroyed: () => {
        localStorage.setItem('onboarding_complete', 'true')
        localStorage.removeItem('onboarding_pending')
      },
      steps
    })

    driverObj.drive()
  }

  return { startTour }
}

