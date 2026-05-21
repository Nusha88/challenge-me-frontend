import { APP_EVENTS } from '../constants/appEvents'

export { APP_EVENTS }

export function dispatchAppEvent(eventName) {
  window.dispatchEvent(new Event(eventName))
}

export function addAppEventListener(eventName, handler) {
  window.addEventListener(eventName, handler)
}

export function removeAppEventListener(eventName, handler) {
  window.removeEventListener(eventName, handler)
}
