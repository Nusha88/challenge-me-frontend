<template>
  <v-dialog
    v-model="dialogModel"
    :fullscreen="isPhone"
    :max-width="isPhone ? undefined : 520"
    scrollable
  >
    <v-card
      class="sparks-shop-card overflow-hidden"
      :class="isPhone ? 'rounded-0' : 'rounded-xl'"
    >
      <v-card-title class="sparks-shop-header">
        <div class="sparks-shop-title-row">
          <span class="sparks-icon">✦</span>
          <span>{{ t('sparks.shop.title') }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          class="sparks-shop-close"
          :aria-label="t('common.close')"
          @click="dialogModel = false"
        />
      </v-card-title>

      <div class="sparks-shop-balance-wrap">
        <div class="sparks-balance-pill">
          <span class="sparks-icon">✦</span>
          <span>{{ t('sparks.info.currentBalance', { count: sparks }) }}</span>
        </div>
        <p class="sparks-shop-earn-hint">
          {{ t('sparks.shop.earnHint') }}
        </p>
      </div>

      <v-tabs
        v-model="activeTab"
        :grow="!isPhone"
        class="sparks-shop-tabs"
      >
        <v-tab value="self">{{ t('sparks.shop.tabs.self') }}</v-tab>
        <v-tab value="defense">{{ t('sparks.shop.tabs.defense') }}</v-tab>
      </v-tabs>

      <v-card-text class="sparks-shop-body">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="#ffc107"
          class="sparks-shop-loading"
        />
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="sparks-shop-alert"
        >
          {{ error }}
        </v-alert>

        <v-window v-model="activeTab">
          <v-window-item value="self">
            <p class="sparks-shop-description">
              {{ t('sparks.shop.wish.description') }}
            </p>
            <p class="sparks-shop-honor">
              {{ t('sparks.shop.wish.honorHint') }}
            </p>

            <div v-if="!wishItems.length" class="sparks-template-chips">
              <p class="sparks-shop-empty-hint">
                {{ t('sparks.shop.wish.emptyHint') }}
              </p>
              <button
                v-for="template in wishTemplates"
                :key="template.key"
                type="button"
                class="sparks-chip"
                @click="applyTemplate(template)"
              >
                <span>{{ t(`sparks.shop.wish.templates.${template.key}`) }}</span>
                <span class="sparks-chip-cost">
                  <span class="sparks-icon">✦</span>
                  {{ template.cost }}
                </span>
              </button>
            </div>

            <form class="sparks-wish-form" @submit.prevent="addWish">
              <v-text-field
                v-model="formTitle"
                :label="t('sparks.shop.wish.titleLabel')"
                :maxlength="wishTitleMax"
                variant="outlined"
                density="comfortable"
                hide-details
                class="sparks-field"
              />
              <v-text-field
                v-model="formCost"
                :label="t('sparks.shop.wish.costLabel')"
                type="number"
                inputmode="numeric"
                :min="wishCostMin"
                :max="wishCostMax"
                variant="outlined"
                density="comfortable"
                hide-details
                class="sparks-field"
              />
              <div class="sparks-size-chips">
                <button
                  v-for="chip in wishSizeChips"
                  :key="chip.key"
                  type="button"
                  class="sparks-chip sparks-chip--size"
                  :class="{ 'is-active': Number(formCost) === chip.cost }"
                  @click="applySizeChip(chip.cost)"
                >
                  {{ t(`sparks.shop.wish.size.${chip.key}`) }}
                  <span class="sparks-chip-cost">{{ chip.cost }}</span>
                </button>
              </div>
              <p class="sparks-price-hint">{{ priceHint }}</p>
              <p class="sparks-shop-honor">{{ t('sparks.shop.wish.priceHonor') }}</p>
              <p v-if="!canAddWish" class="sparks-shop-limit">
                {{ t('sparks.shop.wish.limitReached') }}
              </p>
              <v-btn
                type="submit"
                class="sparks-shop-action"
                :disabled="!canSubmitWish || saving"
                :loading="saving"
              >
                {{ t('sparks.shop.wish.add') }}
              </v-btn>
            </form>

            <ul v-if="wishItems.length" class="sparks-wish-list">
              <li
                v-for="wish in wishItems"
                :key="wish.id"
                class="sparks-wish-item"
              >
                <div class="sparks-wish-text">
                  <span class="sparks-wish-title">{{ wish.title }}</span>
                  <span class="sparks-wish-cost">
                    <span class="sparks-icon">✦</span>
                    {{ wish.cost }}
                  </span>
                </div>
                <div class="sparks-wish-actions">
                  <v-btn
                    size="small"
                    variant="flat"
                    class="sparks-shop-action sparks-shop-action--compact"
                    :disabled="saving || (!isDemo && sparks < wish.cost)"
                    :title="!isDemo && sparks < wish.cost ? t('sparks.shop.wish.insufficient') : ''"
                    @click="redeemWish(wish)"
                  >
                    {{ t('sparks.shop.wish.redeem') }}
                  </v-btn>
                  <v-btn
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    :aria-label="t('sparks.shop.wish.delete')"
                    :disabled="saving"
                    @click="removeWish(wish)"
                  />
                </div>
              </li>
            </ul>
          </v-window-item>

          <v-window-item value="defense">
            <p class="sparks-shop-description">
              {{ t('sparks.shop.defense.description') }}
            </p>
            <ul class="sparks-uses-list">
              <li
                v-for="item in catalog"
                :key="item.type"
                class="sparks-defense-item"
              >
                <div class="sparks-use-text">
                  <span class="sparks-use-name">{{ t(`sparks.shop.defense.${item.type}Title`) }}</span>
                  <span class="sparks-use-hint">{{ t(`sparks.shop.defense.${item.type}Hint`) }}</span>
                  <span class="sparks-stock">
                    {{ t('sparks.shop.defense.inStock', { count: stockFor(item.type) }) }}
                  </span>
                </div>
                <div class="sparks-defense-buy">
                  <span class="sparks-use-cost">
                    <span class="sparks-icon">✦</span>
                    {{ item.cost }}
                  </span>
                  <v-btn
                    size="small"
                    variant="flat"
                    class="sparks-shop-action sparks-shop-action--compact"
                    :disabled="saving || (!isDemo && sparks < item.cost)"
                    :title="!isDemo && sparks < item.cost ? t('sparks.shop.wish.insufficient') : ''"
                    @click="buyToken(item.type)"
                  >
                    {{ t('sparks.shop.defense.buy') }}
                  </v-btn>
                </div>
              </li>
            </ul>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="toastOpen" color="success" timeout="2800">
    {{ toast }}
  </v-snackbar>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useSparksShop } from '../../composables/useSparksShop'
import {
  WISH_COST_MAX,
  WISH_COST_MIN,
  WISH_SIZE_CHIPS,
  WISH_TEMPLATES,
  WISH_TITLE_MAX
} from '../../constants/shop'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()
const { smAndDown } = useDisplay()
const isPhone = computed(() => smAndDown.value)
const activeTab = ref('self')
const wishTemplates = WISH_TEMPLATES
const wishSizeChips = WISH_SIZE_CHIPS
const wishTitleMax = WISH_TITLE_MAX
const wishCostMin = WISH_COST_MIN
const wishCostMax = WISH_COST_MAX

const {
  loading,
  saving,
  error,
  toast,
  toastOpen,
  wishItems,
  catalog,
  formTitle,
  formCost,
  sparks,
  canAddWish,
  canSubmitWish,
  priceHint,
  isDemo,
  applyTemplate,
  applySizeChip,
  loadShop,
  addWish,
  removeWish,
  redeemWish,
  buyToken,
  stockFor
} = useSparksShop()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      activeTab.value = 'self'
      loadShop()
    }
  }
)
</script>

<style scoped>
.sparks-shop-card {
  background: rgba(13, 13, 23, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(12px);
  color: #ffffff;
}

.sparks-shop-header {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 56px;
  padding: 12px 64px 12px 20px;
}

.sparks-shop-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 800;
  line-height: 1.3;
}

.sparks-shop-close {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 44px !important;
  height: 44px !important;
  color: rgba(255, 255, 255, 0.7) !important;
}

.sparks-shop-balance-wrap {
  padding: 0 20px 16px;
}

.sparks-shop-earn-hint {
  margin: 8px 0 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.55);
}

.sparks-shop-tabs {
  margin: 0 12px;
  padding-right: 8px;
}

@media (max-width: 600px) {
  .sparks-shop-header {
    padding-top: max(12px, env(safe-area-inset-top));
    min-height: calc(56px + env(safe-area-inset-top, 0px));
  }

  .sparks-shop-close {
    top: max(6px, env(safe-area-inset-top));
  }

  .sparks-shop-tabs {
    margin: 0 8px 0 12px;
    padding-right: 0;
  }

  .sparks-shop-tabs :deep(.v-tab) {
    min-width: 0;
    padding: 0 12px;
  }
}

.sparks-shop-tabs :deep(.v-tab) {
  color: rgba(255, 255, 255, 0.55) !important;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.02em;
}

.sparks-shop-tabs :deep(.v-tab--selected) {
  color: #ffc107 !important;
}

.sparks-shop-tabs :deep(.v-tab__slider) {
  background: #ffc107 !important;
}

.sparks-shop-body {
  padding: 16px 20px 24px !important;
}

.sparks-shop-loading {
  margin-bottom: 12px;
}

.sparks-shop-alert {
  margin-bottom: 12px;
}

.sparks-shop-description {
  margin: 0 0 8px;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);
}

.sparks-shop-honor,
.sparks-shop-empty-hint,
.sparks-price-hint,
.sparks-shop-limit,
.sparks-stock {
  margin: 0 0 12px;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.55);
}

.sparks-price-hint {
  color: rgba(255, 193, 7, 0.86);
  font-weight: 700;
  margin-bottom: 6px;
}

.sparks-balance-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.22);
  font-weight: 800;
  font-size: 0.875rem;
  color: #ffffff;
}

.sparks-template-chips,
.sparks-size-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.sparks-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 193, 7, 0.28);
  background: rgba(255, 193, 7, 0.08);
  color: #ffffff;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.sparks-chip--size {
  padding: 6px 10px;
}

.sparks-chip.is-active,
.sparks-chip:hover {
  border-color: rgba(255, 193, 7, 0.5);
  background: rgba(255, 193, 7, 0.16);
}

.sparks-chip-cost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #ffc107;
}

.sparks-wish-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.sparks-field :deep(.v-field) {
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
}

.sparks-field :deep(.v-label),
.sparks-field :deep(input) {
  color: rgba(255, 255, 255, 0.86) !important;
}

.sparks-shop-action {
  align-self: flex-start;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.92), rgba(255, 152, 0, 0.92)) !important;
  color: #1a1304 !important;
  font-weight: 800 !important;
  text-transform: none !important;
  letter-spacing: 0.01em !important;
}

.sparks-shop-action--compact {
  min-width: 0;
}

.sparks-wish-list,
.sparks-uses-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sparks-wish-item,
.sparks-defense-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sparks-wish-item:last-child,
.sparks-defense-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.sparks-wish-text,
.sparks-use-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sparks-wish-title,
.sparks-use-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: #ffffff;
}

.sparks-wish-cost,
.sparks-use-cost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-weight: 800;
  font-size: 0.9375rem;
  color: #ffc107;
}

.sparks-use-hint {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.55);
}

.sparks-stock {
  margin: 4px 0 0;
}

.sparks-wish-actions,
.sparks-defense-buy {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.sparks-icon {
  color: #ffc107;
  font-size: 0.85rem;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255, 193, 7, 0.45));
}
</style>
