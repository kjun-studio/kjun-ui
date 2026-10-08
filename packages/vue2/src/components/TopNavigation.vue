<template>
  <header class="kjun-top-navigation" :style="{ paddingTop: Math.max(0, safeAreaTop) + 'px' }">
    <div class="kjun-navigation-content">
      <div v-if="$slots.leading" class="kjun-navigation-leading"><slot name="leading" /></div>
      <div class="kjun-navigation-title"><strong>{{ title }}</strong><p v-if="description">{{ description }}</p></div>
      <div v-if="$slots.actions" class="kjun-navigation-actions"><slot name="actions" /></div>
    </div>
  </header>
</template>
<script>
import { tokens } from '@kjun/tokens';
export default {
  name: "DsTopNavigation",
  provide() { return { kjunTopNavigation: tokens.extensions.topNavigation }; },
  props: { title: { type: String, required: true }, description: String, safeAreaTop: { type: Number, default: 0 } },
};
</script>
