import { ref, nextTick } from 'vue'
import { userService } from '../services/api'

export function useTomorrowChecklist({ getTodaySteps, onSwitchToTomorrowTab } = {}) {
  const tomorrowSteps = ref([])
  const showTomorrowStepsInput = ref(false)
  const tomorrowStepText = ref('')
  const editingTomorrowStepIndex = ref(-1)
  const editingTomorrowStepText = ref('')

  async function loadTomorrowSteps() {
    try {
      const response = await userService.getTomorrowChecklist()
      if (response.data?.checklist?.tasks) {
        tomorrowSteps.value = response.data.checklist.tasks.map((task) => ({
          title: task.title,
          done: false
        }))
        if (tomorrowSteps.value.length > 0) {
          showTomorrowStepsInput.value = true
        }
      } else {
        tomorrowSteps.value = []
      }
    } catch (err) {
      console.error('Error loading tomorrow\'s checklist:', err)
      tomorrowSteps.value = []
    }
  }

  async function saveTomorrowSteps() {
    try {
      const tasks = tomorrowSteps.value.map((step) => ({
        title: step.title,
        done: false
      }))
      await userService.updateTomorrowChecklist(tasks)
    } catch (err) {
      console.error('Error saving tomorrow\'s checklist:', err)
    }
  }

  function planNewStep() {
    showTomorrowStepsInput.value = true
  }

  async function addTomorrowStep() {
    if (!tomorrowStepText.value.trim()) return

    tomorrowSteps.value.push({
      title: tomorrowStepText.value.trim(),
      done: false
    })

    tomorrowStepText.value = ''
    await saveTomorrowSteps()
  }

  async function removeTomorrowStep(index) {
    tomorrowSteps.value.splice(index, 1)
    await saveTomorrowSteps()
  }

  function startEditingTomorrowStep(index, currentText) {
    editingTomorrowStepIndex.value = index
    editingTomorrowStepText.value = currentText
    nextTick(() => {
      const input = document.querySelector('.tomorrow-steps-content .step-edit-input')
      if (input) {
        input.focus()
        input.select()
      }
    })
  }

  function cancelTomorrowStepEdit() {
    editingTomorrowStepIndex.value = -1
    editingTomorrowStepText.value = ''
  }

  async function saveTomorrowStepEdit(index) {
    if (editingTomorrowStepIndex.value === index && editingTomorrowStepText.value.trim()) {
      tomorrowSteps.value[index].title = editingTomorrowStepText.value.trim()
      editingTomorrowStepIndex.value = -1
      editingTomorrowStepText.value = ''
      await saveTomorrowSteps()
    } else {
      cancelTomorrowStepEdit()
    }
  }

  async function copyUnfinishedStepsToTomorrow() {
    const todaySteps = getTodaySteps?.()
    if (!todaySteps) return

    const unfinishedSteps = todaySteps.filter((step) => !step.done)
    if (unfinishedSteps.length === 0) return

    if (tomorrowSteps.value.length === 0) {
      await loadTomorrowSteps()
    }

    for (const step of unfinishedSteps) {
      const exists = tomorrowSteps.value.some((tomorrowStep) => tomorrowStep.title === step.title)
      if (!exists) {
        tomorrowSteps.value.push({
          title: step.title,
          done: false
        })
      }
    }

    await saveTomorrowSteps()

    if (onSwitchToTomorrowTab) {
      onSwitchToTomorrowTab()
    }
  }

  return {
    tomorrowSteps,
    showTomorrowStepsInput,
    tomorrowStepText,
    editingTomorrowStepIndex,
    editingTomorrowStepText,
    loadTomorrowSteps,
    saveTomorrowSteps,
    planNewStep,
    addTomorrowStep,
    removeTomorrowStep,
    startEditingTomorrowStep,
    saveTomorrowStepEdit,
    cancelTomorrowStepEdit,
    copyUnfinishedStepsToTomorrow
  }
}
