<template>
  <v-dialog
    :model-value="authGateOpen"
    max-width="460"
    @update:model-value="onVisibility"
  >
    <v-card class="demo-gate-card rounded-xl">
      <v-card-title class="demo-gate-title">
        {{ t('demo.gateTitle') }}
      </v-card-title>
      <v-card-text class="demo-gate-text">
        {{ t('demo.gateBody') }}
      </v-card-text>
      <v-card-actions class="demo-gate-actions px-4 pb-4">
        <v-btn
          variant="text"
          class="demo-gate-continue"
          @click="closeAuthGate"
        >
          {{ t('demo.continueInDemo') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="flat"
          class="demo-gate-register"
          :to="registerTo"
          @click="closeAuthGate"
        >
          {{ t('demo.register') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDemoAuthGate } from '../../composables/useDemoAuthGate'

const { t } = useI18n()
const { authGateOpen, authGateRedirect, closeAuthGate } = useDemoAuthGate()

const registerTo = computed(() => authGateRedirect.value || '/register?from=demo')

function onVisibility(open) {
  if (!open) closeAuthGate()
}
</script>

<style scoped>
.demo-gate-card {
  background: #12141c !important;
  border: 1px solid rgba(112, 72, 232, 0.35);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.45);
}

.demo-gate-title {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  padding: 20px 20px 8px;
  color: #ffffff;
}

.demo-gate-text {
  color: rgba(255, 255, 255, 0.78) !important;
  line-height: 1.5;
}

.demo-gate-register {
  background: linear-gradient(135deg, #7048E8, #4FD1C5) !important;
  color: #fff !important;
  text-transform: none;
  font-weight: 700;
}

.demo-gate-continue {
  text-transform: none;
  color: rgba(255, 255, 255, 0.78) !important;
}
</style>
