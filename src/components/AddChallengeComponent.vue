<template>
  <div class="add-challenge mission-form">
    <LaunchHeader />

    <div class="form-container">
      <v-form @submit.prevent="handleSubmit">
        <ChallengeTypeSelector
          :model-value="form.challengeType"
          @update:model-value="selectChallengeType"
        />

        <v-row>
          <v-col cols="12" md="8">
            <div class="form-fields-wrapper mission-form-fields">
              <MissionSectionDivider
                :label="t('challenges.launch.basics')"
                icon="mdi-text-box-outline"
                flush-top
              />
              <ChallengeBaseFields
                v-model:title="form.title"
                v-model:description="form.description"
                v-model:image-url="form.imageUrl"
                v-model:show-image-upload="showImageUpload"
                :challenge-type="form.challengeType"
                :title-error="errors.title"
                :description-error="errors.description"
                :description-required="!isHabit"
              />

              <MissionSectionDivider
                :label="t('challenges.launch.settings')"
                icon="mdi-cog-outline"
              />

              <HabitSettingsSection
                v-if="isHabit"
                v-model:duration="form.duration"
                v-model:custom-duration="form.customDuration"
                v-model:frequency="form.frequency"
                v-model:start-option="form.startOption"
                v-model:start-date="form.startDate"
                v-model:privacy="form.privacy"
                v-model:allow-comments="form.allowComments"
                :duration-error="errors.duration"
              />

              <ResultSettingsSection
                v-else
                v-model:actions="form.actions"
                v-model:end-date="form.endDate"
                v-model:difficulty="form.difficulty"
                v-model:privacy="form.privacy"
                v-model:reward="form.reward"
                v-model:allow-comments="form.allowComments"
                :end-date-error="errors.endDate"
                :actions-error="errors.actions"
              />

              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                closable
                class="mb-4"
                @click:close="clearError"
              >
                {{ errorMessage }}
              </v-alert>

              <div class="create-button-wrapper create-button-wrapper--desktop">
                <v-btn
                  type="submit"
                  size="large"
                  :loading="loading"
                  :disabled="loading"
                  class="create-mission-btn app-cta-primary"
                  :class="{
                    'disabled-grayscale': !isFormValid,
                    'create-mission-btn--ready': isFormValid && !loading
                  }"
                  :aria-disabled="!isFormValid || loading"
                >
                  {{ createButtonText }}
                </v-btn>
              </div>
            </div>
          </v-col>

          <v-col v-if="showImageUpload" cols="12" md="4" class="desktop-upload-section">
            <ChallengeImageUpload
              v-model="form.imageUrl"
              :editable="true"
            />
          </v-col>
        </v-row>
      </v-form>
    </div>

    <div class="launch-sticky-cta">
      <v-btn
        type="button"
        size="large"
        block
        :loading="loading"
        :disabled="loading"
        class="create-mission-btn app-cta-primary"
        :class="{
          'disabled-grayscale': !isFormValid,
          'create-mission-btn--ready': isFormValid && !loading
        }"
        :aria-disabled="!isFormValid || loading"
        @click="handleSubmit"
      >
        {{ createButtonText }}
      </v-btn>
    </div>

    <SuccessModal
      v-model="showSuccessModal"
      :challenge-id="createdChallengeId"
      :is-public="form.privacy === 'public'"
      @add-another="resetForm"
    />

    <v-snackbar
      v-model="validationToastOpen"
      color="error"
      location="bottom"
      :timeout="4000"
    >
      {{ t('challenges.validation.formIncomplete') }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import SuccessModal from './SuccessModal.vue'
import MissionSectionDivider from './MissionSectionDivider.vue'
import LaunchHeader from './challenge-form/LaunchHeader.vue'
import ChallengeTypeSelector from './challenge-form/ChallengeTypeSelector.vue'
import ChallengeBaseFields from './challenge-form/ChallengeBaseFields.vue'
import HabitSettingsSection from './challenge-form/HabitSettingsSection.vue'
import ResultSettingsSection from './challenge-form/ResultSettingsSection.vue'
import { useChallengeCreateForm } from '../composables/useChallengeCreateForm'

const { t } = useI18n()

const {
  form,
  errors,
  showImageUpload,
  showSuccessModal,
  createdChallengeId,
  loading,
  errorMessage,
  validationToastOpen,
  isHabit,
  createButtonText,
  isFormValid,
  initFromRestartDraft,
  selectChallengeType,
  handleSubmit,
  resetForm,
  clearError
} = useChallengeCreateForm()

onMounted(() => {
  initFromRestartDraft()
})
</script>

<style scoped>
.add-challenge {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0 88px;
  position: relative;
  color: var(--home-text, #f1f5f9);
}

.form-container {
  width: 100%;
}

.form-fields-wrapper {
  width: 100%;
}

.desktop-upload-section {
  display: none;
}

.create-button-wrapper--desktop {
  display: flex;
}

.launch-sticky-cta {
  display: none;
}

@media (min-width: 960px) {
  .desktop-upload-section {
    display: block;
  }

  .add-challenge {
    padding-bottom: 0;
  }
}

@media (max-width: 959px) {
  .create-button-wrapper--desktop {
    display: none;
  }

  .launch-sticky-cta {
    display: block;
    position: sticky;
    bottom: 12px;
    z-index: 20;
    margin-top: 16px;
    padding: 10px;
    border-radius: 16px;
    background: rgba(13, 17, 28, 0.88);
    border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
    backdrop-filter: blur(12px);
  }
}
</style>
