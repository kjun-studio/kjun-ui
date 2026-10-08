<template>
  <DsCard class="ds-market-list-panel">
    <div class="ds-market-list-panel__controls">
      <slot name="controls" />
    </div>
    <div class="ds-market-list-panel__results mobile-list-surface border-t border-border mt-4">
      <slot />
    </div>
  </DsCard>
</template>

<script>
import DsCard from "./Card.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsCard },
  name: 'DsMarketListPanel',
}
</script>
