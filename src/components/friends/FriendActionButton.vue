<template>
  <div v-if="status !== 'self'" :class="['friend-action', { compact }]">
    <v-btn
      v-if="compact"
      icon
      variant="text"
      size="small"
      class="friend-icon-btn"
      :class="`is-${status}`"
      :loading="busy"
      :disabled="status === 'accepted'"
      :aria-label="label"
      :title="label"
      @click.stop="handleCompactClick"
    >
      <v-icon size="18">{{ compactIcon }}</v-icon>
    </v-btn>

    <template v-else>
      <v-btn
        v-if="status === 'none'"
        class="squad-cta squad-cta--add text-none"
        :loading="busy"
        @click.stop="$emit('add')"
      >
        <v-icon start size="18">mdi-account-plus</v-icon>
        {{ t('users.squad.add') }}
      </v-btn>

      <v-btn
        v-else-if="status === 'pending_outgoing'"
        class="squad-cta squad-cta--sent text-none"
        variant="outlined"
        :loading="busy"
        @click.stop="$emit('cancel')"
      >
        <v-icon start size="18">mdi-account-clock-outline</v-icon>
        {{ t('users.squad.sent') }}
      </v-btn>

      <div v-else-if="status === 'pending_incoming'" class="squad-cta-row">
        <v-btn
          class="squad-cta squad-cta--add text-none"
          :loading="busy"
          @click.stop="$emit('accept')"
        >
          {{ t('users.squad.accept') }}
        </v-btn>
        <v-btn
          class="squad-cta squad-cta--ghost text-none"
          variant="text"
          :disabled="busy"
          @click.stop="$emit('reject')"
        >
          {{ t('users.squad.reject') }}
        </v-btn>
      </div>

      <div v-else-if="status === 'accepted'" class="in-squad-chip">
        <v-icon size="16">mdi-account-heart</v-icon>
        {{ t('users.squad.inSquad') }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  status: { type: String, default: 'none' },
  busy: { type: Boolean, default: false },
  compact: { type: Boolean, default: false }
})

const emit = defineEmits(['add', 'cancel', 'accept', 'reject'])

const { t } = useI18n()

const compactIcon = computed(() => {
  if (props.status === 'accepted') return 'mdi-account-heart'
  if (props.status === 'pending_outgoing') return 'mdi-account-clock-outline'
  if (props.status === 'pending_incoming') return 'mdi-account-check'
  return 'mdi-account-plus'
})

const label = computed(() => {
  if (props.status === 'accepted') return t('users.squad.inSquad')
  if (props.status === 'pending_outgoing') return t('users.squad.cancel')
  if (props.status === 'pending_incoming') return t('users.squad.accept')
  return t('users.squad.add')
})

function handleCompactClick() {
  if (props.status === 'accepted') return
  if (props.status === 'pending_outgoing') {
    emit('cancel')
    return
  }
  if (props.status === 'pending_incoming') {
    emit('accept')
    return
  }
  emit('add')
}
</script>

<style scoped>
.friend-action.compact {
  flex-shrink: 0;
}

.friend-icon-btn {
  color: var(--home-teal, #4fd1c5) !important;
}

.friend-icon-btn.is-pending_outgoing {
  color: var(--home-text-dim, #94a3b8) !important;
}

.friend-icon-btn.is-accepted {
  color: #f472b6 !important;
  pointer-events: none;
}

.squad-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.squad-cta-row .squad-cta {
  margin-top: 0;
}

.squad-cta {
  margin-top: 16px;
  min-height: 40px;
  border-radius: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em;
}

.squad-cta--add {
  color: #0b0d12 !important;
  background: linear-gradient(135deg, var(--home-teal, #4fd1c5), var(--home-purple, #7048e8)) !important;
}

.squad-cta--sent {
  margin-top: 16px;
  color: var(--home-text-dim, #94a3b8) !important;
  border-color: var(--home-border-hi, rgba(79, 209, 197, 0.38)) !important;
}

.squad-cta--ghost {
  margin-top: 16px;
  color: var(--home-text-dim, #94a3b8) !important;
}

.in-squad-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #f472b6;
  background: rgba(244, 114, 182, 0.12);
  border: 1px solid rgba(244, 114, 182, 0.28);
}
</style>
