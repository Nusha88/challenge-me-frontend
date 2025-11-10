<template>
  <v-dialog :model-value="modelValue" max-width="700" @update:modelValue="handleVisibility">
    <v-card v-if="challenge">
      <v-card-title>
        <div class="dialog-title">
          <span>{{ challenge.title }}</span>
          <v-chip
            v-if="isOwner"
            color="secondary"
            size="small"
          >
            {{ t('challenges.mineBadge') }}
          </v-chip>
          <v-chip
            v-else
            color="primary"
            variant="outlined"
            size="small"
          >
            {{ isParticipant ? t('challenges.joinedBadge') : t('challenges.discoverBadge') }}
          </v-chip>
        </div>
      </v-card-title>

      <v-card-text>
        <template v-if="isOwner">
          <v-form @submit.prevent="handleSubmit">
            <v-text-field
              v-model="editForm.title"
              :label="t('challenges.title')"
              variant="outlined"
              required
              class="mb-4"
              :error-messages="errors.title"
            ></v-text-field>

            <v-textarea
              v-model="editForm.description"
              :label="t('challenges.description')"
              variant="outlined"
              rows="5"
              required
              class="mb-4"
              :error-messages="errors.description"
            ></v-textarea>

            <div class="date-pickers mb-4">
              <v-menu
                v-model="startMenu"
                :close-on-content-click="false"
                max-width="290px"
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    :model-value="formatDisplayDate(editForm.startDate)"
                    :label="t('challenges.startDate')"
                    variant="outlined"
                    readonly
                    v-bind="props"
                    :error-messages="errors.startDate"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="startTemp"
                  @update:modelValue="handleSelectStart"
                ></v-date-picker>
              </v-menu>

              <v-menu
                v-model="endMenu"
                :close-on-content-click="false"
                max-width="290px"
                min-width="auto"
              >
                <template #activator="{ props }">
                  <v-text-field
                    :model-value="formatDisplayDate(editForm.endDate)"
                    :label="t('challenges.endDate')"
                    variant="outlined"
                    readonly
                    v-bind="props"
                    :error-messages="errors.endDate"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="endTemp"
                  @update:modelValue="handleSelectEnd"
                ></v-date-picker>
              </v-menu>
            </div>

            <div class="mb-4">
              <strong>{{ t('challenges.participants') }}:</strong>
              <v-chip-group column class="mt-2">
                <v-chip
                  v-for="participant in challenge.participants"
                  :key="participant._id || participant"
                  size="small"
                  class="mr-1"
                >
                  {{ participant.name || t('common.unknown') }}
                </v-chip>
              </v-chip-group>
            </div>

            <v-alert v-if="saveError" type="error" class="mb-4">
              {{ saveError }}
            </v-alert>

            <v-card-actions class="px-0">
              <v-btn variant="text" @click="handleCancel" :disabled="saveLoading">
                {{ t('challenges.cancel') }}
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn type="submit" color="primary" :loading="saveLoading" :disabled="saveLoading">
                {{ t('challenges.update') }}
              </v-btn>
            </v-card-actions>
          </v-form>
        </template>

        <template v-else>
          <p class="mb-2"><strong>{{ t('challenges.description') }}:</strong> {{ challenge.description }}</p>
          <p class="mb-2"><strong>{{ t('challenges.startDate') }} / {{ t('challenges.endDate') }}:</strong> {{ formatDateRange(challenge.startDate, challenge.endDate) }}</p>
          <p class="mb-2" v-if="challenge.owner">
            <strong>{{ t('challenges.createdBy', { name: challenge.owner.name || t('common.unknown') }) }}</strong>
          </p>

          <div>
            <strong>{{ t('challenges.participants') }}:</strong>
            <v-chip-group column class="mt-2">
              <v-chip
                v-for="participant in challenge.participants"
                :key="participant._id || participant"
                size="small"
                class="mr-1"
              >
                {{ participant.name || t('common.unknown') }}
              </v-chip>
            </v-chip-group>
          </div>

          <v-alert
            v-if="isParticipant"
            type="success"
            class="mt-4"
          >
            {{ t('challenges.joinSuccess') }}
          </v-alert>

          <v-alert
            v-else-if="showJoinButton"
            type="info"
            class="mt-4"
          >
            {{ t('challenges.joinInfo') }}
          </v-alert>
        </template>
      </v-card-text>

      <v-card-actions v-if="!isOwner">
        <v-btn variant="text" @click="handleClose">{{ t('common.close') }}</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="showJoinButton"
          color="primary"
          :loading="joinLoading"
          @click="emitJoin"
        >
          {{ t('challenges.join') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  challenge: {
    type: Object,
    default: null
  },
  isOwner: {
    type: Boolean,
    default: false
  },
  isParticipant: {
    type: Boolean,
    default: false
  },
  joinLoading: {
    type: Boolean,
    default: false
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  saveLoading: {
    type: Boolean,
    default: false
  },
  saveError: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'join'])

const editForm = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: ''
})

const errors = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: ''
})

const startMenu = ref(false)
const endMenu = ref(false)
const startTemp = ref('')
const endTemp = ref('')
const { t, locale } = useI18n()

watch(
  () => props.challenge,
  value => {
    if (!value) {
      resetForm()
      return
    }

    editForm.title = value.title || ''
    editForm.description = value.description || ''
    editForm.startDate = value.startDate ? value.startDate.slice(0, 10) : ''
    editForm.endDate = value.endDate ? value.endDate.slice(0, 10) : ''
    startTemp.value = editForm.startDate
    endTemp.value = editForm.endDate
    clearErrors()
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      resetForm()
    }
  }
)

function resetForm() {
  editForm.title = ''
  editForm.description = ''
  editForm.startDate = ''
  editForm.endDate = ''
  startTemp.value = ''
  endTemp.value = ''
  startMenu.value = false
  endMenu.value = false
  clearErrors()
}

function clearErrors() {
  errors.title = ''
  errors.description = ''
  errors.startDate = ''
  errors.endDate = ''
}

function handleVisibility(value) {
  emit('update:modelValue', value)
}

function handleCancel() {
  emit('update:modelValue', false)
}

function handleClose() {
  emit('update:modelValue', false)
}

function emitJoin() {
  emit('join')
}

function handleSubmit() {
  if (!validate()) return
  emit('save', { ...editForm })
}

function validate() {
  clearErrors()

  if (!editForm.title) {
    errors.title = t('validation.titleRequired')
  }

  if (!editForm.description) {
    errors.description = t('validation.descriptionRequired')
  }

  if (!editForm.startDate) {
    errors.startDate = t('validation.startDateRequired')
  }

  if (!editForm.endDate) {
    errors.endDate = t('validation.endDateRequired')
  }

  if (editForm.startDate && editForm.endDate) {
    if (new Date(editForm.startDate) > new Date(editForm.endDate)) {
      errors.endDate = t('validation.endAfterStart')
    }
  }

  return !errors.title && !errors.description && !errors.startDate && !errors.endDate
}

function handleSelectStart(value) {
  startTemp.value = value
  editForm.startDate = value
  startMenu.value = false
}

function handleSelectEnd(value) {
  endTemp.value = value
  editForm.endDate = value
  endMenu.value = false
}

function formatDisplayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    return formatter.format(date)
  } catch (err) {
    return date.toLocaleDateString()
  }
}

function formatDateRange(start, end) {
  const startFormatted = formatDisplayDate(start)
  const endFormatted = formatDisplayDate(end)
  if (startFormatted && endFormatted) {
    return t('challenges.dateRange', { start: startFormatted, end: endFormatted })
  }
  return startFormatted || endFormatted || ''
}
</script>

<style scoped>
.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-pickers {
  display: grid;
  gap: 16px;
}

@media (min-width: 600px) {
  .date-pickers {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
