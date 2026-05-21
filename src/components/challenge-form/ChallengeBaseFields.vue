<template>
  <div>
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <label class="field-label">{{ t('challenges.title') }}</label>
        <v-text-field
          :model-value="title"
          variant="outlined"
          required
          :error-messages="titleError"
          :placeholder="titlePlaceholder"
          :rules="[v => !!v || t('challenges.validation.titleRequired')]"
          @update:model-value="emit('update:title', $event)"
        />
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center mt-2">
        <v-btn
          :class="['cover-photo-toggle-btn', { active: showImageUpload }]"
          variant="outlined"
          block
          @click="emit('update:showImageUpload', !showImageUpload)"
        >
          <v-icon left>mdi-image</v-icon>
          {{ coverMediaTitle }}
        </v-btn>
      </v-col>
    </v-row>

    <div v-if="showImageUpload" class="mb-4 mobile-upload-section">
      <ChallengeImageUpload
        :model-value="imageUrl"
        :editable="true"
        @update:model-value="emit('update:imageUrl', $event)"
      />
    </div>

    <label class="field-label">{{ t('challenges.description') }}</label>
    <v-textarea
      :model-value="description"
      variant="outlined"
      rows="5"
      class="mb-4"
      :error-messages="descriptionError"
      @update:model-value="emit('update:description', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ChallengeImageUpload from '../ChallengeImageUpload.vue'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  showImageUpload: { type: Boolean, default: false },
  challengeType: { type: String, default: 'habit' },
  titleError: { type: String, default: '' },
  descriptionError: { type: String, default: '' }
})

const emit = defineEmits([
  'update:title',
  'update:description',
  'update:imageUrl',
  'update:showImageUpload'
])

const { t } = useI18n()

const titlePlaceholder = computed(() => {
  return props.challengeType === 'habit'
    ? t('challenges.titlePlaceholder.habit')
    : t('challenges.titlePlaceholder.result')
})

const coverMediaTitle = computed(() => {
  return props.challengeType === 'result'
    ? t('challenges.epicBannerTitle')
    : t('challenges.coverPhotoTitle')
})
</script>

<style scoped>
.cover-photo-toggle-btn {
  height: 56px !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  white-space: nowrap;
  border: 2px solid #e2e8f0 !important;
  color: #64748b !important;
  transition: all 0.3s ease !important;
}

.cover-photo-toggle-btn:hover {
  border-color: #7e46c4 !important;
  color: #7e46c4 !important;
  background: rgba(126, 70, 196, 0.05) !important;
}

.cover-photo-toggle-btn.active {
  border-color: #7e46c4 !important;
  background: linear-gradient(135deg, #7e46c4 0%, #8a4af3 100%) !important;
  color: #ffffff !important;
}

.mobile-upload-section {
  display: block;
}
</style>
