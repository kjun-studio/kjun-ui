<template>
  <nav v-if="!keyboardVisible || !hideOnKeyboard" class="kjun-bottom-navigation" :data-icons="hasIcons || undefined" :aria-label="ariaLabel" :style="{ paddingBottom: Math.max(0, safeAreaBottom) + 'px' }">
    <a v-for="item in items" :key="item.key" :href="item.disabled ? undefined : item.href" :aria-label="item.label + (item.badge != null ? ', ' + item.badge : '')" :aria-disabled="item.disabled ? 'true' : undefined" :aria-current="value === item.key ? 'page' : undefined" @click="navigate(item, $event)">
      <span v-if="hasIcons" class="kjun-navigation-icon">
        <DsIcon v-if="item.icon" :name="item.icon" :size="iconSize" />
        <span v-if="item.badge != null" class="kjun-navigation-badge" aria-hidden="true">{{ item.badge }}</span>
      </span>
      <span class="kjun-navigation-label">{{ item.label }}<span v-if="!hasIcons && item.badge != null" class="kjun-navigation-badge" aria-hidden="true">{{ item.badge }}</span></span>
    </a>
  </nav>
</template>
<script>
import DsIcon from "../icon.js";
import { tokens } from "@kjun-ui/tokens";
export default {
  name: "DsBottomNavigation", components: { DsIcon },
  props: { items: { type: Array, required: true }, value: { type: String, required: true }, ariaLabel: { type: String, default: "주요 탐색" }, safeAreaBottom: { type: Number, default: 0 }, keyboardVisible: { type: Boolean, default: false }, hideOnKeyboard: { type: Boolean, default: true } },
  computed: { hasIcons() { return this.items.some(item => item.icon); }, iconSize() { return tokens.extensions.bottomNavigation.iconSize; } },
  methods: { navigate(item, event) { if (item.disabled) event.preventDefault(); else this.$emit("navigate", item.key, event); } },
};
</script>
