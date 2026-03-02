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
        :key="`action-${index}`"
        class="tactical-action-group mb-4"
      >
        <div 
          class="tactical-action-item"
          :class="{ 'is-completed': action.checked, 'is-editing': editingActions[index] }"
        >
          <div class="status-sidebar"></div>
          <div class="action-main-content pa-3">
            <div class="d-flex align-center">
              <div class="action-check-wrapper mr-3">
                <template v-if="!simplifiedView">
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
                </template>
              </div>

              <div class="flex-grow-1 editable-action-text">
                <div
                  v-if="readonly || !editingActions[index]"
                  class="text-display"
                  :class="{ 'strikethrough': action.checked, 'non-clickable-text': readonly || simplifiedView }"
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
                  @keydown.enter.prevent
  @keydown.enter.stop
                ></v-text-field>
              </div>

              <div v-if="!readonly && !simplifiedView" class="action-controls ml-2">
                <v-btn icon="mdi-plus-box-outline" variant="text" size="x-small" color="rgba(79, 209, 197, 0.6)" @click="addChildAction(index)"></v-btn>
                <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="#FF5252" @click="removeAction(index)"></v-btn>
              </div>
            </div>
          </div>
        </div>

        <transition-group name="list" tag="div" v-if="action.children && action.children.length > 0" class="child-actions-wrapper">
          <div
            v-for="(child, childIndex) in action.children"
            :key="`child-${index}-${childIndex}`"
            class="child-item d-flex align-center"
            :class="{ 'is-completed': child.checked }"
          >
            <div class="child-check-wrapper mr-2">
              <v-checkbox-btn
                v-if="!readonly"
                :model-value="child.checked"
                @update:model-value="(val) => updateChildActionChecked(index, childIndex, val)"
                color="#4FD1C5"
                density="compact"
              ></v-checkbox-btn>
              <v-icon v-else :color="child.checked ? '#4FD1C5' : 'rgba(255,255,255,0.1)'" size="16">
                {{ child.checked ? 'mdi-check' : 'mdi-circle-small' }}
              </v-icon>
            </div>
            
            <div class="child-text flex-grow-1" @click="!readonly && startEditingChildAction(index, childIndex)">
              <span v-if="!editingChildActions[`${index}-${childIndex}`]" :class="{ 'strikethrough': child.checked }">
                {{ child.text || '...' }}
              </span>
              <v-text-field 
                v-else 
                v-model="child.text" 
                variant="plain" 
                density="compact" 
                hide-details 
                class="text-input-child" 
                autofocus
                @blur="stopEditingChildAction(index, childIndex)"
                @keydown.enter.prevent
  @keydown.enter.stop
              ></v-text-field>
            </div>
            
            <v-btn v-if="!readonly" icon="mdi-close" variant="text" size="x-small" color="rgba(255,255,255,0.2)" @click="removeChildAction(index, childIndex)"></v-btn>
          </div>
        </transition-group>
      </div>
    </div>

    <v-btn
      v-if="!readonly && !hideAddButton && !simplifiedView"
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
/* Заголовок и счетчик */
.section-title {
  color: #4FD1C5;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
}

.tactical-counter {
  font-family: 'Montserrat', sans-serif;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 700;
}

/* Основная карточка */
.tactical-action-item {
  background: rgba(30, 41, 59, 0.4) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
  z-index: 2;
}

.tactical-action-item:hover {
  background: rgba(30, 41, 59, 0.6) !important;
  border-color: rgba(79, 209, 197, 0.3);
}

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

/* Иерархия подзадач (Дерево) */
.child-actions-wrapper {
  position: relative;
  margin-left: 22px; /* Выравнивание по линии чекбокса родителя */
  padding-left: 20px;
  border-left: 1px dashed rgba(79, 209, 197, 0.2);
  margin-top: -8px; /* Небольшой нахлест для визуальной связи */
  padding-top: 15px;
  z-index: 1;
}

.child-item {
  position: relative;
  padding: 4px 0;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

/* Горизонтальная линия связи */
.child-item::before {
  content: "";
  position: absolute;
  left: -20px;
  top: 50%;
  width: 15px;
  height: 1px;
  background: rgba(79, 209, 197, 0.2);
}

.child-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.child-item.is-completed .child-text {
  color: rgba(79, 209, 197, 0.5);
}

/* Текстовые стили */
.text-display {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.strikethrough {
  text-decoration: line-through;
  opacity: 0.4;
  color: #4FD1C5 !important;
}

/* Инпуты */
.text-input-tactical :deep(input),
.text-input-child :deep(input) {
  color: #4FD1C5 !important;
  font-weight: 600;
  padding: 0 !important;
}

.text-input-child :deep(input) {
  font-size: 0.85rem;
}

/* Кнопка добавления */
.add-tactical-btn {
  border-radius: 12px !important;
  border: 1px dashed rgba(79, 209, 197, 0.4) !important;
  text-transform: none;
  font-weight: 700;
}

/* Анимации */
.list-enter-active, .list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
/* Делаем иконку внутри чекбокса яркой */
:deep(.v-selection-control__selection) {
  color: #4FD1C5 !important;
}

/* Исправляем цвет рамки неактивного чекбокса, чтобы он не сливался с фоном */
:deep(.v-selection-control__input i) {
  color: rgba(79, 209, 197, 0.4) !important;
}

/* Если чекбокс выбран — делаем его светящимся */
:deep(.v-selection-control--dirty i) {
  color: #4FD1C5 !important;
  text-shadow: 0 0 8px rgba(79, 209, 197, 0.5);
}

/* Убираем черную подложку (overlay), которая может давать эффект черноты */
:deep(.v-selection-control__ripple) {
  display: none !important;
}
</style>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
  hideAddButton: { type: Boolean, default: false },
  simplifiedView: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const editingActions = ref({})
const editingChildActions = ref({})

// Инициализация локального состояния
const localActions = ref(
  props.modelValue?.length > 0 
    ? props.modelValue.map(a => ({ 
        text: a.text || '', 
        checked: !!a.checked,
        children: Array.isArray(a.children) ? a.children.map(c => ({ text: c.text || '', checked: !!c.checked })) : []
      }))
    : [{ text: '', checked: false, children: [] }]
)

let isInternalUpdate = false

// Синхронизация с родителем
watch(() => props.modelValue, (val) => {
  if (isInternalUpdate) return (isInternalUpdate = false)
  localActions.value = val?.length > 0 ? JSON.parse(JSON.stringify(val)) : [{ text: '', checked: false, children: [] }]
}, { deep: true })

watch(localActions, (val) => {
  isInternalUpdate = true
  emit('update:modelValue', JSON.parse(JSON.stringify(val)))
}, { deep: true })

const totalActionsCount = computed(() => localActions.value.length)
const actionsDoneCount = computed(() => localActions.value.filter(a => a.checked).length)

// Методы управления
function addAction() {
  localActions.value.push({ text: '', checked: false, children: [] })
}

function removeAction(index) {
  if (localActions.value.length > 1) localActions.value.splice(index, 1)
}

function addChildAction(parentIndex) {
  if (!localActions.value[parentIndex].children) localActions.value[parentIndex].children = []
  localActions.value[parentIndex].children.push({ text: '', checked: false })
  editingChildActions.value[`${parentIndex}-${localActions.value[parentIndex].children.length - 1}`] = true
}

function removeChildAction(pIdx, cIdx) {
  localActions.value[pIdx].children.splice(cIdx, 1)
}

function updateActionChecked(index, value) {
  localActions.value[index].checked = value
  if (localActions.value[index].children?.length > 0) {
    localActions.value[index].children.forEach(c => c.checked = value)
  }
}

function updateChildActionChecked(pIdx, cIdx, value) {
  localActions.value[pIdx].children[cIdx].checked = value
  const allChecked = localActions.value[pIdx].children.every(c => c.checked)
  localActions.value[pIdx].checked = allChecked
}

const startEditingAction = (i) => editingActions.value[i] = true
const stopEditingAction = (i) => editingActions.value[i] = false
const startEditingChildAction = (p, c) => editingChildActions.value[`${p}-${c}`] = true
const stopEditingChildAction = (p, c) => editingChildActions.value[`${p}-${c}`] = false
</script>