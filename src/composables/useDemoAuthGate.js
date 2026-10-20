import { ref } from 'vue'

const authGateOpen = ref(false)
const authGateRedirect = ref('/register?from=demo')

export function useDemoAuthGate() {
  function openAuthGate({ redirect = '/register?from=demo' } = {}) {
    authGateRedirect.value = redirect || '/register?from=demo'
    authGateOpen.value = true
  }

  function closeAuthGate() {
    authGateOpen.value = false
  }

  return {
    authGateOpen,
    authGateRedirect,
    openAuthGate,
    closeAuthGate
  }
}
