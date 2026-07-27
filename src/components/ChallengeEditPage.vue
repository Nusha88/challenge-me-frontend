<template>
  <div class="challenge-edit-page mission-form">
    <div class="edit-page-inner">
      <div class="mission-header-panel mb-6">
        <div class="d-flex align-center gap-3 w-100">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            class="back-tactical-btn"
            @click="goBack"
          />

          <div class="title-container flex-grow-1" data-validation-field="title">
            <span class="section-tag section-tag--required mb-1">{{ t('challenges.title') }}</span>
            <h1
              v-if="!isEditingTitle"
              class="page-title-display"
              @click="startEditingTitle"
            >
              {{ editForm.title || t('challenges.editTitle') }}
              <v-icon
                v-if="!isDisabled"
                size="16"
                class="edit-hint-icon ml-2"
              >
                mdi-pencil-outline
              </v-icon>
            </h1>
            <v-text-field
              v-else
              v-model="editForm.title"
              variant="plain"
              class="title-input-active"
              autofocus
              hide-details
              @blur="stopEditingTitle"
              @keyup.enter="stopEditingTitle"
            />
            <p v-if="errors.title" class="field-error-text mt-1 mb-0">{{ errors.title }}</p>
          </div>

          <div class="header-status-badges">
            <v-chip
              v-if="challenge?.challengeType"
              :color="challengeTypeColor"
              size="small"
              variant="flat"
              class="tactical-chip"
            >
              {{ challengeTypeLabel }}
            </v-chip>
            <v-icon
              v-if="challenge?.privacy === 'private'"
              color="var(--home-teal, #4FD1C5)"
              size="18"
              class="ml-2"
            >
              mdi-lock-outline
            </v-icon>
          </div>
        </div>
      </div>

      <v-progress-linear
        v-if="loading"
        indeterminate
        color="var(--home-teal, #4FD1C5)"
        class="mb-4 rounded-pill"
      />

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4 rounded-xl custom-alert"
      >
        {{ errorMessage }}
      </v-alert>

      <v-alert
        v-if="challenge && isDisabled"
        type="info"
        variant="tonal"
        class="mb-4 rounded-xl finished-banner"
      >
        {{ t('challenges.challengeFinished') }}
      </v-alert>

      <div v-if="challenge && !loading && !errorMessage" class="form-container">
        <v-form @submit.prevent="handleSubmit">
          <v-row no-gutters>
            <v-col cols="12">
              <div class="form-fields-wrapper mission-form-fields">
                <MissionSectionDivider
                  :label="t('challenges.launch.basics')"
                  icon="mdi-text-box-outline"
                  flush-top
                />

                <ChallengeBaseFields
                  v-model:title="editForm.title"
                  v-model:description="editForm.description"
                  v-model:image-url="editForm.imageUrl"
                  :challenge-type="challenge.challengeType"
                  :title-error="errors.title"
                  :description-error="errors.description"
                  :description-required="isResult"
                  hide-title
                  editable
                  compact
                  :show-image-toggle="false"
                  :disabled="isDisabled"
                />

                <MissionSectionDivider
                  :label="t('challenges.launch.settings')"
                  icon="mdi-cog-outline"
                />

                <HabitSettingsSection
                  v-if="isHabit"
                  mode="edit"
                  v-model:duration="editForm.duration"
                  v-model:custom-duration="editForm.customDuration"
                  v-model:frequency="editForm.frequency"
                  v-model:start-date="editForm.startDate"
                  v-model:end-date="editForm.endDate"
                  v-model:privacy="editForm.privacy"
                  v-model:allow-comments="editForm.allowComments"
                  :duration-error="errors.duration"
                  :frequency-error="errors.frequency"
                  :disabled="isDisabled"
                  :menu-props="tacticalSelectMenuProps"
                  @pick-start="openStartDatePicker"
                  @pick-end="openEndDatePicker"
                />

                <ResultSettingsSection
                  v-else
                  mode="edit"
                  v-model:actions="editForm.actions"
                  v-model:start-date="editForm.startDate"
                  v-model:end-date="editForm.endDate"
                  v-model:difficulty="editForm.difficulty"
                  v-model:privacy="editForm.privacy"
                  v-model:reward="editForm.reward"
                  v-model:allow-comments="editForm.allowComments"
                  :end-date-error="errors.endDate"
                  :actions-error="errors.actions"
                  :disabled="isDisabled"
                  @pick-start="openStartDatePicker"
                />

                <v-alert
                  v-if="saveError"
                  type="error"
                  variant="tonal"
                  class="mb-4 rounded-xl custom-alert"
                >
                  {{ saveError }}
                </v-alert>

                <div class="mission-footer-actions create-button-wrapper create-button-wrapper--desktop">
                  <v-btn
                    type="submit"
                    size="large"
                    :loading="saveLoading"
                    :disabled="isDisabled || saveLoading"
                    class="footer-btn save-btn app-cta-primary"
                  >
                    {{ t('challenges.update') }}
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    color="error"
                    class="footer-btn delete-btn"
                    :disabled="saveLoading"
                    @click="handleDelete"
                  >
                    {{ t('challenges.delete') }}
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </div>

      <div
        v-if="challenge && !loading && !errorMessage"
        class="launch-sticky-cta"
      >
        <v-btn
          type="button"
          size="large"
          block
          :loading="saveLoading"
          :disabled="isDisabled || saveLoading"
          class="create-mission-btn app-cta-primary"
          @click="handleSubmit"
        >
          {{ t('challenges.update') }}
        </v-btn>
        <v-btn
          variant="outlined"
          color="error"
          block
          class="footer-btn delete-btn mt-2"
          :disabled="saveLoading"
          @click="handleDelete"
        >
          {{ t('challenges.delete') }}
        </v-btn>
      </div>

      <v-dialog v-model="showStartDatePicker" max-width="400">
        <v-date-picker
          v-model="startDatePickerModel"
          @update:model-value="handleStartDatePick"
        />
      </v-dialog>

      <v-dialog v-model="showEndDatePicker" max-width="400">
        <v-date-picker
          v-model="endDatePickerModel"
          :min="editForm.startDate || undefined"
          @update:model-value="handleEndDatePick"
        />
      </v-dialog>

      <DeleteChallengeDialog
        v-model="deleteConfirmDialog"
        :loading="deleteLoading"
        :error="deleteError"
        @confirm="confirmDelete"
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
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ChallengeBaseFields from './challenge-form/ChallengeBaseFields.vue'
import HabitSettingsSection from './challenge-form/HabitSettingsSection.vue'
import ResultSettingsSection from './challenge-form/ResultSettingsSection.vue'
import DeleteChallengeDialog from './challenge-form/DeleteChallengeDialog.vue'
import MissionSectionDivider from './MissionSectionDivider.vue'
import { useChallengeEditForm } from '../composables/useChallengeEditForm'

const { t } = useI18n()

const {
  tacticalSelectMenuProps,
  showStartDatePicker,
  showEndDatePicker,
  startDatePickerModel,
  endDatePickerModel,
  challenge,
  loading,
  errorMessage,
  saveLoading,
  saveError,
  deleteLoading,
  deleteConfirmDialog,
  deleteError,
  isEditingTitle,
  validationToastOpen,
  editForm,
  errors,
  challengeTypeLabel,
  challengeTypeColor,
  isHabit,
  isResult,
  isDisabled,
  handleStartDatePick,
  handleEndDatePick,
  goBack,
  handleDelete,
  confirmDelete,
  handleSubmit
} = useChallengeEditForm()

function startEditingTitle() {
  if (!isDisabled.value) {
    isEditingTitle.value = true
  }
}

function stopEditingTitle() {
  isEditingTitle.value = false
}

function openStartDatePicker() {
  if (!isDisabled.value) {
    showStartDatePicker.value = true
  }
}

function openEndDatePicker() {
  if (!isDisabled.value) {
    showEndDatePicker.value = true
  }
}
</script>

<style scoped>
.challenge-edit-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px 120px;
  position: relative;
  color: var(--home-text, #f1f5f9);
}

.edit-page-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.mission-header-panel {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.04));
  backdrop-filter: blur(10px);
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  padding: 12px 20px;
}

.page-title-display {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--home-text, #fff);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: 0.2s;
}

.page-title-display:hover {
  color: var(--home-teal, #4FD1C5);
}

.edit-hint-icon {
  opacity: 0.3;
}

.finished-banner {
  background: rgba(79, 209, 197, 0.1) !important;
  border: 1px solid rgba(79, 209, 197, 0.25) !important;
}

.mission-footer-actions {
  margin-top: 40px;
  margin-bottom: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.footer-btn {
  border-radius: 12px !important;
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.create-button-wrapper--desktop {
  display: flex;
}

.launch-sticky-cta {
  display: none;
}

.custom-alert {
  background: rgba(255, 82, 82, 0.1) !important;
  border: 1px solid rgba(255, 82, 82, 0.2) !important;
}

@media (max-width: 959px) {
  .challenge-edit-page {
    padding: 0 0 100px;
  }

  .mission-header-panel {
    padding: 10px 12px;
    border-radius: 12px;
  }

  .page-title-display {
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .title-container {
    min-width: 0;
    overflow: hidden;
  }

  .header-status-badges {
    flex-shrink: 0;
  }

  .mission-footer-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-top: 24px;
    padding-top: 16px;
  }

  .footer-btn {
    width: 100%;
    justify-content: center;
  }

  .create-button-wrapper--desktop {
    display: none;
  }

  .launch-sticky-cta {
    display: block;
    position: sticky;
    bottom: 12px;
    z-index: 20;
    margin-top: 16px;
    padding: 8px;
    border-radius: 16px;
    background: rgba(13, 17, 28, 0.88);
    border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
    backdrop-filter: blur(12px);
  }
}

@media (max-width: 440px) {
  .challenge-edit-page {
    padding: 0 0 96px;
  }

  .mission-header-panel {
    padding: 8px 10px;
  }

  .page-title-display {
    font-size: 1rem;
  }

  .back-tactical-btn {
    min-width: 36px !important;
    width: 36px !important;
    height: 36px !important;
  }

  .footer-btn {
    min-height: 44px;
  }
}
</style>

<style>
.challenge-edit-select-menu.v-overlay__content,
.challenge-edit-select-menu {
  background: var(--home-surface, #131A2D) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1)) !important;
  border-radius: 12px !important;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55) !important;
}

.challenge-edit-select-menu .v-list {
  background: var(--home-surface, #131A2D) !important;
  padding: 6px 0 !important;
}

.challenge-edit-select-menu .v-list-item {
  background: transparent !important;
}

.challenge-edit-select-menu .v-list-item__overlay {
  background: transparent !important;
}

.challenge-edit-select-menu .v-list-item-title {
  color: rgba(255, 255, 255, 0.95) !important;
}

.challenge-edit-select-menu .v-list-item--active .v-list-item-title {
  color: var(--home-teal, #4fd1c5) !important;
}

.challenge-edit-select-menu .v-list-item:hover {
  background: rgba(79, 209, 197, 0.12) !important;
}

.challenge-edit-select-menu .v-list-item--active {
  background: rgba(79, 209, 197, 0.15) !important;
}
</style>
