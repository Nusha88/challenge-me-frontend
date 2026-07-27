<template>
  <div class="privacy-selector" :class="{ 'privacy-selector--compact': variant === 'compact' }">
    <template v-if="variant === 'compact'">
      <span class="setting-label">{{ t('challenges.privacy') }}</span>
      <v-select
        v-model="privacy"
        :items="privacyOptions"
        variant="plain"
        class="tactical-select"
        hide-details
        :disabled="disabled"
        :menu-props="menuProps"
      />
    </template>

    <template v-else>
      <p class="field-label mb-4">{{ t('challenges.privacyMode') }}</p>

      <v-row>
        <v-col cols="12" sm="6">
          <div
            class="privacy-card"
            :class="{ active: privacy === 'private' }"
            @click="!disabled && (privacy = 'private')"
          >
            <v-icon size="32">mdi-shield-lock-outline</v-icon>
            <div class="ml-4">
              <span class="d-block font-weight-bold">{{ t('challenges.secretQuest') }}</span>
              <span class="text-caption">{{ t('challenges.secretQuestDesc') }}</span>
            </div>
            <v-spacer />
            <v-radio v-model="privacy" value="private" color="#7048E8" :disabled="disabled" />
          </div>
        </v-col>

        <v-col cols="12" sm="6">
          <div
            class="privacy-card"
            :class="{ active: privacy === 'public' }"
            @click="!disabled && (privacy = 'public')"
          >
            <v-icon size="32">mdi-earth</v-icon>
            <div class="ml-4">
              <span class="d-block font-weight-bold">{{ t('challenges.worldChronicle') }}</span>
              <span class="text-caption">{{ t('challenges.worldChronicleDesc') }}</span>
            </div>
            <v-spacer />
            <v-radio v-model="privacy" value="public" color="#7048E8" :disabled="disabled" />
          </div>
        </v-col>
      </v-row>

      <v-expand-transition>
        <div v-if="showCommentsToggle && privacy === 'public'" class="privacy-comments mt-4">
          <v-checkbox
            v-model="allowComments"
            :label="t('challenges.allowCommentsLabel')"
            color="#7048E8"
            hide-details
            class="privacy-comments-checkbox"
            :disabled="disabled"
          />
        </div>
      </v-expand-transition>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  variant: { type: String, default: 'cards' },
  disabled: { type: Boolean, default: false },
  menuProps: { type: Object, default: undefined },
  showCommentsToggle: { type: Boolean, default: false }
})

const privacy = defineModel('privacy', { type: String, default: 'private' })
const allowComments = defineModel('allowComments', { type: Boolean, default: true })

const { t } = useI18n()

const privacyOptions = computed(() => [
  { title: t('challenges.privacyOptions.public'), value: 'public' },
  { title: t('challenges.privacyOptions.private'), value: 'private' }
])
</script>

<style scoped>
.privacy-comments {
  padding: 14px 16px;
  border-radius: var(--home-radius, 16px);
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.privacy-comments-checkbox :deep(.v-label) {
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  color: var(--home-text, #f1f5f9) !important;
  opacity: 1 !important;
}
</style>
