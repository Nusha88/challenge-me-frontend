<template>
  <div class="add-challenge">
    <h1 class="mb-6">{{ t('challenges.addTitle') }}</h1>
    <v-card>
      <v-card-text>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.title"
            :label="t('challenges.title')"
            variant="outlined"
            required
            class="mb-4"
            :error-messages="errors.title"
          ></v-text-field>

          <v-textarea
            v-model="form.description"
            :label="t('challenges.description')"
            variant="outlined"
            rows="5"
            required
            class="mb-4"
            :error-messages="errors.description"
          ></v-textarea>

          <div class="date-pickers mb-6">
            <v-menu
              v-model="startMenu"
              :close-on-content-click="false"
              max-width="290px"
              min-width="auto"
            >
              <template #activator="{ props }">
                <v-text-field
                  :model-value="formatDisplayDate(form.startDate)"
                  :label="t('challenges.startDate')"
                  variant="outlined"
                  readonly
                  v-bind="props"
                  :error-messages="errors.startDate"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="startTemp"
                @update:modelValue="val => onSelectStartDate(val)"
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
                  :model-value="formatDisplayDate(form.endDate)"
                  :label="t('challenges.endDate')"
                  variant="outlined"
                  readonly
                  v-bind="props"
                  :error-messages="errors.endDate"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="endTemp"
                @update:modelValue="val => onSelectEndDate(val)"
              ></v-date-picker>
            </v-menu>
          </div>

          <v-alert
            v-if="errorMessage"
            type="error"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            color="primary"
            size="large"
            :loading="loading"
            :disabled="loading"
          >
            {{ t('challenges.create') }}
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t, locale } = useI18n()

const form = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: ''
})

const startMenu = ref(false)
const endMenu = ref(false)
const startTemp = ref('')
const endTemp = ref('')
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})

function getCurrentUserId() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null

  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || null
  } catch (error) {
    return null
  }
}

function validate() {
  const validationErrors = {}

  if (!form.value.title) {
    validationErrors.title = t('validation.titleRequired')
  }

  if (!form.value.description) {
    validationErrors.description = t('validation.descriptionRequired')
  }

  if (!form.value.startDate) {
    validationErrors.startDate = t('validation.startDateRequired')
  }

  if (!form.value.endDate) {
    validationErrors.endDate = t('validation.endDateRequired')
  }

  if (form.value.startDate && form.value.endDate) {
    if (new Date(form.value.startDate) > new Date(form.value.endDate)) {
      validationErrors.endDate = t('validation.endAfterStart')
    }
  }

  errors.value = validationErrors
  return Object.keys(validationErrors).length === 0
}

function formatDisplayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
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

function onSelectStartDate(val) {
  startTemp.value = val
  form.value.startDate = val
  startMenu.value = false
}

function onSelectEndDate(val) {
  endTemp.value = val
  form.value.endDate = val
  endMenu.value = false
}

async function handleSubmit() {
  if (!validate()) return

  const userId = getCurrentUserId()
  if (!userId) {
    errorMessage.value = t('challenges.mustBeLoggedIn')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await challengeService.createChallenge({ ...form.value, owner: userId })
    router.push('/challenges/my')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.createError')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.add-challenge {
  max-width: 640px;
  margin: 0 auto;
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
