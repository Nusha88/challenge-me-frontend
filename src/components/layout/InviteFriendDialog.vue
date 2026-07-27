<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    class="invite-friend-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="invite-friend-card">
      <v-card-title class="invite-friend-title d-flex align-center justify-space-between">
        <span>{{ t('referral.modalTitle') }}</span>
        <v-btn icon variant="text" size="small" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <p class="invite-friend-subtitle mb-4">{{ t('referral.modalSubtitle') }}</p>

        <div class="reward-visual mb-4">
          <span class="sparks-icon">✦</span>
          <span class="reward-amount pt-1">50</span>
          <span class="reward-label">{{ t('referral.sparksUnit') }}</span>
        </div>

        <p
          class="remaining-invites mb-4"
          :class="{ 'remaining-invites--exhausted': !canInviteMore }"
        >
          {{
            canInviteMore
              ? t('referral.remainingInvites', { remaining })
              : t('referral.limitReached')
          }}
        </p>

        <div class="referral-link-block" :class="{ 'is-disabled': !canInviteMore }">
          <div class="referral-link-label">{{ t('referral.yourLink') }}</div>
          <div class="referral-link-value">{{ referralLink || '—' }}</div>
        </div>

        <div class="invite-actions mt-6">
          <v-btn
            block
            height="48"
            class="copy-link-btn app-cta-primary mb-3"
            :disabled="!referralLink || !canInviteMore"
            @click="$emit('copy-link')"
          >
            <v-icon start size="18">mdi-content-copy</v-icon>
            {{ copyFeedback ? t('referral.copied') : t('referral.copyLink') }}
          </v-btn>

          <div class="share-row">
            <v-btn
              class="share-btn telegram-btn"
              variant="flat"
              :disabled="!referralLink || !canInviteMore"
              @click="$emit('share-telegram')"
            >
              <v-icon start size="18">mdi-send</v-icon>
              {{ t('referral.shareTelegram') }}
            </v-btn>
            <v-btn
              class="share-btn whatsapp-btn"
              variant="flat"
              :disabled="!referralLink || !canInviteMore"
              @click="$emit('share-whatsapp')"
            >
              <v-icon start size="18">mdi-whatsapp</v-icon>
              {{ t('referral.shareWhatsApp') }}
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  referralLink: { type: String, default: '' },
  copyFeedback: { type: Boolean, default: false },
  invitedCount: { type: Number, default: 0 },
  maxInvites: { type: Number, default: 5 },
  canInviteMore: { type: Boolean, default: true }
})

defineEmits(['update:modelValue', 'copy-link', 'share-telegram', 'share-whatsapp'])

const { t } = useI18n()

const remaining = computed(() =>
  Math.max(0, (props.maxInvites || 0) - (props.invitedCount || 0))
)
</script>

<style scoped>
.invite-friend-card {
  background: var(--home-surface, #131A2D) !important;
  color: var(--home-text, #ffffff) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
  border-radius: 20px !important;
}

.invite-friend-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  line-height: 1.35;
  padding: 20px 20px 8px;
  color: var(--home-text, #fff);
}

.invite-friend-subtitle {
  color: var(--home-text-dim, rgba(255, 255, 255, 0.65));
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.reward-visual {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(79, 209, 197, 0.08);
  border: 1px solid rgba(79, 209, 197, 0.2);
}

.reward-amount {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--home-gold, #ffc107);
}

.sparks-icon {
  color: var(--home-gold, #ffc107);
  font-size: 1.5rem;
}

.reward-label {
  color: var(--home-text-dim, rgba(255, 255, 255, 0.75));
  font-size: 0.85rem;
  font-weight: 600;
}

.remaining-invites {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--home-teal, #4FD1C5);
}

.remaining-invites--exhausted {
  color: #f87171;
}

.referral-link-block {
  padding: 16px;
  border-radius: 14px;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.referral-link-block.is-disabled {
  opacity: 0.55;
}

.referral-link-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--home-text-faint, rgba(255, 255, 255, 0.45));
  margin-bottom: 8px;
  font-weight: 700;
}

.referral-link-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92rem;
  line-height: 1.45;
  word-break: break-all;
  color: var(--home-text, #ffffff);
}

.copy-link-btn {
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 12px !important;
}

.share-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.share-btn {
  border-radius: 12px !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.telegram-btn {
  background: rgba(42, 171, 238, 0.15) !important;
  color: #7dd3fc !important;
  border: 1px solid rgba(42, 171, 238, 0.35) !important;
}

.whatsapp-btn {
  background: rgba(37, 211, 102, 0.12) !important;
  color: #86efac !important;
  border: 1px solid rgba(37, 211, 102, 0.35) !important;
}
</style>
