/**
 * `v-spotlight` — tracks the pointer across an element and exposes its position
 * as the --lp-mx / --lp-my custom properties, which .lp-card--spotlight renders
 * as a soft radial highlight.
 *
 * Writes are coalesced into a single animation frame so a fast pointer cannot
 * queue up style recalculations. Devices without a fine pointer are skipped
 * entirely: they never emit pointermove, and the CSS already falls back to a
 * centred glow.
 */

const STATE = new WeakMap()

function hasFinePointer() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

export const vSpotlight = {
  mounted(el) {
    if (!hasFinePointer()) return

    const state = { frame: null, x: 0, y: 0 }

    const apply = () => {
      state.frame = null
      el.style.setProperty('--lp-mx', `${state.x}px`)
      el.style.setProperty('--lp-my', `${state.y}px`)
    }

    const onMove = (event) => {
      const rect = el.getBoundingClientRect()
      state.x = event.clientX - rect.left
      state.y = event.clientY - rect.top

      if (state.frame === null) {
        state.frame = requestAnimationFrame(apply)
      }
    }

    const onLeave = () => {
      if (state.frame !== null) {
        cancelAnimationFrame(state.frame)
        state.frame = null
      }
      el.style.removeProperty('--lp-mx')
      el.style.removeProperty('--lp-my')
    }

    state.onMove = onMove
    state.onLeave = onLeave
    STATE.set(el, state)

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave, { passive: true })
  },

  unmounted(el) {
    const state = STATE.get(el)
    if (!state) return

    if (state.frame !== null) cancelAnimationFrame(state.frame)
    el.removeEventListener('pointermove', state.onMove)
    el.removeEventListener('pointerleave', state.onLeave)
    STATE.delete(el)
  }
}
