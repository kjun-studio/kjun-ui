<template>
  <span class="kjun-table-check">
    <input
      type="checkbox"
      v-bind="$attrs"
      :checked="checked"
      :indeterminate.prop="indeterminate"
      @change="$emit('change', $event)"
      @click="$emit('click', $event)"
    />
    <DsIcon name="check" :size="iconSize" class="kjun-table-check-mark" />
    <DsIcon name="minus" :size="iconSize" class="kjun-table-check-dash" />
  </span>
</template>

<script>
// A native checkbox (role, indeterminate, row click isolation) drawn like DsCheckbox sm.
import { tokens } from "@kjun-ui/tokens";
import DsIcon from "../../../icon.js";
import { defaultIcons, withFallbackIcons } from "../../../../../../shared/package-runtime/icon-registry";
import { componentIcons } from "../../../../../../shared/package-runtime/component-icons";

export default {
  name: "TableCheck",
  components: { DsIcon },
  inheritAttrs: false,
  inject: { parentIcons: { from: "kjunIcons", default: null } },
  provide() { return { kjunIcons: () => this.checkIcons }; },
  props: {
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
  },
  computed: {
    iconSize() { return String(tokens.extensions.checkbox.iconSizes.sm); },
    checkIcons() { return withFallbackIcons(this.parentIcons?.() || defaultIcons, componentIcons); },
  },
};
</script>
