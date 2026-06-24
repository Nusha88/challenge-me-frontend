<template>
  <div class="landing-page">
    <div class="stars-overlay"></div>
    
    <div class="content-wrapper">
      <section class="hero-grid">
        <div class="hero-left">
          <div class="status-badge">{{ t('home.systemOnline') || 'SYSTEM ONLINE' }}</div>
          <h1 class="hero-title">
            <span class="gradient-text">{{ t('home.title') }}</span>
          </h1>
          <p class="hero-subtitle">{{ t('home.subtitle') }}</p>
          <div class="hero-actions">
            <GradientButton to="/login" class="main-cta">
              {{ t('home.createFirstChallenge') }}
            </GradientButton>
            <div v-if="totalUsers > 0" class="user-stats-mini">
              <v-icon color="#4FD1C5" size="20">mdi-flash</v-icon>
              <span>{{ joinHeroesText }}</span>
            </div>
          </div>
        </div>
        
        <div class="hero-right">
          <div class="artifact-container">
            <img :src="homePagePicture" alt="Artifact" class="floating-artifact" />
            <div class="artifact-glow"></div>
          </div>
        </div>
      </section>

      <section class="features-section">
        <div class="section-header">
          <h2 class="section-title">{{ t('home.benefitsTitle') }}</h2>
          <div class="title-line"></div>
        </div>
        
        <div class="features-grid">
          <div v-for="i in 4" :key="i" class="feature-card glass-card">
            <div class="feature-icon-box">
              <v-icon class="neon-icon">{{ getFeatureIcon(i) }}</v-icon>
            </div>
            <h3 class="feature-card-title">{{ t(`home.benefits.block${i}.title`) }}</h3>
            <p class="feature-card-desc">{{ t(`home.benefits.block${i}.description`) }}</p>
          </div>
        </div>
      </section>

      <section class="mission-types-section">
        <div class="section-header">
          <h2 class="section-title">{{ t('home.missionTypes.title') }}</h2>
          <div class="title-line"></div>
        </div>

        <div ref="missionGridRef" class="mission-grid">
          <div
            class="mission-card glass-card mission-card--clickable"
            role="button"
            tabindex="0"
            @click="handleMissionCardClick('ritual')"
            @keydown.enter="handleMissionCardClick('ritual')"
          >
            <v-icon class="mission-card-hint">mdi-play-circle-outline</v-icon>
            <div class="mission-icon-box">
              <v-icon class="neon-icon">mdi-star-four-points-outline</v-icon>
            </div>
            <h3 class="mission-card-title">{{ t('home.missionTypes.ritual.title') }}</h3>
            <p class="mission-card-desc">
              {{ t('home.missionTypes.ritual.description') }}
            </p>
          </div>

          <div
            class="mission-card glass-card mission-card--clickable"
            role="button"
            tabindex="0"
            @click="handleMissionCardClick('quest')"
            @keydown.enter="handleMissionCardClick('quest')"
          >
            <v-icon class="mission-card-hint">mdi-play-circle-outline</v-icon>
            <div class="mission-icon-box">
              <v-icon class="neon-icon">mdi-sword</v-icon>
            </div>
            <h3 class="mission-card-title">{{ t('home.missionTypes.quest.title') }}</h3>
            <p class="mission-card-desc">
              {{ t('home.missionTypes.quest.description') }}
            </p>
          </div>
        </div>
      </section>

      <v-dialog
        v-model="missionDialogOpen"
        max-width="480"
        width="auto"
        scrollable
        transition="dialog-bottom-transition"
        class="mission-dialog"
        content-class="mission-dialog-content"
      >
        <v-card class="mission-guide-card">
          <div class="mission-guide-header">
            <div class="d-flex align-center">
              <v-icon class="mission-guide-header-icon mr-3">{{ activeMissionType === 'quest' ? 'mdi-sword' : 'mdi-star-four-points-outline' }}</v-icon>
              <h3 class="mission-guide-title">{{ missionDialogTitle }}</h3>
            </div>
            <v-btn icon="mdi-close" variant="text" size="small" class="mission-guide-close" @click="missionDialogOpen = false"></v-btn>
          </div>

          <v-card-text class="mission-guide-body">
            <div class="mission-guide-media">
              <video
                v-if="missionDialogOpen"
                ref="missionVideoRef"
                :key="activeMissionType"
                class="mission-guide-video"
                :src="activeMissionVideo"
                autoplay
                loop
                muted
                playsinline
                preload="metadata"
              />
            </div>
          </v-card-text>

          <v-card-actions class="mission-guide-actions">
            <GradientButton to="/login" block size="large">
              {{ t('home.missionTypes.createMission') }}
            </GradientButton>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <section class="features-section mt-12">
        <div class="section-header mb-12">
          <h2 class="section-title">{{ t('home.demoPreviewTitle') }}</h2>
          <div class="title-line"></div>
        </div>
        <img :src="demoImage" alt="Ignite demo" class="demo-preview-image" />
      </section>

      <section class="quote-section my-16">
        <v-container>
          <div class="quote-container text-center">
            <v-icon color="rgba(79, 209, 197, 0.2)" size="48" class="mb-4">
              mdi-format-quote-open
            </v-icon>

            <h2 class="quote-text mb-4">
              {{ t('home.quoteTitle') }}
            </h2>

            <p class="quote-subtext">
              {{ t('home.quoteLine1') }}<br>
              {{ t('home.quoteLine2') }}
            </p>

            <div class="quote-divider mt-8"></div>
          </div>
        </v-container>
      </section>

      <section class="final-cta glass-card">
        <div class="cta-content">
          <h2 class="cta-title">{{ t('home.readyToStart') || 'READY FOR YOUR MISSION?' }}</h2>
          <GradientButton to="/login">{{ t('home.getStarted') || 'INITIALIZE' }}</GradientButton>
        </div>
      </section>

      <footer class="footer-simple">
        <p>© {{ new Date().getFullYear() }} IGNITE-ME.APP. YOUR JORNEY TO MASTERY. {{ t('home.allRightsReserved') }}</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import homePagePicture from '../assets/home_page.jpg' // Замени на кристалл
import demoImage from '../assets/demo.png'
import ritualVideo from '../assets/ritual.mp4'
import questVideo from '../assets/quest.mp4'
import GradientButton from './GradientButton.vue'

const { t, locale } = useI18n()
const totalUsers = ref(0)
const missionGridRef = ref(null)
let missionObserver = null

const missionDialogOpen = ref(false)
const activeMissionType = ref('ritual')
const missionVideoRef = ref(null)

const activeMissionVideo = computed(() =>
  activeMissionType.value === 'quest' ? questVideo : ritualVideo
)

const missionDialogTitle = computed(() =>
  activeMissionType.value === 'quest'
    ? t('home.missionTypes.quest.guideTitle')
    : t('home.missionTypes.ritual.guideTitle')
)

function openMissionDialog(type) {
  activeMissionType.value = type
  missionDialogOpen.value = true
}

function handleMissionCardClick(type) {
  openMissionDialog(type)
}

watch(missionDialogOpen, async (open) => {
  if (!open) {
    missionVideoRef.value?.pause()
    return
  }

  await nextTick()
  missionVideoRef.value?.play().catch(() => {})
})

const formattedUsersCount = computed(() => {
  return new Intl.NumberFormat(locale.value).format(totalUsers.value)
})

const joinHeroesText = computed(() => {
  return t('home.joinHeroesDynamic', { count: formattedUsersCount.value })
})

onMounted(async () => {
  try {
    const response = await userService.getAllUsers({ page: 1, limit: 1 })
    const total = Number(response?.data?.pagination?.total || 0)
    if (Number.isFinite(total) && total > 0) {
      totalUsers.value = total
    }
  } catch {
    // Keep default value if request fails
  }

  await nextTick()
  if (!missionGridRef.value) return

  const cards = missionGridRef.value.querySelectorAll('.mission-card')
  missionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          missionObserver?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.2 }
  )

  cards.forEach((card) => missionObserver.observe(card))
})

onBeforeUnmount(() => {
  missionObserver?.disconnect()
})

const getFeatureIcon = (index) => {
  const icons = ['mdi-target-variant', 'mdi-sword-cross', 'mdi-shield-check', 'mdi-trophy-variant']
  return icons[index - 1]
}
</script>

<style scoped>
.landing-page {
  background-color: #0f172a;
  color: #f8fafc;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  font-family: 'Montserrat', sans-serif;
}

/* Эффект звезд на фоне */
.stars-overlay {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
  background-size: 40px 40px;
  pointer-events: none;
}

.content-wrapper {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

/* HERO */
.hero-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 60px;
  align-items: center;
  padding: 60px 0;
}

@media (max-width: 960px) {
  .hero-grid { grid-template-columns: 1fr; text-align: center; }
  .hero-actions { justify-content: center; }
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.3);
  border-radius: 20px;
  color: #4FD1C5;
  font-size: 0.7rem;
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.hero-title {
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  line-height: 1.1;
  font-weight: 900;
  margin-bottom: 24px;
}

.gradient-text {
  background: linear-gradient(135deg, #fff 30%, #4FD1C5 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #94a3b8;
  max-width: 600px;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

/* ARTIFACT ANIMATION */
.artifact-container {
  position: relative;
  display: flex;
  justify-content: center;
}

  .floating-artifact {
  width: 100%;
  max-width: 450px;
  height: auto;
  filter: drop-shadow(0 0 30px rgba(79, 209, 197, 0.3));
  animation: float 6s ease-in-out infinite;
  -webkit-mask-image: radial-gradient(circle, black 40%, transparent 80%);
  mask-image: radial-gradient(circle, black 40%, transparent 80%);
  
  /* Дополнительно можно чуть подтянуть контраст, чтобы черный стал чернее */
  filter: brightness(1.1) contrast(1.1);
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* FEATURES */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 60px;
}

.demo-preview-wrap {
  margin: 42px auto 0;
  width: 90%;
}

.demo-preview-title {
  margin-bottom: 14px;
  text-align: center;
}

.demo-preview-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 18px;
  border: 1px solid rgba(79, 209, 197, 0.45);
  box-shadow:
    0 0 22px rgba(79, 209, 197, 0.35),
    0 0 48px rgba(112, 72, 232, 0.25);
}

.quote-section {
  position: relative;
  overflow: hidden;
}

.quote-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.quote-text {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #4FD1C5 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 15px rgba(79, 209, 197, 0.3));
}

.quote-subtext {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
  line-height: 1.6;
}

.quote-divider {
  height: 1px;
  width: 100px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, #4FD1C5, transparent);
  opacity: 0.5;
}

.glass-card {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 32px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  border-color: rgba(79, 209, 197, 0.4);
  transform: translateY(-10px);
  background: rgba(30, 41, 59, 0.8);
}

.feature-icon-box {
  width: 50px;
  height: 50px;
  background: rgba(79, 209, 197, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.neon-icon {
  color: #4FD1C5 !important;
  filter: drop-shadow(0 0 5px #4FD1C5);
}

.feature-card-title {
  font-size: 1.25rem;
  margin-bottom: 12px;
  color: #fff;
}

.feature-card-desc {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
}

/* MISSION TYPES */
.mission-types-section {
  margin-top: 80px;
}

.mission-grid {
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-top: 40px;
}

.mission-card {
  flex: 1;
  position: relative;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease, background 0.3s ease;
}

.mission-card:nth-child(2) {
  transition-delay: 0.2s;
}

.mission-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.mission-card--clickable {
  cursor: pointer;
}

.mission-card--clickable.is-visible:hover {
  border-color: rgba(79, 209, 197, 0.4);
  transform: translateY(-10px) scale(1.02);
  background: rgba(30, 41, 59, 0.8);
}

.mission-card--clickable.is-visible:focus-visible {
  outline: none;
  border-color: rgba(79, 209, 197, 0.6);
  transform: translateY(-10px) scale(1.02);
}

.mission-card-hint {
  position: absolute;
  top: 16px;
  right: 16px;
  color: rgba(79, 209, 197, 0.5) !important;
  font-size: 22px !important;
  transition: color 0.3s ease, transform 0.3s ease;
}

.mission-card--clickable:hover .mission-card-hint {
  color: #4FD1C5 !important;
  transform: scale(1.15);
}

/* MISSION GUIDE DIALOG */
:deep(.mission-dialog.v-overlay) {
  align-items: center;
  justify-content: center;
}

:deep(.mission-dialog-content) {
  width: min(480px, calc(100vw - 32px)) !important;
  max-width: 480px !important;
  margin: auto;
  align-self: center;
}

.mission-guide-card {
  background: #0f172a !important;
  color: #f8fafc !important;
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 20px;
  overflow: hidden;
}

.mission-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(30, 41, 59, 0.6);
}

.mission-guide-header-icon {
  color: #4FD1C5 !important;
  filter: drop-shadow(0 0 5px rgba(79, 209, 197, 0.5));
}

.mission-guide-title {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.mission-guide-close {
  color: rgba(255, 255, 255, 0.6) !important;
}

.mission-guide-body {
  padding: 14px 18px !important;
}

.mission-guide-media {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(79, 209, 197, 0.25);
  box-shadow: 0 0 22px rgba(79, 209, 197, 0.15);
}

.mission-guide-video {
  display: block;
  width: 100%;
  max-height: 52vh;
  height: auto;
  object-fit: contain;
  background: #0f172a;
}

.mission-guide-actions {
  padding: 4px 18px 18px !important;
}

.mission-icon-box {
  width: 50px;
  height: 50px;
  background: rgba(79, 209, 197, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.mission-card-title {
  font-size: 1.25rem;
  margin-bottom: 12px;
  color: #fff;
}

.mission-card-desc {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .mission-grid {
    flex-direction: column;
  }
}

/* FINAL CTA */
.final-cta {
  margin-top: 100px;
  text-align: center;
  position: relative;
  overflow: hidden;
  padding: 80px 40px;
  background: radial-gradient(circle at center, rgba(79, 209, 197, 0.15) 0%, #0f172a 100%);
  border: 1px solid rgba(79, 209, 197, 0.2);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.demo-bg-fade {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  opacity: 0.1;
  filter: blur(20px);
  z-index: -1;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 32px;
}

@media (max-width: 600px) {
  .landing-page,
  .content-wrapper {
    max-width: 100%;
    overflow-x: hidden;
  }

  .content-wrapper {
    padding: 24px 16px;
  }

  .hero-grid,
  .features-section,
  .mission-types-section,
  .quote-section,
  .final-cta,
  .footer-simple {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  .hero-left,
  .hero-right,
  .artifact-container {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .hero-title,
  .hero-subtitle,
  .section-title,
  .feature-card-title,
  .feature-card-desc,
  .mission-card-title,
  .mission-card-desc,
  .cta-title,
  .quote-text,
  .quote-subtext {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .hero-grid {
    padding: 28px 0 20px;
    gap: 20px;
  }

  .status-badge {
    font-size: 0.58rem;
    letter-spacing: 1px;
    padding: 3px 10px;
    margin-bottom: 12px;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .hero-title {
    font-size: clamp(1.65rem, 7vw, 2.1rem);
    margin-bottom: 14px;
  }

  .hero-subtitle {
    font-size: 0.92rem;
    line-height: 1.5;
    margin-bottom: 20px;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-actions {
    gap: 12px;
    width: 100%;
    max-width: 100%;
    justify-content: center;
  }

  .hero-actions :deep(.gradient-button) {
    font-size: 0.82rem !important;
    letter-spacing: 0.8px;
    min-height: 40px !important;
    height: auto !important;
    padding: 0 18px !important;
    max-width: 100%;
    white-space: normal;
  }

  .user-stats-mini {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.72rem;
    line-height: 1.3;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .user-stats-mini .v-icon {
    font-size: 16px !important;
  }

  .floating-artifact {
    max-width: 240px;
  }

  .section-title {
    font-size: 1.35rem;
    line-height: 1.3;
  }

  .features-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 32px;
    width: 100%;
    min-width: 0;
  }

  .features-grid .feature-card {
    padding: 16px;
    border-radius: 16px;
    min-width: 0;
  }

  .features-grid .feature-card:hover {
    transform: none;
  }

  .features-grid .feature-icon-box {
    width: 36px;
    height: 36px;
    margin-bottom: 10px;
    border-radius: 10px;
  }

  .features-grid .feature-icon-box .neon-icon {
    font-size: 20px !important;
  }

  .features-grid .feature-card-title {
    font-size: 0.85rem;
    margin-bottom: 6px;
    line-height: 1.25;
  }

  .features-grid .feature-card-desc {
    font-size: 0.72rem;
    line-height: 1.45;
  }

  .mission-types-section {
    margin-top: 48px;
  }

  .mission-grid {
    gap: 12px;
    margin-top: 24px;
    width: 100%;
    min-width: 0;
  }

  .mission-types-section .mission-card {
    padding: 16px;
    border-radius: 16px;
    min-width: 0;
  }

  .mission-types-section .mission-card.is-visible:hover,
  .mission-types-section .mission-card--clickable.is-visible:hover {
    transform: none;
  }

  .mission-types-section .mission-icon-box {
    width: 36px;
    height: 36px;
    margin-bottom: 10px;
    border-radius: 10px;
  }

  .mission-types-section .mission-icon-box .neon-icon {
    font-size: 20px !important;
  }

  .mission-types-section .mission-card-title {
    font-size: 0.9rem;
    margin-bottom: 6px;
    line-height: 1.25;
  }

  .mission-types-section .mission-card-desc {
    font-size: 0.75rem;
    line-height: 1.45;
  }

  .mission-card-hint {
    top: 12px;
    right: 12px;
    font-size: 18px !important;
  }

  .mission-guide-card {
    border-radius: 20px;
    border: 1px solid rgba(79, 209, 197, 0.2);
    max-height: calc(100vh - 32px);
    display: flex;
    flex-direction: column;
  }

  .mission-guide-body {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    padding: 12px 14px !important;
  }

  .mission-guide-media {
    width: 100%;
  }

  .mission-guide-video {
    max-height: 40vh;
  }

  .mission-guide-actions {
    padding: 4px 14px 14px !important;
  }

  .quote-section {
    margin-top: 24px !important;
    margin-bottom: 24px !important;
  }

  .quote-section :deep(.v-container) {
    width: 100% !important;
    max-width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .quote-container {
    padding: 24px 12px;
  }

  .quote-text {
    font-size: 1.6rem;
  }

  .quote-subtext {
    font-size: 0.95rem;
  }

  .cta-title {
    font-size: 1.5rem;
    line-height: 1.3;
    margin-bottom: 24px;
  }

  .final-cta {
    margin-top: 60px;
    padding: 48px 20px;
  }

  .final-cta :deep(.gradient-button) {
    max-width: 100%;
    white-space: normal;
  }

  .footer-simple {
    padding: 32px 0;
    font-size: 0.68rem;
    letter-spacing: 0.4px;
    overflow-wrap: anywhere;
  }

  .footer-simple p {
    margin: 0;
    padding: 0 4px;
    word-break: break-word;
  }
}

.footer-simple {
  margin-top: 80px;
  padding: 40px 0;
  border-top: 1px solid rgba(255,255,255,0.05);
  text-align: center;
  font-size: 0.8rem;
  color: #64748b;
  letter-spacing: 1px;
}
</style>
