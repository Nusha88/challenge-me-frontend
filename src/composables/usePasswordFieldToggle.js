import { nextTick } from 'vue'

export async function togglePasswordVisibility(showRef, fieldRef) {
  const input = fieldRef.value?.$el?.querySelector('input')
  const selectionStart = input?.selectionStart ?? null
  const selectionEnd = input?.selectionEnd ?? null

  showRef.value = !showRef.value

  if (!input || selectionStart === null || selectionEnd === null) return

  await nextTick()
  input.focus({ preventScroll: true })
  try {
    input.setSelectionRange(selectionStart, selectionEnd)
  } catch {
    // Some browsers reject selection while the field is updating.
  }
}
