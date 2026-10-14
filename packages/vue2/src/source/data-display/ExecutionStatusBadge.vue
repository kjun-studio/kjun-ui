<template><KjunBadge :variant="state.variant" :size="size" :dot="status === 'running'">{{ label || state.label }}</KjunBadge></template>
<script>
import KjunBadge from "../primitives/Badge.vue";
import { componentMixins } from "../../component-mixins.js";
import { executionStatus } from './executionStatus'
import { SIZES_EXTENDED, oneOf } from '../tokens'
export default {
  mixins: componentMixins,
  components: { KjunBadge },
  name: 'KjunExecutionStatusBadge',
  props: {
    status: { type: String, default: null },
    label: { type: String, default: '' },
    size: { type: String, default: 'md', validator: oneOf(SIZES_EXTENDED) },
  },
  computed: { state() { return executionStatus(this.status) } },
}
</script>
