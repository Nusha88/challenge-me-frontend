<template>
  <div class="squad-invite-picker">
    <div class="picker-head">
      <p class="picker-title">{{ t('challenges.squad.invite') }}</p>
      <p class="picker-hint">{{ t('challenges.squad.inviteHint') }}</p>
      <p class="picker-limit">{{ t('challenges.squad.limit', { count: maxCount }) }}</p>
    </div>

    <div v-if="isSocialGated" class="picker-empty">
      <p>{{ t('challenges.squad.demoGate') }}</p>
      <v-btn
        class="text-none picker-cta"
        size="small"
        @click="requireAuthOrPrompt()"
      >
        {{ t('challenges.squad.demoGate') }}
      </v-btn>
    </div>

    <div v-else-if="loadingSquad" class="picker-loading">
      <v-progress-circular indeterminate color="#4FD1C5" size="28" />
    </div>

    <div v-else-if="squadError" class="picker-empty">
      <p>{{ squadError }}</p>
    </div>

    <div v-else-if="availableFriends.length === 0" class="picker-empty">
      <p>{{ t('challenges.squad.empty') }}</p>
      <router-link class="picker-link" to="/heroes">{{ t('challenges.squad.findFriends') }}</router-link>
    </div>

    <div v-else class="picker-list">
      <label
        v-for="friend in availableFriends"
        :key="friend.id"
        class="picker-row"
        :class="{
          selected: isSelected(friend.id),
          disabled: isDisabled(friend.id)
        }"
        @click.prevent="toggle(friend.id, !isSelected(friend.id))"
      >
        <v-avatar size="36" class="picker-avatar">
          <v-img v-if="friend.avatarUrl" :src="friend.avatarUrl" cover />
          <span v-else>{{ initial(friend.name) }}</span>
        </v-avatar>
        <span class="picker-name">{{ friend.name || t('challenges.unknownHero') }}</span>
        <v-checkbox
          :model-value="isSelected(friend.id)"
          hide-details
          density="compact"
          color="#7048E8"
          class="picker-check"
          :disabled="disabled || isDisabled(friend.id)"
          @update:model-value="toggle(friend.id, $event)"
          @click.stop
        />
      </label>
    </div>

    <p v-if="atCap" class="picker-full">{{ t('challenges.squad.full') }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFriendship } from '../../composables/useFriendship'
import { useDemoMode } from '../../composables/useDemoMode'
import { MAX_SQUAD_GUESTS } from '../../utils/challengeMembership'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  excludeIds: { type: Array, default: () => [] },
  maxCount: { type: Number, default: MAX_SQUAD_GUESTS }
})

const selectedIds = defineModel({ type: Array, default: () => [] })

const { t } = useI18n()
const { isSocialGated, requireAuthOrPrompt } = useDemoMode()
const { friends, loadingSquad, squadError, loadSquad } = useFriendship()

const excluded = computed(() => new Set((props.excludeIds || []).map((id) => String(id))))

const availableFriends = computed(() =>
  (friends.value || [])
    .map((item) => item.user)
    .filter(Boolean)
    .map((user) => ({
      id: String(user._id || user.id),
      name: user.name || '',
      avatarUrl: user.avatarUrl || ''
    }))
    .filter((user) => user.id && !excluded.value.has(user.id))
)

const selectedSet = computed(() => new Set((selectedIds.value || []).map((id) => String(id))))
const atCap = computed(() => selectedSet.value.size >= props.maxCount)

function isSelected(id) {
  return selectedSet.value.has(String(id))
}

function isDisabled(id) {
  if (props.disabled) return true
  return atCap.value && !isSelected(id)
}

function toggle(id, checked) {
  const key = String(id)
  const next = new Set(selectedSet.value)
  if (checked) {
    if (next.size >= props.maxCount) return
    next.add(key)
  } else {
    next.delete(key)
  }
  selectedIds.value = Array.from(next)
}

function initial(name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?'
}

onMounted(() => {
  if (!isSocialGated.value) loadSquad()
})
</script>

<style scoped>
.squad-invite-picker {
  margin-top: 16px;
  padding: 16px;
  border-radius: 16px;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.picker-title {
  margin: 0;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.picker-hint,
.picker-limit,
.picker-full,
.picker-empty p {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: var(--home-text-dim, #94a3b8);
}

.picker-full {
  color: #fbbf24;
}

.picker-loading,
.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 8px 8px;
  text-align: center;
}

.picker-cta {
  color: #0b0d12 !important;
  background: linear-gradient(135deg, #4fd1c5, #7048e8) !important;
  font-weight: 800 !important;
}

.picker-link {
  color: #4fd1c5;
  font-weight: 700;
  text-decoration: none;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
}

.picker-row.selected {
  border-color: rgba(112, 72, 232, 0.55);
  background: rgba(112, 72, 232, 0.1);
}

.picker-row.disabled {
  opacity: 0.45;
  cursor: default;
}

.picker-avatar {
  background: #16213e;
  color: #4fd1c5;
  font-weight: 800;
  flex-shrink: 0;
}

.picker-name {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  color: var(--home-text, #f1f5f9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-check {
  flex-shrink: 0;
  margin: 0;
}
</style>
