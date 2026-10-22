<template>
  <v-card class="squad-request-card" variant="flat">
    <div class="squad-request-row">
      <RankedAvatar
        :avatar-url="user.avatarUrl"
        :seed="user._id || user.id"
        :initials="user.initials"
        :level="user.displayLevel"
        :size="48"
        :alt="user.name || ''"
      />
      <div class="squad-request-copy">
        <button type="button" class="squad-request-name" @click="$emit('open', user)">
          {{ user.name }}
        </button>
        <p class="squad-request-lead">{{ t('users.squad.incomingLead') }}</p>
      </div>
    </div>
    <div class="squad-request-actions">
      <v-btn
        class="squad-request-accept text-none"
        size="small"
        :loading="busy"
        @click="$emit('accept')"
      >
        {{ t('users.squad.accept') }}
      </v-btn>
      <v-btn
        class="squad-request-reject text-none"
        size="small"
        variant="text"
        :disabled="busy"
        @click="$emit('reject')"
      >
        {{ t('users.squad.reject') }}
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import RankedAvatar from '../user/RankedAvatar.vue'

defineProps({
  user: { type: Object, required: true },
  busy: { type: Boolean, default: false }
})

defineEmits(['open', 'accept', 'reject'])

const { t } = useI18n()
</script>

<style scoped>
.squad-request-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.55)) !important;
  border: 1px solid var(--home-border-hi, rgba(79, 209, 197, 0.28)) !important;
  border-radius: var(--home-radius, 16px) !important;
  padding: 14px;
}

.squad-request-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.squad-request-copy {
  min-width: 0;
  flex: 1;
}

.squad-request-name {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--home-text, #f1f5f9);
  font: inherit;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
}

.squad-request-name:hover {
  color: var(--home-teal, #4fd1c5);
}

.squad-request-lead {
  margin: 4px 0 0;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.78rem;
}

.squad-request-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.squad-request-accept {
  color: #0b0d12 !important;
  background: linear-gradient(135deg, var(--home-teal, #4fd1c5), var(--home-purple, #7048e8)) !important;
  border-radius: 10px !important;
  font-weight: 800 !important;
}

.squad-request-reject {
  color: var(--home-text-dim, #94a3b8) !important;
  font-weight: 700 !important;
}
</style>
