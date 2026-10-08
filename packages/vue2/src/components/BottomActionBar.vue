<template>
  <div v-if="!keyboardVisible || !hideOnKeyboard" class="kjun-bottom-action-bar" :style="{ paddingBottom: (navigationPadding + Math.max(0, safeAreaBottom)) + 'px' }"><div class="kjun-bottom-action-content"><p v-if="description">{{ description }}</p><div class="kjun-navigation-actions"><slot /></div></div></div>
</template>
<script>
import { tokens } from "@kjun-ui/tokens";
export default { name: "DsBottomActionBar", computed: { navigationPadding() { return tokens.extensions.navigation.padding; } }, props: { description: String, safeAreaBottom: { type: Number, default: 0 }, keyboardVisible: { type: Boolean, default: false }, hideOnKeyboard: { type: Boolean, default: false } } };
</script>
