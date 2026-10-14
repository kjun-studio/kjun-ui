<template>
  <div class="kjun-form-skeleton kj-grid kj-grid-cols-1" :data-columns="columns" aria-hidden="true" :style="{ '--_kjun-form-skeleton-radius': inputSpec.radius + 'px' }">
    <div v-for="(field, index) in fields" :key="index">
      <div v-if="field" class="kj-text-sm kj-font-medium kj-text-text-primary">{{ typeof field === 'string' ? field : field.label }}</div>
      <!-- The bar sits in a label-line slot so the field starts where the real input will. -->
      <div v-else class="kjun-form-skeleton-label-slot"><KjunSkeleton type="block" height="var(--_kjun-extension-skeleton-form-label-height)" width="var(--_kjun-extension-skeleton-form-label-width)" /></div>
      <KjunSkeleton type="block" :height="fieldHeight(field)" />
    </div>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import KjunSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { KjunSkeleton },
  name: 'KjunFormSkeleton',
  props: {
    fields: { type: Array, default: () => ['', '', '', ''] },
    columns: { type: Number, default: 1 },
    multiline: { type: Boolean, default: false },
    size: { type: String, default: 'md', validator: value => ['sm', 'md', 'lg'].includes(value) },
  },
  computed: { inputSpec() { return tokens.input[this.size] } },
  methods: {
    fieldHeight(field) {
      const height = field && field.height
      if (height != null && typeof field === 'object') return typeof height === 'number' ? `${height}px` : height
      return this.multiline ? `${this.inputSpec.lineHeight * 3 + this.inputSpec.textareaPaddingY * 2 + 2 * tokens.border.controlWidth}px` : `${this.inputSpec.height}px`
    },
  },
}
</script>
