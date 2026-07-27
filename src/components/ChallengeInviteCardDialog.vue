<template>
  <v-dialog
    v-model="dialogModel"
    max-width="480"
    scrollable
  >
    <v-card class="invite-dialog-card">
      <v-card-title class="invite-dialog-title">
        <div class="text-h6 font-weight-bold">
          {{ cardData?.dialogTitle }}
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="dialogModel = false"
        />
      </v-card-title>

      <v-card-text class="invite-dialog-body">
        <div class="preview-shell">
          <div ref="inviteCardRef" class="invite-card-preview">
            <div class="invite-card-hero">
              <img
                v-if="cardData?.imageUrl"
                :src="heroImageSrc || cardData.imageUrl"
                alt=""
                class="invite-card-hero-image"
              />
              <div
                v-else
                class="invite-card-hero-fallback"
              ></div>
              <div class="invite-card-hero-overlay"></div>
              <div class="invite-card-hero-content">
                <div class="invite-card-topline">
                  {{ cardData?.badgeLabel }}
                </div>
                <p class="invite-card-hook">{{ cardData?.joinHook }}</p>
                <h2 class="invite-card-title">{{ cardData?.title }}</h2>
              </div>
            </div>

            <div class="invite-card-content">
              <div v-if="cardData?.hasInviter" class="invite-person-row">
                <div class="invite-avatar">
                  <img
                    v-if="cardData.inviterAvatarUrl"
                    :src="cardData.inviterAvatarUrl"
                    alt=""
                    class="invite-avatar-img"
                  />
                  <span v-else>{{ cardData.inviterInitial }}</span>
                </div>
                <div class="invite-person-meta">
                  <div class="invite-person-name">{{ cardData.inviterName }}</div>
                  <div
                    v-if="showStatusLine"
                    class="invite-person-status"
                  >
                    {{ cardData.statusLine }}
                  </div>
                </div>
              </div>

              <div
                v-else-if="showStatusLine"
                class="invite-status-solo"
              >
                {{ cardData.statusLine }}
              </div>

              <div
                v-if="cardData?.participantsLine"
                class="invite-participants-pill"
              >
                {{ cardData.participantsLine }}
              </div>

              <div class="invite-card-footer">
                <div class="cta-label">{{ cardData?.ctaLabel }}</div>
                <div class="ignite-brand">Ignite-me.app</div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="cardData?.showProgressOption"
          class="invite-quick-toggle"
        >
          <v-switch
            v-model="showProgress"
            color="#4FD1C5"
            density="compact"
            hide-details
            inset
            :label="t('challenges.inviteCard.showProgress')"
          />
        </div>
      </v-card-text>

      <v-card-actions class="invite-dialog-actions">
        <v-btn
          class="generate-invite-btn"
          block
          size="large"
          :disabled="heroImageLoading && Boolean(cardData?.imageUrl)"
          :loading="generating"
          @click="generateInviteCard"
        >
          {{ t('challenges.inviteCard.generate') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import {
  captureElementToPng,
  prepareHeroImageForExport,
  resolveImageDataUrl,
  shareOrDownloadImage
} from '../utils/shareImage'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  inviteUrl: {
    type: String,
    default: ''
  },
  cardData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const { applyRewardResponse } = useXpAwardFeedback()

const showProgress = ref(true)
const inviteCardRef = ref(null)
const generating = ref(false)
const heroImageSrc = ref('')
const heroImageLoading = ref(false)

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const showStatusLine = computed(() => {
  if (!props.cardData?.statusLine) return false
  if (props.cardData.showProgressOption && !showProgress.value) return false
  return true
})

watch(
  () => [props.modelValue, props.cardData?.imageUrl],
  async ([open, imageUrl]) => {
    heroImageSrc.value = ''
    if (!open || !imageUrl) return

    heroImageLoading.value = true
    try {
      heroImageSrc.value = await resolveImageDataUrl(imageUrl)
    } catch (error) {
      console.warn('Invite card hero preload failed:', error)
      heroImageSrc.value = imageUrl
    } finally {
      heroImageLoading.value = false
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) showProgress.value = true
  }
)

async function generateInviteCard() {
  if (!inviteCardRef.value) return

  generating.value = true
  let restoreHeroImage = () => {}

  try {
    await nextTick()
    if (document.fonts?.ready) {
      await document.fonts.ready
    }

    const hasHeroImage = Boolean(props.cardData?.imageUrl)
    let exportImageSrc = heroImageSrc.value || props.cardData?.imageUrl || ''

    if (hasHeroImage) {
      if (heroImageLoading.value) {
        await new Promise((resolve) => {
          const stop = watch(heroImageLoading, (loading) => {
            if (!loading) {
              stop()
              resolve()
            }
          })
        })
      }

      if (!exportImageSrc.startsWith('data:')) {
        exportImageSrc = await resolveImageDataUrl(props.cardData.imageUrl)
        heroImageSrc.value = exportImageSrc
      }

      if (!exportImageSrc.startsWith('data:')) {
        throw new Error('Could not load mission image for export')
      }

      restoreHeroImage = await prepareHeroImageForExport(inviteCardRef.value, exportImageSrc)
      await nextTick()
    }

    const dataUrl = await captureElementToPng(inviteCardRef.value, {
      backgroundColor: null,
      scale: 2,
      useHtml2Canvas: true,
      borderRadius: 32
    })

    const fileName = `ignite-invite-${props.cardData?.challengeId || 'mission'}.png`
    const outcome = await shareOrDownloadImage(dataUrl, fileName, {
      title: props.cardData?.title || 'Ignite',
      text: props.cardData?.shareText || props.cardData?.title || '',
      url: props.inviteUrl || ''
    })

    if (outcome === 'cancelled') return

    dialogModel.value = false

    try {
      const response = await userService.awardManifestSparks({
        type: 'invite',
        challengeId: props.cardData?.challengeId || undefined
      })
      applyRewardResponse(response)
    } catch (manifestError) {
      console.warn('Manifest sparks award failed', manifestError)
    }
  } catch (error) {
    console.error('Invite card export failed:', error)
  } finally {
    restoreHeroImage()
    generating.value = false
  }
}
</script>

<style scoped>
.invite-dialog-card {
  background: var(--home-bg, #0f172a) !important;
  color: var(--home-text, #ffffff) !important;
  border-radius: 24px !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.invite-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.invite-dialog-body {
  padding-top: 20px !important;
}

.preview-shell {
  display: flex;
  justify-content: center;
  width: 100%;
}

.invite-card-preview {
  width: 100%;
  max-width: 380px;
  min-height: 560px;
  position: relative;
  overflow: hidden;
  border-radius: 32px;
  background: linear-gradient(145deg, #0f172a 0%, #111827 45%, #1e1b4b 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.45),
    inset 0 0 40px rgba(79, 209, 197, 0.05);
  display: flex;
  flex-direction: column;
}

.invite-card-hero {
  position: relative;
  flex-shrink: 0;
  height: 320px;
  overflow: hidden;
}

.invite-card-hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invite-card-hero-fallback {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 10%, rgba(79, 209, 197, 0.28), transparent 32%),
    radial-gradient(circle at 90% 20%, rgba(112, 72, 232, 0.35), transparent 34%),
    linear-gradient(145deg, #0f172a 0%, #111827 45%, #1e1b4b 100%);
}

.invite-card-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(11, 13, 18, 0.15) 0%,
    rgba(11, 13, 18, 0.55) 55%,
    rgba(11, 13, 18, 0.96) 100%
  );
  z-index: 1;
}

.invite-card-hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 28px 28px 24px;
}

.invite-card-topline {
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(79, 209, 197, 0.14);
  border: 1px solid rgba(79, 209, 197, 0.4);
  color: #4FD1C5;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}

.invite-card-hook {
  margin: 14px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.72);
}

.invite-card-title {
  margin: 4px 0 0;
  font-size: 1.85rem;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #ffffff;
}

.invite-card-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  padding: 4px 28px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invite-person-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.invite-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 209, 197, 0.18);
  border: 2px solid rgba(79, 209, 197, 0.45);
  color: #4FD1C5;
  font-weight: 800;
  font-size: 1rem;
}

.invite-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.invite-person-meta {
  min-width: 0;
}

.invite-person-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
}

.invite-person-status,
.invite-status-solo {
  margin-top: 2px;
  font-size: 0.82rem;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.62);
}

.invite-status-solo {
  margin-top: 0;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.invite-participants-pill {
  align-self: flex-start;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(79, 209, 197, 0.1);
  border: 1px solid rgba(79, 209, 197, 0.28);
  color: rgba(79, 209, 197, 0.95);
  font-size: 0.78rem;
  font-weight: 700;
}

.invite-card-footer {
  margin-top: auto;
  padding-top: 4px;
}

.cta-label {
  color: #4FD1C5;
  font-size: 1rem;
  font-weight: 800;
}

.ignite-brand {
  margin-top: 4px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.45);
}

.invite-quick-toggle {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.invite-quick-toggle :deep(.v-label) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 0.85rem;
}

.generate-invite-btn {
  background: linear-gradient(135deg, #7048E8 0%, #4FD1C5 100%) !important;
  color: #ffffff !important;
  font-weight: 900 !important;
  text-transform: none !important;
  border-radius: 14px !important;
  letter-spacing: 0.01em;
}

.invite-dialog-actions {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 24px 20px;
}

@media (max-width: 600px) {
  .invite-card-preview {
    min-height: 520px;
    border-radius: 24px;
  }

  .invite-card-hero {
    height: 260px;
  }

  .invite-card-hero-content,
  .invite-card-content {
    padding-left: 22px;
    padding-right: 22px;
  }

  .invite-card-title {
    font-size: 1.55rem;
  }
}
</style>
