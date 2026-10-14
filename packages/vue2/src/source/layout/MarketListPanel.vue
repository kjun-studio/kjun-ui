<template>
  <DsCard class="kjun-market-list-panel">
    <div class="kjun-market-list-panel__controls">
      <slot name="controls" />
    </div>
    <div class="kjun-market-list-panel__results kjun-mobile-list-surface kj-border-t kj-border-border kj-mt-4">
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
