<template>
  <div class="search-wrapper mb-12">
    <v-text-field
      :model-value="modelValue"
      :placeholder="t('users.searchPlaceholder')"
      prepend-inner-icon="mdi-magnify"
      variant="solo"
      flat
      class="hero-search-input-dark"
      rounded="xl"
      hide-details
      @update:model-value="$emit('update:modelValue', $event)"
      @keyup.enter="$emit('search')"
    >
      <template #append-inner>
        <v-btn
          color="teal-accent-4"
          rounded="pill"
          class="px-6 font-weight-black"
          @click="$emit('search')"
        >
          {{ t('users.search') }}
        </v-btn>
      </template>
    </v-text-field>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: String, default: '' }
})

defineEmits(['update:modelValue', 'search'])

const { t } = useI18n()
</script>

<style scoped>
.hero-search-input-dark :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  color: white !important;
}

@media (max-width: 480px) {
  .search-wrapper {
    margin-bottom: 16px !important;
  }

  .hero-search-input-dark :deep(.v-field) {
    height: 48px !important;
  }
}
</style>
