<template>
  <div class="kjun-form-skeleton grid grid-cols-1" :data-columns="columns" aria-hidden="true" :style="{ '--form-skeleton-radius': inputSpec.radius + 'px' }">
    <div v-for="(field, index) in fields" :key="index">
      <div v-if="field" class="text-sm font-medium text-text-primary">{{ typeof field === 'string' ? field : field.label }}</div>
      <!-- The bar sits in a label-line slot so the field starts where the real input will. -->
      <div v-else class="kjun-form-skeleton-label-slot"><DsSkeleton type="block" height="var(--extension-skeleton-form-label-height)" width="var(--extension-skeleton-form-label-width)" /></div>
      <DsSkeleton type="block" :height="fieldHeight(field)" />
    </div>
  </div>
</template>

<script>
import { tokens } from "@kjun/tokens";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsSkeleton },
  name: 'FormSkeleton',
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
