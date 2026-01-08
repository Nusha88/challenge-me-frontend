<template>
  <v-card class="mb-4" variant="outlined">
    <v-card-title class="text-h6 actions-title">
      {{ t('challenges.actions') }}
    </v-card-title>
    <v-card-text>
      <div
        v-for="(action, index) in localActions"
        :key="`action-${index}-${action.checked}`"
        class="action-item mb-3"
      >
        <!-- Parent Action -->
        <div class="d-flex align-center mb-1">
          <v-checkbox
            v-if="!readonly"
            :model-value="action.checked"
            @update:model-value="(val) => updateActionChecked(index, val)"
            hide-details
            class="mr-2"
            :disabled="!action.text || action.text.trim() === ''"
            color="primary"
          ></v-checkbox>
          <div class="flex-grow-1 editable-action-text">
            <span
              v-if="readonly || !editingActions[index]"
              class="action-text"
              :class="{ 'text-strikethrough': action.checked, 'readonly-text': readonly }"
              @click="!readonly && startEditingAction(index)"
            >
              {{ action.text || t('challenges.actionPlaceholder') }}
            </span>
            <v-text-field
              v-else
              v-model="action.text"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-grow-1"
              :placeholder="t('challenges.actionPlaceholder')"
              autofocus
              @blur="stopEditingAction(index)"
              @keyup.enter="stopEditingAction(index)"
              @keyup.esc="stopEditingAction(index)"
            ></v-text-field>
          </div>
          <template v-if="!readonly">
            <v-btn
              icon="mdi-plus"
              variant="text"
              size="small"
              class="ml-2"
              :title="t('challenges.addChildAction')"
              @click="addChildAction(index)"
            ></v-btn>
            <v-btn
              v-if="localActions.length > 1"
              icon="mdi-delete"
              variant="text"
              size="small"
              class="ml-1"
              @click="removeAction(index)"
            ></v-btn>
          </template>
        </div>
        
        <!-- Child Actions -->
        <div v-if="action.children && action.children.length > 0" class="child-actions ml-8">
          <div
            v-for="(child, childIndex) in action.children"
            :key="`child-${index}-${childIndex}-${child.checked}`"
            class="d-flex align-center mb-1"
          >
            <v-checkbox
              v-if="!readonly"
              :model-value="child.checked"
              @update:model-value="(val) => updateChildActionChecked(index, childIndex, val)"
              hide-details
              class="mr-2"
              :disabled="!child.text || child.text.trim() === ''"
              color="primary"
            ></v-checkbox>
            <div class="flex-grow-1 editable-action-text">
              <span
                v-if="readonly || !editingChildActions[`${index}-${childIndex}`]"
                class="action-text"
                :class="{ 'text-strikethrough': child.checked, 'readonly-text': readonly }"
                @click="!readonly && startEditingChildAction(index, childIndex)"
              >
                {{ child.text || t('challenges.childActionPlaceholder') }}
              </span>
              <v-text-field
                v-else
                v-model="child.text"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1"
                :placeholder="t('challenges.childActionPlaceholder')"
                autofocus
                @blur="stopEditingChildAction(index, childIndex)"
                @keyup.enter="stopEditingChildAction(index, childIndex)"
                @keyup.esc="stopEditingChildAction(index, childIndex)"
              ></v-text-field>
            </div>
            <v-btn
              v-if="!readonly"
              icon="mdi-delete"
              variant="text"
              size="small"
              class="ml-2"
              @click="removeChildAction(index, childIndex)"
            ></v-btn>
          </div>
        </div>
      </div>
      <div class="d-flex align-center justify-space-between">
        <v-btn
          v-if="!readonly && !hideAddButton"
          prepend-icon="mdi-plus"
          variant="outlined"
          color="primary"
          class="add-action-btn"
          @click="addAction"
        >
          {{ t('challenges.addAction') }}
        </v-btn>
        <span class="text-body-2 text-medium-emphasis actions-counter">
          {{ actionsDoneCount }}/{{ totalActionsCount }}
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
  },
  readonly: {
    type: Boolean,
    default: false
  },
  hideAddButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const editingActions = ref({})
const editingChildActions = ref({})

const localActions = ref(
  props.modelValue && props.modelValue.length > 0 
    ? props.modelValue.map(a => ({ 
        text: a.text || '', 
        checked: Boolean(a.checked),
        children: (a.children && Array.isArray(a.children)) 
          ? a.children.map(c => ({ text: c.text || '', checked: Boolean(c.checked) }))
          : []
      }))
    : [{ text: '', checked: false, children: [] }]
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
      const normalized = newValue.map(a => ({ 
        text: a.text || '', 
        checked: Boolean(a.checked),
        children: (a.children && Array.isArray(a.children))
          ? a.children.map(c => ({ text: c.text || '', checked: Boolean(c.checked) }))
          : []
      }))
      localActions.value = normalized
    } else if (!newValue || newValue.length === 0) {
      if (localActions.value.length === 0) {
        localActions.value = [{ text: '', checked: false, children: [] }]
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
        emit('update:modelValue', localActions.value.map(a => ({ 
          text: a.text || '', 
          checked: Boolean(a.checked),
          children: (a.children && Array.isArray(a.children))
            ? a.children.map(c => ({ text: c.text || '', checked: Boolean(c.checked) }))
            : []
        })))
      })
    }
  },
  { deep: true }
)

const totalActionsCount = computed(() => {
  return localActions.value.length
})

const actionsDoneCount = computed(() => {
  return localActions.value.filter(action => action.checked).length
})

function addAction() {
  localActions.value.push({ text: '', checked: false, children: [] })
}

function removeAction(index) {
  if (localActions.value.length > 1) {
    localActions.value.splice(index, 1)
  }
}

function addChildAction(parentIndex) {
  if (!localActions.value[parentIndex].children) {
    localActions.value[parentIndex].children = []
  }
  localActions.value[parentIndex].children.push({ text: '', checked: false })
}

function removeChildAction(parentIndex, childIndex) {
  if (localActions.value[parentIndex].children) {
    localActions.value[parentIndex].children.splice(childIndex, 1)
  }
}

function updateActionChecked(index, value) {
  if (localActions.value[index]) {
    const updated = [...localActions.value]
    updated[index] = { ...updated[index], checked: value }
    
    // If parent is checked and has children, check all children
    if (value && updated[index].children && updated[index].children.length > 0) {
      updated[index].children = updated[index].children.map(child => ({ ...child, checked: true }))
    }
    // If parent is unchecked and has children, uncheck all children
    else if (!value && updated[index].children && updated[index].children.length > 0) {
      updated[index].children = updated[index].children.map(child => ({ ...child, checked: false }))
    }
    
    localActions.value = updated
  }
}

function updateChildActionChecked(parentIndex, childIndex, value) {
  if (localActions.value[parentIndex] && localActions.value[parentIndex].children) {
    const updated = [...localActions.value]
    const updatedChildren = [...updated[parentIndex].children]
    updatedChildren[childIndex] = { ...updatedChildren[childIndex], checked: value }
    updated[parentIndex] = { ...updated[parentIndex], children: updatedChildren }
    
    // If all child actions are checked, automatically check the parent
    const allChildrenChecked = updatedChildren.length > 0 && updatedChildren.every(child => child.checked)
    if (allChildrenChecked && updatedChildren.length > 0) {
      updated[parentIndex] = { ...updated[parentIndex], checked: true }
    } else if (!allChildrenChecked) {
      // If any child is unchecked, uncheck the parent
      updated[parentIndex] = { ...updated[parentIndex], checked: false }
    }
    
    localActions.value = updated
  }
}

function startEditingAction(index) {
  editingActions.value[index] = true
}

function stopEditingAction(index) {
  editingActions.value[index] = false
}

function startEditingChildAction(parentIndex, childIndex) {
  editingChildActions.value[`${parentIndex}-${childIndex}`] = true
}

function stopEditingChildAction(parentIndex, childIndex) {
  editingChildActions.value[`${parentIndex}-${childIndex}`] = false
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

.action-item {
  border-left: 2px dashed #1FA0F6;
  padding-left: 8px;
}

.child-actions {
  border-left: 2px dashed #1FA0F6;
  padding-left: 8px;
  margin-top: 4px;
}

.add-action-btn {
  border-radius: 8px !important;
}

.actions-title {
  font-weight: 700 !important;
}

.editable-action-text {
  min-height: 40px;
  display: flex;
  align-items: center;
}

.action-text {
  font-size: 1rem;
  line-height: 1.3;
  padding: 10px 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: rgba(0, 0, 0, 0.87);
  flex: 1;
  min-height: 28px;
  display: flex;
  align-items: center;
}

.action-text:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.action-text.text-strikethrough {
  text-decoration: line-through;
  opacity: 0.7;
}

.action-text:empty::before {
  content: attr(data-placeholder);
  color: rgba(0, 0, 0, 0.38);
}

.readonly-text {
  cursor: default;
}

.readonly-text:hover {
  background-color: transparent;
}
</style>
