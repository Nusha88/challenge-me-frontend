<template>
  <div>
    <div class="milestones-manager mt-6" data-validation-field="milestones">
      <p class="field-label field-label--required mb-1">{{ t('challenges.milestonesTitle') }}</p>
      <p v-if="milestonesError" class="field-error-text mb-3">{{ milestonesError }}</p>

      <div class="milestones-timeline mb-4">
        <div
          v-for="(step, index) in milestones"
          :key="index"
          class="milestone-item d-flex align-center pa-3 mb-2"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <v-text-field
            v-model="step.title"
            :placeholder="t('challenges.milestonePlaceholder')"
            variant="plain"
            hide-details
            class="ml-3"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="grey"
            @click="removeStep(index)"
          />
        </div>
      </div>

      <v-btn
        variant="dashed"
        block
        prepend-icon="mdi-flag-plus-outline"
        class="add-step-btn"
        @click="addStep"
      >
        {{ t('challenges.addMilestone') }}
      </v-btn>
    </div>

    <div class="mt-8" data-validation-field="endDate">
      <MissionDeadlinePicker
        v-model:end-date="endDate"
        :error-message="endDateError"
        label-required
      />
    </div>

    <div class="mt-8">
      <DifficultySelector v-model:difficulty="difficulty" />
    </div>

    <div class="mt-8">
      <PrivacySelector v-model:privacy="privacy" />
    </div>

    <div class="reward-block mt-8">
      <p class="field-label mb-4">{{ t('challenges.rewardTitle') }}</p>

      <div class="loot-container pa-1">
        <v-text-field
          v-model="reward"
          :placeholder="t('challenges.rewardPlaceholder')"
          variant="solo"
          flat
          bg-color="white"
          class="reward-input"
          hide-details
        >
          <template #prepend-inner>
            <div class="reward-icon-box">
              <v-icon color="#FFD700">mdi-trophy-variant</v-icon>
            </div>
          </template>
        </v-text-field>
      </div>

      <p class="text-caption text-grey-darken-1 mt-2 ml-2">
        {{ t('challenges.rewardHint') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import MissionDeadlinePicker from './MissionDeadlinePicker.vue'
import DifficultySelector from './DifficultySelector.vue'
import PrivacySelector from './PrivacySelector.vue'

const milestones = defineModel('milestones', {
  type: Array,
  default: () => [{ title: '' }]
})
const endDate = defineModel('endDate', { type: String, default: '' })
const difficulty = defineModel('difficulty', { type: String, default: 'medium' })
const privacy = defineModel('privacy', { type: String, default: 'private' })
const reward = defineModel('reward', { type: String, default: '' })

defineProps({
  endDateError: { type: String, default: '' },
  milestonesError: { type: String, default: '' }
})

const { t } = useI18n()

function addStep() {
  if (!milestones.value) {
    milestones.value = []
  }
  milestones.value.push({ title: '' })
}

function removeStep(index) {
  if (!milestones.value) return
  milestones.value.splice(index, 1)
  if (milestones.value.length === 0) {
    milestones.value.push({ title: '' })
  }
}
</script>

<style scoped>
.milestones-manager .milestone-item {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: 0.2s;
}

.milestones-manager .milestone-item :deep(.v-input) {
  margin: 0 !important;
  align-self: center;
}

.milestones-manager .milestone-item :deep(.v-field) {
  align-items: center !important;
}

.milestones-manager .milestone-item :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.milestones-manager .milestone-item:hover {
  border-color: #7e46c4;
}

.milestones-manager .milestone-item .step-number {
  background: #7048E8;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.75rem;
  flex: 0 0 auto;
  margin-right: 12px;
}

.milestones-manager .add-step-btn {
  border: 2px dashed #cbd5e1 !important;
  color: #64748b !important;
  text-transform: none !important;
  height: 48px !important;
  border-radius: 12px !important;
}

.milestones-manager .add-step-btn:hover {
  border-color: #7e46c4 !important;
  color: #7e46c4 !important;
  background: rgba(126, 70, 196, 0.02);
}

.loot-container {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 170, 0, 0.05) 100%) !important;
  border-radius: 20px;
  border: 2px solid #FFD700 !important;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.15), inset 0 0 10px rgba(255, 215, 0, 0.05) !important;
  padding: 4px;
  position: relative;
  overflow: hidden;
}

.loot-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent);
  transform: rotate(45deg);
  pointer-events: none;
}

.loot-container .reward-input :deep(.v-field) {
  font-weight: 700 !important;
  color: #FFD700 !important;
  letter-spacing: 0.5px;
}

.reward-icon-box {
  background: rgba(255, 215, 0, 0.15);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  margin-right: 8px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.reward-input :deep(input) {
  font-weight: 400;
  font-style: italic;
  color: rgba(255, 215, 0, 0.4) !important;
  opacity: 1;
}

.reward-input :deep(.v-field__shadow) {
  display: none !important;
}

.field-label--required::after {
  content: ' *';
  color: #f87171;
}

.field-error-text {
  color: #f87171;
  font-size: 0.75rem;
  line-height: 1.2;
  margin: 0;
}
</style>
