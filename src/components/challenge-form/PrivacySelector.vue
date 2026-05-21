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
            <v-radio v-model="privacy" value="private" color="#7e46c4" :disabled="disabled" />
          </div>
        </v-col>

        <v-col cols="12" sm="6">
          <div
            class="privacy-card"
            :class="{ active: privacy === 'public' }"
            @click="!disabled && (privacy = 'public')"
          >
            <v-icon size="32">mdi-fountain-pen-tip</v-icon>
            <div class="ml-4">
              <span class="d-block font-weight-bold">{{ t('challenges.worldChronicle') }}</span>
              <span class="text-caption">{{ t('challenges.worldChronicleDesc') }}</span>
            </div>
            <v-spacer />
            <v-radio v-model="privacy" value="public" color="#7e46c4" :disabled="disabled" />
          </div>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  variant: { type: String, default: 'cards' },
  disabled: { type: Boolean, default: false },
  menuProps: { type: Object, default: undefined }
})

const privacy = defineModel('privacy', { type: String, default: 'private' })

const { t } = useI18n()

const privacyOptions = computed(() => [
  { title: t('challenges.privacyOptions.public'), value: 'public' },
  { title: t('challenges.privacyOptions.private'), value: 'private' }
])
</script>
