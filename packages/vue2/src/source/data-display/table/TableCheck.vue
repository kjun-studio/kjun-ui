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
    <KjunIcon name="check" :size="iconSize" class="kjun-table-check-mark" />
    <KjunIcon name="minus" :size="iconSize" class="kjun-table-check-dash" />
  </span>
</template>

<script>
// A native checkbox (role, indeterminate, row click isolation) drawn like KjunCheckbox sm.
import { tokens } from "@kjun-ui/tokens";
import KjunIcon from "../../../icon.js";
import { defaultIcons, withFallbackIcons } from "../../../../../../shared/package-runtime/icon-registry";
import { componentIcons } from "../../../../../../shared/package-runtime/component-icons";

export default {
  name: "KjunTableCheck",
  components: { KjunIcon },
  inheritAttrs: false,
  inject: { kjunParentIcons: { from: "kjunIcons", default: null } },
  provide() { return { kjunIcons: () => this.checkIcons }; },
  props: {
    checked: { type: Boolean, default: false },
    indeterminate: { type: Boolean, default: false },
  },
  computed: {
    iconSize() { return String(tokens.extensions.checkbox.iconSizes.sm); },
    checkIcons() { return withFallbackIcons(this.kjunParentIcons?.() || defaultIcons, componentIcons); },
  },
};
</script>
