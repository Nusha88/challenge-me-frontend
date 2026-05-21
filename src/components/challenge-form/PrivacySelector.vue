<template>
  <div class="privacy-selection">
    <p class="field-label mb-4">{{ t('challenges.privacyMode') }}</p>

    <v-row>
      <v-col cols="12" sm="6">
        <div
          class="privacy-card"
          :class="{ active: privacy === 'private' }"
          @click="privacy = 'private'"
        >
          <v-icon size="32">mdi-shield-lock-outline</v-icon>
          <div class="ml-4">
            <span class="d-block font-weight-bold">{{ t('challenges.secretQuest') }}</span>
            <span class="text-caption">{{ t('challenges.secretQuestDesc') }}</span>
          </div>
          <v-spacer />
          <v-radio v-model="privacy" value="private" color="#7e46c4" />
        </div>
      </v-col>

      <v-col cols="12" sm="6">
        <div
          class="privacy-card"
          :class="{ active: privacy === 'public' }"
          @click="privacy = 'public'"
        >
          <v-icon size="32">mdi-fountain-pen-tip</v-icon>
          <div class="ml-4">
            <span class="d-block font-weight-bold">{{ t('challenges.worldChronicle') }}</span>
            <span class="text-caption">{{ t('challenges.worldChronicleDesc') }}</span>
          </div>
          <v-spacer />
          <v-radio v-model="privacy" value="public" color="#7e46c4" />
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const privacy = defineModel('privacy', { type: String, default: 'private' })

const { t } = useI18n()
</script>
