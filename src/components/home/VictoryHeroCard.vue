<template>
  <div
    ref="rootRef"
    class="victory-hero-card"
    :style="rootStyle"
  >
    <div class="bg-orbit orbit-1" aria-hidden="true"></div>
    <div class="bg-orbit orbit-2" aria-hidden="true"></div>
    <div class="rank-glow" aria-hidden="true"></div>

    <div class="card-brand">IGNITE</div>

    <div class="hero-block">
      <div class="hero-avatar-aura">
        <RankedAvatar
          :avatar-url="resolvedAvatarUrl"
          :seed="userId"
          :initials="initials"
          :alt="userName"
          :size="160"
          :level="level"
        />
      </div>
      <p class="hero-name">{{ userName || t('profile.ranks.explorer') }}</p>
      <p class="hero-rank">{{ rankLine }}</p>
      <div v-if="streakDays > 0" class="streak-pill">
        🔥 {{ streakDays }} {{ t('home.loggedIn.completionImage.dayStreak', streakDays) }}
      </div>
    </div>

    <div class="triumph-block">
      <h1 class="triumph-title">
        {{ t('home.loggedIn.completionImage.conqueredTitle') }}
      </h1>
      <p class="triumph-summary">
        {{ t('home.loggedIn.completionImage.summaryLine', { done: completedCount, total: totalCount }) }}
      </p>
    </div>

    <footer class="card-footer">
      <div class="footer-text">
        <p class="footer-domain">IGNITE-ME.APP</p>
        <p class="footer-tagline">{{ t('home.loggedIn.completionImage.tagline') }}</p>
      </div>
      <div class="qr-container">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt=""
          width="80"
          height="80"
        />
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import RankedAvatar from '../user/RankedAvatar.vue'
import { getLevelFromXp, getLevelInfo, getRank } from '../../utils/levelSystem'
import { getShadowAvatarDataUri } from '../../utils/shadowAvatar'
import { resolveImageDataUrl, rasterizeImageToPngDataUrl } from '../../utils/shareImage'

const APP_URL = 'https://ignite-me.app'

const props = defineProps({
  userName: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  userId: { type: [String, Number], default: '' },
  xp: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  referralLink: { type: String, default: '' }
})

const { t } = useI18n()
const rootRef = ref(null)
const qrDataUrl = ref('')
const resolvedAvatarUrl = ref('')

const shareUrl = computed(() => String(props.referralLink || '').trim() || APP_URL)
const level = computed(() => getLevelFromXp(props.xp))
const levelInfo = computed(() => getLevelInfo(level.value))
const rankColor = computed(() => levelInfo.value.color || '#2196F3')

const rankLine = computed(() => t('home.loggedIn.completionImage.rankLine', {
  rank: getRank(level.value),
  title: t(`profile.ranks.${levelInfo.value.rankKey}`)
}))

const initials = computed(() => {
  const parts = String(props.userName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
})

const rootStyle = computed(() => ({
  '--rank-color': rankColor.value,
  '--rank-glow': colorWithAlpha(rankColor.value, 0.45),
  '--rank-glow-soft': colorWithAlpha(rankColor.value, 0.22)
}))

function colorWithAlpha(hex, alpha) {
  const raw = String(hex || '').replace('#', '')
  if (raw.length !== 6) return `rgba(33, 150, 243, ${alpha})`
  const n = parseInt(raw, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

watch(shareUrl, async (url) => {
  try {
    qrDataUrl.value = await QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: '#0b0d12', light: '#ffffff' }
    })
  } catch (error) {
    console.warn('Victory QR generation failed', error)
    qrDataUrl.value = ''
  }
}, { immediate: true })

watch(
  () => [props.avatarUrl, props.userId, rankColor.value],
  async ([url, seed, color]) => {
    try {
      if (url) {
        const resolved = await resolveImageDataUrl(url)
        resolvedAvatarUrl.value = resolved.includes('image/svg+xml')
          ? await rasterizeImageToPngDataUrl(resolved, 320)
          : resolved
        return
      }
      if (!seed) {
        resolvedAvatarUrl.value = ''
        return
      }
      const svg = getShadowAvatarDataUri(seed, color)
      resolvedAvatarUrl.value = await rasterizeImageToPngDataUrl(svg, 320)
    } catch (error) {
      console.warn('Victory avatar resolve failed', error)
      resolvedAvatarUrl.value = url || ''
    }
  },
  { immediate: true }
)

defineExpose({
  getCardElement: () => rootRef.value
})
</script>

<style scoped>
.victory-hero-card {
  width: 540px;
  height: 960px;
  box-sizing: border-box;
  padding: 48px 40px 40px;
  background: radial-gradient(circle at 50% 38%, #161b26 0%, #0b0d12 72%);
  color: #ffffff;
  font-family: 'Plus Jakarta Sans', 'Montserrat', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.bg-orbit {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.orbit-1 {
  width: 300px;
  height: 300px;
}

.orbit-2 {
  width: 500px;
  height: 500px;
}

.rank-glow {
  position: absolute;
  top: 22%;
  left: 50%;
  width: 280px;
  height: 280px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, var(--rank-glow-soft) 0%, transparent 68%);
  box-shadow: 0 0 64px var(--rank-glow);
  z-index: 0;
  pointer-events: none;
}

.card-brand {
  position: relative;
  z-index: 2;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.28em;
  color: var(--rank-color);
  text-shadow: 0 0 16px var(--rank-glow);
}

.hero-block {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  justify-content: center;
  min-height: 0;
}

.hero-avatar-aura {
  width: 196px;
  height: 196px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle, var(--rank-glow-soft) 0%, transparent 72%);
  box-shadow: 0 0 36px var(--rank-glow);
  margin-bottom: 18px;
}

.hero-name {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.15;
  color: #ffffff;
}

.hero-rank {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--rank-color);
  letter-spacing: 0.02em;
}

.streak-pill {
  display: inline-flex;
  align-items: center;
  margin-top: 16px;
  padding: 8px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #4fd1c5, #a62ee8);
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 20px rgba(166, 46, 232, 0.32);
}

.triumph-block {
  position: relative;
  z-index: 2;
  width: 100%;
  margin: 8px 0 32px;
}

.triumph-title {
  margin: 0;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.12;
  color: #ffffff;
  text-shadow: 0 0 22px var(--rank-glow);
}

.triumph-summary {
  margin: 14px 0 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  color: #c5d0e6;
}

.card-footer {
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 28px;
  text-align: left;
}

.footer-domain {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--rank-color);
}

.footer-tagline {
  margin: 6px 0 0;
  font-size: 12px;
  color: #8fa0c0;
}

.qr-container {
  flex-shrink: 0;
  background: #ffffff;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 0 18px var(--rank-glow-soft);
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-container img {
  width: 80px;
  height: 80px;
  display: block;
}
</style>
