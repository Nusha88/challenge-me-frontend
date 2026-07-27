<template>
  <div>
    <div
      v-if="mode === 'edit'"
      class="mission-dates-grid mt-6 mb-6"
    >
      <div class="date-info-box date-info-box--editable">
        <span class="label mb-3">{{ t('challenges.startDate') }}</span>
        <v-btn
          variant="outlined"
          class="mission-date-btn"
          :disabled="disabled"
          @click="$emit('pick-start')"
        >
          <v-icon size="18" class="mr-2">mdi-calendar-month-outline</v-icon>
          <span>{{ formattedStartDate }}</span>
        </v-btn>
      </div>
      <div class="date-divider">
        <v-icon color="rgba(255,255,255,0.1)">mdi-arrow-right-thin</v-icon>
      </div>
      <MissionDeadlinePicker
        v-model:end-date="endDate"
        variant="tactical"
        class="date-info-box date-info-box--editable flex-grow-1"
        :min="startDate || undefined"
        :disabled="disabled"
        label-required
        :error-message="endDateError"
      />
    </div>

    <div class="actions-plan-section mt-6" data-validation-field="actions">
      <p class="field-label field-label--required mb-1">{{ t('challenges.actionsPlan') }}</p>
      <p v-if="actionsError" class="field-error-text mb-3">{{ actionsError }}</p>
      <div class="actions-glass-wrapper pa-2">
        <ChallengeActions
          v-model="actions"
          :readonly="disabled"
          :hide-progress-checks="mode !== 'edit'"
          hide-header
        />
      </div>
    </div>

    <div v-if="mode !== 'edit'" class="mt-8" data-validation-field="endDate">
      <MissionDeadlinePicker
        v-model:end-date="endDate"
        :error-message="endDateError"
        :disabled="disabled"
        label-required
      />
    </div>

    <div class="mt-8">
      <DifficultySelector v-model:difficulty="difficulty" :disabled="disabled" />
    </div>

    <div class="mt-8">
      <PrivacySelector
        v-model:privacy="privacy"
        v-model:allow-comments="allowComments"
        show-comments-toggle
        :disabled="disabled"
      />
    </div>

    <div class="reward-block mt-8">
      <p class="field-label mb-4">{{ t('challenges.rewardTitle') }}</p>

      <div class="loot-container pa-1">
        <v-text-field
          v-model="reward"
          :placeholder="t('challenges.rewardPlaceholder')"
          variant="outlined"
          class="reward-input"
          hide-details
          :disabled="disabled"
        >
          <template #prepend-inner>
            <div class="reward-icon-box">
              <v-icon color="#FFD700">mdi-trophy-variant</v-icon>
            </div>
          </template>
        </v-text-field>
      </div>

      <p class="reward-hint mt-2 ml-2">
        {{ t('challenges.rewardHint') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ChallengeActions from '../ChallengeActions.vue'
import MissionDeadlinePicker from './MissionDeadlinePicker.vue'
import DifficultySelector from './DifficultySelector.vue'
import PrivacySelector from './PrivacySelector.vue'
import { formatDateForLocale } from '../../utils/dateUtils'

defineProps({
  mode: { type: String, default: 'create' },
  endDateError: { type: String, default: '' },
  actionsError: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

defineEmits(['pick-start'])

const actions = defineModel('actions', {
  type: Array,
  default: () => [{ text: '', checked: false, children: [] }]
})
const startDate = defineModel('startDate', { type: String, default: '' })
const endDate = defineModel('endDate', { type: String, default: '' })
const difficulty = defineModel('difficulty', { type: String, default: 'medium' })
const privacy = defineModel('privacy', { type: String, default: 'private' })
const reward = defineModel('reward', { type: String, default: '' })
const allowComments = defineModel('allowComments', { type: Boolean, default: true })

const { t, locale } = useI18n()

const formattedStartDate = computed(() => formatDateForLocale(startDate.value, locale.value))
</script>

<style scoped>
.actions-glass-wrapper {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.02));
  border-radius: 16px;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.06));
}

.loot-container {
  background: var(--home-surface, rgba(22, 27, 40, 0.55)) !important;
  border-radius: var(--home-radius, 16px);
  border: 1px solid rgba(255, 215, 0, 0.28) !important;
  padding: 4px;
}

.loot-container .reward-input :deep(.v-field) {
  background: transparent !important;
  font-weight: 600 !important;
  color: var(--home-text, #f1f5f9) !important;
}

.reward-icon-box {
  background: rgba(255, 215, 0, 0.12);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-right: 8px;
  border: 1px solid rgba(255, 215, 0, 0.28);
}

.reward-hint {
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.75rem;
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
