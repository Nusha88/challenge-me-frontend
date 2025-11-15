<template>
  <v-card class="mb-4" variant="outlined">
    <v-card-title class="text-h6">
      {{ t('challenges.actions') }}
    </v-card-title>
    <v-card-text>
      <div
        v-for="(action, index) in localActions"
        :key="`action-${index}-${action.checked}`"
        class="d-flex align-center mb-2"
      >
        <v-checkbox
          :model-value="action.checked"
          @update:model-value="(val) => updateActionChecked(index, val)"
          hide-details
          class="mr-2"
          :disabled="!action.text || action.text.trim() === ''"
        ></v-checkbox>
        <v-text-field
          v-model="action.text"
          variant="outlined"
          density="compact"
          hide-details
          class="flex-grow-1"
          :class="{ 'text-strikethrough': action.checked }"
          :placeholder="t('challenges.actionPlaceholder')"
          :disabled="action.checked"
        ></v-text-field>
        <v-btn
          v-if="localActions.length > 1"
          icon="mdi-delete"
          variant="text"
          size="small"
          class="ml-2"
          @click="removeAction(index)"
        ></v-btn>
      </div>
      <div class="d-flex align-center justify-space-between">
        <v-btn
          prepend-icon="mdi-plus"
          variant="outlined"
          color="primary"
          @click="addAction"
        >
          {{ t('challenges.addAction') }}
        </v-btn>
        <span class="text-body-2 text-medium-emphasis actions-counter">
          {{ actionsDoneCount }}/{{ localActions.length }}
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const localActions = ref(
  props.modelValue && props.modelValue.length > 0 
    ? props.modelValue.map(a => ({ text: a.text || '', checked: Boolean(a.checked) }))
    : [{ text: '', checked: false }]
)

let isInternalUpdate = false

watch(
  () => props.modelValue,
  (newValue) => {
    if (isInternalUpdate) {
      isInternalUpdate = false
      return
    }
    
    if (newValue && Array.isArray(newValue) && newValue.length > 0) {
      const normalized = newValue.map(a => ({ text: a.text || '', checked: Boolean(a.checked) }))
      localActions.value = normalized
    } else if (!newValue || newValue.length === 0) {
      if (localActions.value.length === 0) {
        localActions.value = [{ text: '', checked: false }]
      }
    }
  },
  { deep: true }
)

watch(
  () => localActions.value,
  () => {
    if (!isInternalUpdate) {
      isInternalUpdate = true
      nextTick(() => {
        emit('update:modelValue', localActions.value.map(a => ({ text: a.text || '', checked: Boolean(a.checked) })))
      })
    }
  },
  { deep: true }
)

const actionsDoneCount = computed(() => {
  return localActions.value?.filter(action => action.checked).length || 0
})

function addAction() {
  localActions.value.push({ text: '', checked: false })
}

function removeAction(index) {
  if (localActions.value.length > 1) {
    localActions.value.splice(index, 1)
  }
}

function updateActionChecked(index, value) {
  if (localActions.value[index]) {
    // Create a new array to ensure reactivity
    const updated = [...localActions.value]
    updated[index] = { ...updated[index], checked: value }
    localActions.value = updated
  }
}
</script>

<style scoped>
.text-strikethrough :deep(.v-field__input) {
  text-decoration: line-through;
  opacity: 0.7;
}

.actions-counter {
  font-weight: 500;
  margin-left: auto;
}
</style>

