<template>
  <div class="reactions-row">
    <button
      v-for="emoji in used"
      :key="emoji"
      type="button"
      class="reaction-capsule"
      :class="{ active: userReacted(emoji) }"
      @click="$emit('toggle', emoji)"
    >
      <span class="emoji">{{ emoji }}</span>
      <span class="count">{{ countFor(emoji) }}</span>
    </button>
    <v-menu v-if="currentUserId" location="top" :close-on-content-click="true">
      <template #activator="{ props: menuProps }">
        <button
          v-bind="menuProps"
          type="button"
          class="reaction-add"
          :aria-label="t('challenges.diary.addReaction')"
        >
          <v-icon size="18">mdi-emoticon-outline</v-icon>
        </button>
      </template>
      <div class="reaction-picker">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          type="button"
          class="reaction-pick"
          @click="$emit('toggle', emoji)"
        >{{ emoji }}</button>
      </div>
    </v-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const REACTION_EMOJIS = ['😂', '👏', '🔥', '💪', '😢']

const props = defineProps({
  item: { type: Object, required: true },
  currentUserId: { type: String, default: null }
})

defineEmits(['toggle'])

const { t } = useI18n()
const emojis = REACTION_EMOJIS

function reactionsObj() {
  const reactions = props.item?.reactions
  if (!reactions) return {}
  return reactions instanceof Map ? Object.fromEntries(reactions) : reactions
}

function countFor(emoji) {
  return (reactionsObj()[emoji] || []).length
}

function userReacted(emoji) {
  if (!props.currentUserId) return false
  const userIdStr = props.currentUserId.toString()
  return (reactionsObj()[emoji] || []).some((r) => {
    const rUserId = r.userId?._id || r.userId
    return rUserId && rUserId.toString() === userIdStr
  })
}

const used = computed(() => REACTION_EMOJIS.filter((emoji) => countFor(emoji) > 0))
</script>

<style scoped>
.reactions-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.reaction-capsule,
.reaction-add {
  min-height: 36px;
  padding: 0 10px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.reaction-capsule.active {
  background: rgba(79, 209, 197, 0.2);
  border-color: #4FD1C5;
}

.reaction-capsule .count {
  font-size: 0.75rem;
  font-weight: 700;
}

.reaction-add {
  width: 36px;
  justify-content: center;
  color: #94a3b8;
}

.reaction-picker {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #161b28;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.reaction-pick {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
}
</style>

<style>
.reaction-picker {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #161b28;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.reaction-pick {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
}
</style>
