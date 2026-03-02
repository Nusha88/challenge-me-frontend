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
            <div class="user-stats-mini">
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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import homePagePicture from '../assets/home_page.jpg' // Замени на кристалл
import demoImage from '../assets/demo.png'
import GradientButton from './GradientButton.vue'

const { t, locale } = useI18n()
const totalUsers = ref(100)

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
  margin: 0 auto;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
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
  filter: drop-shadow(0 0 30px rgba(79, 209, 197, 0.3));
  animation: float 6s ease-in-out infinite;
  -webkit-mask-image: radial-gradient(circle, black 40%, transparent 80%);
  mask-image: radial-gradient(circle, black 40%, transparent 80%);
  
  /* Дополнительно можно чуть подтянуть контраст, чтобы черный стал чернее */
  filter: brightness(1.1) contrast(1.1);
  
  width: 100%;
  max-width: 450px;
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
  .quote-section {
    margin-top: 24px !important;
    margin-bottom: 24px !important;
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