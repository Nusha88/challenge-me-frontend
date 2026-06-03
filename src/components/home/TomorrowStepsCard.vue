<template>
  <v-card class="todays-card todays-checklist-card checklist-card checklist-card-tomorrow">
    <v-card-text>
      <div class="todays-checklist-section">
        <h3 class="section-subtitle">{{ t('home.loggedIn.tomorrowSteps.title') }}</h3>

        <div v-if="tomorrowSteps.length === 0" class="tomorrow-steps-empty">
          <img :src="tomorrowImage" class="tomorrow-empty-icon" alt="Tomorrow">
          <p class="tomorrow-empty-text">{{ t('home.loggedIn.tomorrowSteps.empty.text') }}</p>
          <v-btn
            v-if="!showTomorrowStepsInput"
            class="plan-step-btn"
            @click="$emit('plan-new-step')"
          >
            {{ t('home.loggedIn.tomorrowSteps.empty.button') }}
          </v-btn>
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
              <div
                class="delete-action"
                :title="t('home.loggedIn.dailyChecklist.deleteStep')"
                @click="$emit('remove-step', index)"
              >
                <Trash2 :size="16" />
              </div>
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
import tomorrowImage from '../../assets/tomorrow.png'

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
  width: 35%;
  flex: 0 0 35%;
  max-width: 35%;
  box-sizing: border-box;
  overflow: visible !important;
  min-width: 0;
}

@media (max-width: 959px) {
  .todays-checklist-card {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.checklist-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
  width: 100% !important;
}

.checklist-card-tomorrow {
  border: 2px dashed rgba(112, 72, 232, 0.2) !important;
}

.section-subtitle {
  color: #4FD1C5 !important;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(79, 209, 197, 0.4);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  margin-bottom: 16px;
  padding-left: 4px;
}

.tomorrow-steps-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px 10px;
  min-height: 200px;
}

.tomorrow-empty-icon {
  width: 140px;
  margin-bottom: 20px;
  filter: drop-shadow(0 10px 15px rgba(112, 72, 232, 0.1));
}

.tomorrow-empty-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  max-width: 300px;
  line-height: 1.5;
  margin: 16px 0;
}

.plan-step-btn {
  background: rgba(112, 72, 232, 0.1) !important;
  color: #4FD1C5 !important;
  border: 1px solid rgba(112, 72, 232, 0.3) !important;
  text-transform: none !important;
  font-weight: 700 !important;
  border-radius: 12px !important;
}

.plan-step-btn:hover {
  background: rgba(112, 72, 232, 0.2) !important;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
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
