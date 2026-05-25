<template>
  <div
    class="challenge-base-fields"
    :class="{
      'challenge-base-fields--compact': compact,
      'challenge-base-fields--editable': editable
    }"
  >
    <v-row v-if="!hideTitle" class="mb-4">
      <v-col cols="12" :md="showImageToggle ? 6 : 12">
        <label v-if="!compact" class="field-label">{{ t('challenges.title') }}</label>
        <div v-else-if="editable" class="section-tag mb-2">{{ t('challenges.title') }}</div>

        <template v-if="editable && compact && !isEditingTitle">
          <h3
            class="title-display-box"
            :class="{ 'is-disabled': disabled }"
            @click="!disabled && (isEditingTitle = true)"
          >
            {{ title || t('challenges.editTitle') }}
            <v-icon size="16" class="edit-hint-icon ml-2">mdi-pencil-outline</v-icon>
          </h3>
        </template>
        <v-text-field
          v-else-if="editable && compact && isEditingTitle"
          :model-value="title"
          variant="outlined"
          color="#4FD1C5"
          class="title-input-active"
          autofocus
          hide-details
          :disabled="disabled"
          @update:model-value="emit('update:title', $event)"
          @blur="isEditingTitle = false"
          @keyup.enter="isEditingTitle = false"
        />
        <v-text-field
          v-else
          :model-value="title"
          variant="outlined"
          required
          :error-messages="titleError"
          :placeholder="titlePlaceholder"
          :disabled="disabled"
          :rules="[v => !!v || t('challenges.validation.titleRequired')]"
          @update:model-value="emit('update:title', $event)"
        />
      </v-col>

      <v-col v-if="showImageToggle" cols="12" md="6" class="d-flex align-center mt-2">
        <v-btn
          :class="['cover-photo-toggle-btn', { active: showImageUpload }]"
          variant="outlined"
          block
          :disabled="disabled"
          @click="emit('update:showImageUpload', !showImageUpload)"
        >
          <v-icon left>mdi-image</v-icon>
          {{ coverMediaTitle }}
        </v-btn>
      </v-col>
    </v-row>

    <div v-if="showImageToggle && showImageUpload" class="mb-4 mobile-upload-section">
      <ChallengeImageUpload
        :model-value="imageUrl"
        :editable="!disabled"
        @update:model-value="emit('update:imageUrl', $event)"
      />
    </div>

    <div v-else-if="!showImageToggle" class="image-upload-wrapper mb-8">
      <ChallengeImageUpload
        :model-value="imageUrl"
        :editable="!disabled"
        @update:model-value="emit('update:imageUrl', $event)"
      />
    </div>

    <template v-if="editable && compact">
      <div class="mission-description-block mb-8">
        <div class="section-tag mb-2">{{ t('challenges.description') }}</div>
        <div
          v-if="!isEditingDescription"
          class="description-display-box"
          :class="{ 'is-empty': !description, 'is-disabled': disabled }"
          @click="!disabled && (isEditingDescription = true)"
        >
          {{ description || t('challenges.descriptionPlaceholder') }}
          <v-icon class="edit-corner-icon">mdi-plus-circle-outline</v-icon>
        </div>
        <v-textarea
          v-else
          :model-value="description"
          variant="outlined"
          color="#4FD1C5"
          class="description-input-active"
          auto-grow
          autofocus
          hide-details
          :disabled="disabled"
          @update:model-value="emit('update:description', $event)"
          @blur="isEditingDescription = false"
        />
      </div>
    </template>

    <template v-else>
      <label class="field-label">{{ t('challenges.description') }}</label>
      <v-textarea
        :model-value="description"
        variant="outlined"
        rows="5"
        class="mb-4"
        :error-messages="descriptionError"
        :disabled="disabled"
        @update:model-value="emit('update:description', $event)"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CHALLENGE_TYPES } from '../../constants/challengeTypes'
import ChallengeImageUpload from '../ChallengeImageUpload.vue'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  showImageUpload: { type: Boolean, default: false },
  challengeType: { type: String, default: CHALLENGE_TYPES.HABIT },
  titleError: { type: String, default: '' },
  descriptionError: { type: String, default: '' },
  editable: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  showImageToggle: { type: Boolean, default: true },
  hideTitle: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:title',
  'update:description',
  'update:imageUrl',
  'update:showImageUpload'
])

const { t } = useI18n()

const isEditingTitle = ref(false)
const isEditingDescription = ref(false)

const titlePlaceholder = computed(() => {
  return props.challengeType === CHALLENGE_TYPES.HABIT
    ? t('challenges.titlePlaceholder.habit')
    : t('challenges.titlePlaceholder.result')
})

const coverMediaTitle = computed(() => {
  return props.challengeType === CHALLENGE_TYPES.RESULT
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

.challenge-base-fields--compact .title-display-box {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: 0.2s;
  margin: 0 0 8px;
}

.challenge-base-fields--compact .title-display-box:hover:not(.is-disabled) {
  color: #4FD1C5;
}

.challenge-base-fields--compact .title-display-box.is-disabled {
  cursor: default;
  opacity: 0.65;
}

.challenge-base-fields--compact .edit-hint-icon {
  opacity: 0.3;
}

.challenge-base-fields--compact .description-display-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  min-height: 100px;
  cursor: pointer;
  position: relative;
  transition: 0.3s;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.challenge-base-fields--compact .description-display-box:hover:not(.is-disabled) {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(79, 209, 197, 0.3);
}

.challenge-base-fields--compact .description-display-box.is-disabled {
  cursor: default;
  opacity: 0.65;
}

.challenge-base-fields--compact .edit-corner-icon {
  position: absolute;
  bottom: 12px;
  right: 12px;
  opacity: 0.2;
}

.challenge-base-fields--compact .description-input-active :deep(.v-field) {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

.challenge-base-fields--compact .description-input-active :deep(.v-field__input),
.challenge-base-fields--compact .description-input-active :deep(textarea) {
  color: #ffffff !important;
  caret-color: #4fd1c5;
}

.challenge-base-fields--compact .description-input-active :deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 1;
  color: rgba(255, 255, 255, 0.08) !important;
}

.challenge-base-fields--compact .description-input-active :deep(.v-field--focused.v-field--variant-outlined .v-field__outline) {
  color: rgba(79, 209, 197, 0.45) !important;
}

.challenge-base-fields--compact .title-input-active :deep(.v-field__input) {
  color: #ffffff !important;
}
</style>
