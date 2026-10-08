<template>
  <!-- The heart draws one icon step larger within the same box to match the star optically, like React and Native. -->
  <DsIcon :name="state.icon" :filled="active" :size="iconSize" :style="{ margin: (boxSize - Number(iconSize)) / 2 + 'px' }" :class="[sizeClass, active ? state.color : 'text-text-tertiary']" />
</template>
<script>
import { tokens } from "@kjun/tokens";
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import { COLLECTION_KINDS, COLLECTION_STATES } from '../primitives/collectionState'
import { SIZES_CORE, oneOf } from '../tokens'
export default {
  mixins: [...componentMixins, domainColorMixin(vm => vm.active)],
  components: { DsIcon },
  name: 'DsCollectionMark',
  props: {
    kind: { type: String, required: true, validator: oneOf(COLLECTION_KINDS) },
    active: { type: Boolean, default: false },
    size: { type: String, default: 'md', validator: oneOf(SIZES_CORE) },
  },
  computed: {
    boxSize() { return tokens.extensions.financial.markSizes[this.size] },
    iconSize() { return String(this.kind === 'interest' ? tokens.extensions.financial.heartMarkSizes[this.size] : this.boxSize) },
    state() { return COLLECTION_STATES[this.kind] },
    sizeClass() { return { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[this.size] },
  },
}
</script>
