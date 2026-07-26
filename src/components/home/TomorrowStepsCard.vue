<template>
  <v-card class="todays-card todays-checklist-card home-glass-card checklist-card-tomorrow">
    <v-card-text>
      <div class="todays-checklist-section">
        <h3 class="home-section-title">{{ t('home.loggedIn.tomorrowSteps.title') }}</h3>

        <div v-if="tomorrowSteps.length === 0" class="tomorrow-steps-empty">
          <HomeEmptyState
            :image-src="tomorrowImage"
            :image-alt="t('home.loggedIn.tomorrowArtAlt')"
            :text="t('home.loggedIn.tomorrowSteps.empty.text')"
            :action-label="showTomorrowStepsInput ? '' : t('home.loggedIn.tomorrowSteps.empty.button')"
            @action="$emit('plan-new-step')"
          />
        </div>

        <div v-if="tomorrowSteps.length > 0 || showTomorrowStepsInput" class="tomorrow-steps-content">
          <div v-if="tomorrowSteps.length > 0" class="checklist-list">
            <div
              v-for="(step, index) in tomorrowSteps"
              :key="index"
              class="checklist-item"
            >
              <input
                v-if="editingTomorrowStepIndex === index"
                :value="editingTomorrowStepText"
                type="text"
                class="step-edit-input"
                @input="$emit('update:editingTomorrowStepText', $event.target.value)"
                @keyup.enter="$emit('save-step-edit', index)"
                @keyup.esc="$emit('cancel-step-edit')"
                @blur="$emit('save-step-edit', index)"
              />
              <span
                v-else
                class="step-text"
                @dblclick="$emit('start-editing-step', index, step.title)"
              >
                {{ step.title }}
              </span>
              <button
                type="button"
                class="delete-action"
                :aria-label="t('home.loggedIn.dailyChecklist.deleteStep')"
                @click="$emit('remove-step', index)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>

          <div class="add-step-wrapper">
            <input
              :value="tomorrowStepText"
              type="text"
              :placeholder="t('home.loggedIn.dailyChecklist.addStepPlaceholder')"
              class="step-input"
              @input="$emit('update:tomorrowStepText', $event.target.value)"
              @keyup.enter="$emit('add-step')"
            />
            <v-btn
              :disabled="!tomorrowStepText.trim()"
              class="add-step-btn"
              icon
              @click="$emit('add-step')"
            >
              <Plus :size="18" color="white" />
            </v-btn>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'
import HomeEmptyState from './HomeEmptyState.vue'
import tomorrowImage from '../../assets/home/tomorrow-280.webp'

defineProps({
  tomorrowSteps: { type: Array, default: () => [] },
  showTomorrowStepsInput: { type: Boolean, default: false },
  tomorrowStepText: { type: String, default: '' },
  editingTomorrowStepIndex: { type: Number, default: -1 },
  editingTomorrowStepText: { type: String, default: '' }
})

defineEmits([
  'plan-new-step',
  'add-step',
  'remove-step',
  'start-editing-step',
  'save-step-edit',
  'cancel-step-edit',
  'update:tomorrowStepText',
  'update:editingTomorrowStepText'
])

const { t } = useI18n()
</script>

<style scoped>
.todays-checklist-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.checklist-card-tomorrow {
  border: 2px dashed rgba(112, 72, 232, 0.28) !important;
}

.tomorrow-steps-empty {
  min-height: 180px;
}

.todays-checklist-section :deep(.home-section-title) {
  margin-bottom: 8px;
}

.tomorrow-steps-content {
  width: 100%;
}

.tomorrow-steps-content .checklist-list {
  margin-top: 16px;
  min-height: 50px;
}

.tomorrow-steps-content .checklist-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tomorrow-steps-content .step-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Plus Jakarta Sans', sans-serif;
  flex: 1;
  word-wrap: break-word;
  cursor: text;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.tomorrow-steps-content .step-text:hover {
  background: rgba(255, 255, 255, 0.05);
}

.tomorrow-steps-content .step-edit-input {
  flex: 1;
  border: 1px solid #7048E8;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 8px;
  font-size: 0.9rem;
  color: #FFFFFF;
  font-family: 'Plus Jakarta Sans', sans-serif;
  border-radius: 4px;
  outline: none;
  box-shadow: 0 0 10px rgba(112, 72, 232, 0.2);
}

.tomorrow-steps-content .delete-action {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.tomorrow-steps-content .delete-action:hover {
  color: #EF4444;
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}

.tomorrow-steps-content .add-step-wrapper {
  margin-top: 24px;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tomorrow-steps-content .step-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  font-size: 0.85rem;
  outline: none;
  color: #FFFFFF;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.tomorrow-steps-content .step-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.tomorrow-steps-content .add-step-btn {
  background: #7048E8 !important;
  color: white !important;
  border-radius: 10px !important;
  height: 36px !important;
  width: 36px !important;
  min-width: 36px !important;
  padding: 0 !important;
  box-shadow: 0 4px 10px rgba(112, 72, 232, 0.3) !important;
}

:deep(.v-card-text) {
  color: white !important;
}
</style>
