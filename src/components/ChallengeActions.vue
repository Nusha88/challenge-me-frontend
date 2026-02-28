<template>
  <div class="actions-tactical-section mb-6">
    <div class="d-flex align-center justify-space-between mb-4">
      <h3 class="section-title">
        <v-icon start size="18" color="#4FD1C5">mdi-target-variant</v-icon>
        {{ t('challenges.actions') }}
      </h3>
      <div class="tactical-counter">
        <span class="count-done">{{ actionsDoneCount }}</span>
        <span class="count-separator">/</span>
        <span class="count-total">{{ totalActionsCount }}</span>
      </div>
    </div>

    <div class="actions-container">
      <div
        v-for="(action, index) in localActions"
        :key="`action-${index}-${action.checked}`"
        class="tactical-action-item mb-4"
        :class="{ 'is-completed': action.checked, 'is-editing': editingActions[index] }"
      >
        <div class="status-sidebar"></div>

        <div class="action-main-content pa-3">
          <div class="d-flex align-center">
            <div class="action-check-wrapper mr-3">
              <v-checkbox-btn
                v-if="!readonly"
                :model-value="action.checked"
                @update:model-value="(val) => updateActionChecked(index, val)"
                :disabled="!action.text || action.text.trim() === ''"
                color="#4FD1C5"
                density="compact"
              ></v-checkbox-btn>
              <v-icon v-else-if="action.checked" color="#4FD1C5" size="20">mdi-check-decagram</v-icon>
              <v-icon v-else color="rgba(255,255,255,0.1)" size="20">mdi-circle-outline</v-icon>
            </div>

            <div class="flex-grow-1 editable-action-text">
              <div
                v-if="readonly || !editingActions[index]"
                class="text-display"
                :class="{ 'strikethrough': action.checked }"
                @click="!readonly && startEditingAction(index)"
              >
                {{ action.text || t('challenges.actionPlaceholder') }}
              </div>
              <v-text-field
                v-else
                v-model="action.text"
                variant="plain"
                density="compact"
                hide-details
                class="text-input-tactical"
                autofocus
                @blur="stopEditingAction(index)"
                @keyup.enter="stopEditingAction(index)"
              ></v-text-field>
            </div>

            <div v-if="!readonly" class="action-controls ml-2">
              <v-btn icon="mdi-plus-box-outline" variant="text" size="x-small" color="rgba(255,255,255,0.3)" @click="addChildAction(index)"></v-btn>
              <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="#FF5252" @click="removeAction(index)"></v-btn>
            </div>
          </div>

          <div v-if="action.children && action.children.length > 0" class="child-actions-wrapper mt-3 ml-10">
            <div
              v-for="(child, childIndex) in action.children"
              :key="`child-${index}-${childIndex}`"
              class="child-item d-flex align-center mb-2"
              :class="{ 'is-completed': child.checked }"
            >
              <v-checkbox-btn
                v-if="!readonly"
                :model-value="child.checked"
                @update:model-value="(val) => updateChildActionChecked(index, childIndex, val)"
                color="#4FD1C5"
                density="compact"
                class="mr-2"
              ></v-checkbox-btn>
              <div class="child-text flex-grow-1" @click="!readonly && startEditingChildAction(index, childIndex)">
                <span v-if="!editingChildActions[`${index}-${childIndex}`]" :class="{ 'strikethrough': child.checked }">
                  {{ child.text || '...' }}
                </span>
                <v-text-field v-else v-model="child.text" variant="plain" density="compact" hide-details class="text-input-tactical" @blur="stopEditingChildAction(index, childIndex)"></v-text-field>
              </div>
              <v-btn v-if="!readonly" icon="mdi-close" variant="text" size="x-small" @click="removeChildAction(index, childIndex)"></v-btn>
            </div>
          </div>
        </div>
      </div>
    </div>

    <v-btn
      v-if="!readonly && !hideAddButton"
      block
      variant="outlined"
      color="#4FD1C5"
      class="add-tactical-btn mt-4"
      prepend-icon="mdi-plus"
      @click="addAction"
    >
      {{ t('challenges.addAction') }}
    </v-btn>
  </div>
</template>

<style scoped>
/* Стили заголовка как на скриншоте 2 */
.section-title {
  color: #4FD1C5;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
}

/* Счетчик прогресса */
.tactical-counter {
  font-family: 'Montserrat', sans-serif;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
}
.count-done { color: #4FD1C5; }
.count-separator { opacity: 0.3; margin: 0 4px; }
.count-total { opacity: 0.6; }

/* Карточка задачи */
.tactical-action-item {
  background: rgba(30, 41, 59, 0.4) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.tactical-action-item:hover {
  background: rgba(30, 41, 59, 0.6) !important;
  border-color: rgba(79, 209, 197, 0.2);
}

/* Линия статуса слева */
.status-sidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.4s ease;
}

.is-completed .status-sidebar {
  background: #4FD1C5;
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
}

/* Тексты */
.text-display {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  min-height: 24px;
}

.strikethrough {
  text-decoration: line-through;
  opacity: 0.4;
  color: #4FD1C5;
}

/* Инпуты при редактировании */
.text-input-tactical :deep(input) {
  color: #4FD1C5 !important;
  font-weight: 600;
  padding: 0 !important;
}

/* Кнопка добавления */
.add-tactical-btn {
  border-radius: 12px !important;
  border: 1px dashed rgba(79, 209, 197, 0.4) !important;
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Подзадачи */
.child-item {
  font-size: 0.85rem;
  opacity: 0.8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  padding-bottom: 4px;
}
</style>

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

