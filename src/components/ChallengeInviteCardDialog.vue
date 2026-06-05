<template>
  <v-dialog
    v-model="dialogModel"
    max-width="980"
    scrollable
  >
    <v-card class="invite-dialog-card">
      <v-card-title class="invite-dialog-title">
        <div>
          <div class="invite-kicker">
            {{ t('challenges.inviteCard.kicker') }}
          </div>
          <div class="text-h6 font-weight-bold">
            {{ t('challenges.inviteCard.title') }}
          </div>
        </div>

        <v-btn
          icon="mdi-close"
          variant="text"
          @click="dialogModel = false"
        />
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <div class="invite-options-panel">
              <h3 class="section-title mb-4">
                {{ t('challenges.inviteCard.whatToShow') }}
              </h3>

              <v-checkbox
                v-model="options.showParticipants"
                color="#4FD1C5"
                hide-details
                :label="t('challenges.inviteCard.showParticipants')"
              />

              <v-checkbox
                v-model="options.showDifficulty"
                color="#4FD1C5"
                hide-details
                :label="t('challenges.inviteCard.showDifficulty')"
              />

              <v-checkbox
                v-model="options.showProgress"
                color="#4FD1C5"
                hide-details
                :label="t('challenges.inviteCard.showProgress')"
              />

              <v-checkbox
                v-model="options.showAuthor"
                color="#4FD1C5"
                hide-details
                :label="t('challenges.inviteCard.showAuthor')"
              />

              <v-checkbox
                v-model="options.showDescription"
                color="#4FD1C5"
                hide-details
                :label="t('challenges.inviteCard.showDescription')"
              />
            </div>
          </v-col>

          <v-col cols="12" md="8">
            <div class="preview-shell">
              <div ref="inviteCardRef" class="invite-card-preview">
                <div class="invite-card-hero">
                  <img
                    v-if="cardData?.imageUrl"
                    :src="cardData.imageUrl"
                    alt=""
                    crossorigin="anonymous"
                    class="invite-card-hero-image"
                  />
                  <div
                    v-else
                    class="invite-card-hero-fallback"
                  ></div>
                  <div class="invite-card-hero-overlay"></div>
                  <div class="invite-card-hero-content">
                    <div class="invite-card-topline">
                      IGNITE / {{ cardData?.badgeLabel }}
                    </div>
                    <h2 class="invite-card-title">
                      {{ t('challenges.inviteCard.challengeMyself') }}
                      <span>{{ cardData?.title }}</span>
                    </h2>
                  </div>
                </div>

                <div class="invite-card-bg-glow"></div>

                <div class="invite-card-content">
                  <p
                    v-if="options.showDescription && cardData?.hasDescription"
                    class="invite-card-description"
                  >
                    {{ cardData.description }}
                  </p>

                  <div class="invite-card-status">
                    <div class="status-line">
                      {{ cardData?.durationLine }}
                    </div>
                    <div
                      v-if="options.showParticipants"
                      class="status-line accent"
                    >
                      {{ cardData?.participantsLine }}
                    </div>
                  </div>

                  <div class="invite-card-meta">
                    <div
                      v-if="options.showDifficulty && cardData?.hasDifficulty"
                      class="meta-pill"
                    >
                      <v-icon size="16">mdi-flash</v-icon>
                      {{ cardData.difficultyLabel }}
                    </div>

                    <div
                      v-if="options.showAuthor && cardData?.hasAuthor"
                      class="meta-pill"
                    >
                      <v-icon size="16">mdi-account</v-icon>
                      {{ cardData.authorLabel }}
                    </div>

                    <div
                      v-if="options.showProgress"
                      class="meta-pill"
                    >
                      <v-icon size="16">mdi-chart-line</v-icon>
                      {{ cardData?.progressLabel }}
                    </div>
                  </div>

                  <div class="invite-card-footer">
                    <div>
                      <div class="cta-label">
                        {{ t('challenges.inviteCard.cta') }}
                      </div>
                      <div class="ignite-brand">
                        Ignite
                      </div>
                    </div>

                    <img
                      v-if="qrCodeUrl"
                      :src="qrCodeUrl"
                      alt="QR"
                      class="qr-code"
                    />
                  </div>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="invite-dialog-actions">
        <v-spacer />
        <v-btn
          variant="text"
          @click="dialogModel = false"
        >
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn
          class="generate-invite-btn"
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
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import QRCode from 'qrcode'
import { toPng } from 'html-to-image'

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

const options = reactive({
  showParticipants: true,
  showDifficulty: true,
  showProgress: false,
  showAuthor: true,
  showDescription: true
})

const inviteCardRef = ref(null)
const generating = ref(false)
const qrCodeUrl = ref('')

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

watch(
  () => props.inviteUrl,
  async (url) => {
    if (!url) {
      qrCodeUrl.value = ''
      return
    }

    try {
      qrCodeUrl.value = await QRCode.toDataURL(url, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
    } catch {
      qrCodeUrl.value = ''
    }
  },
  { immediate: true }
)

async function generateInviteCard() {
  if (!inviteCardRef.value) return

  generating.value = true

  try {
    const dataUrl = await toPng(inviteCardRef.value, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#0f172a'
    })

    const link = document.createElement('a')
    link.download = `ignite-invite-${props.cardData?.challengeId || 'mission'}.png`
    link.href = dataUrl
    link.click()
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.invite-dialog-card {
  background: #0f172a !important;
  color: #ffffff !important;
  border-radius: 24px !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.invite-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.invite-kicker,
.section-title {
  color: #4FD1C5;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.4px;
}

.invite-options-panel {
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 18px;
}

.preview-shell {
  display: flex;
  justify-content: center;
  width: 100%;
}

.invite-card-preview {
  width: 420px;
  min-height: 620px;
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
  height: 210px;
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
  background:
    linear-gradient(to bottom, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.85) 100%),
    rgba(30, 15, 50, 0.4);
  z-index: 1;
}

.invite-card-hero-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px 34px;
}

.invite-card-bg-glow {
  position: absolute;
  inset: auto -80px -120px auto;
  width: 260px;
  height: 260px;
  background: rgba(79, 209, 197, 0.25);
  filter: blur(50px);
  border-radius: 999px;
}

.invite-card-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  padding: 24px 34px 34px;
  display: flex;
  flex-direction: column;
}

.invite-card-topline {
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(79, 209, 197, 0.12);
  border: 1px solid rgba(79, 209, 197, 0.35);
  color: #4FD1C5;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 1.5px;
}

.invite-card-title {
  margin-top: 12px;
  font-size: 1.65rem;
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #ffffff;
}

.invite-card-title span {
  display: block;
  margin-top: 6px;
  color: #ffffff;
}

.invite-card-description {
  margin-top: 0;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.5;
  font-size: 0.95rem;
}

.invite-card-status {
  margin-top: 30px;
  display: grid;
  gap: 10px;
}

.status-line {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.84);
  font-weight: 700;
}

.status-line.accent {
  border-color: rgba(79, 209, 197, 0.28);
  box-shadow: 0 0 24px rgba(79, 209, 197, 0.08);
}

.invite-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.78rem;
  font-weight: 700;
}

.invite-card-footer {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.cta-label {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.9rem;
  font-weight: 700;
}

.ignite-brand {
  margin-top: 4px;
  font-size: 1.8rem;
  font-weight: 950;
  letter-spacing: -0.04em;
  color: #ffffff;
}

.qr-code {
  width: 96px;
  height: 96px;
  padding: 7px;
  border-radius: 18px;
  background: #ffffff;
}

.generate-invite-btn {
  background: linear-gradient(135deg, #7048E8 0%, #4FD1C5 100%) !important;
  color: #ffffff !important;
  font-weight: 900 !important;
  text-transform: none !important;
  border-radius: 14px !important;
}

.invite-dialog-actions {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px 24px;
}

@media (max-width: 600px) {
  .invite-card-preview {
    width: 100%;
    min-height: 560px;
    border-radius: 24px;
  }

  .invite-card-hero {
    height: 180px;
  }

  .invite-card-hero-content {
    padding: 20px 26px;
  }

  .invite-card-content {
    padding: 20px 26px 26px;
  }

  .invite-card-title {
    font-size: 1.45rem;
  }
}
</style>
