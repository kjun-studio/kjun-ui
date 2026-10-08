<template>
  <span class="ds-heatmap-cell"><span class="ds-heatmap-cell__fill" :style="fillStyle" aria-hidden="true"/><span class="ds-heatmap-cell__content"><slot>{{ value }}</slot></span></span>
</template>
<script>
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
export default {
  mixins: [...componentMixins, domainColorMixin(vm => vm.mode === 'price')],
  name: 'DsHeatmapCell',
  props: { value: {type:Number,default:0}, min:{type:Number,default:0}, max:{type:Number,default:1}, mode:{type:String,default:'diverging'}, color:{type:String,default:'brand'} },
  computed: {
    fillStyle() {
      const normal=this.max===this.min ? .5 : Math.max(0,Math.min(1,(this.value-this.min)/(this.max-this.min)));
      const role=this.mode==='price' ? (normal>=.5?'price-up':'price-down') : this.mode==='diverging' ? (normal>=.5?'success':'danger') : this.color;
      const magnitude=this.mode==='sequential' ? normal : Math.abs(normal-.5)*2;
      // A zero cell keeps its shape on the neutral fill; any other value starts from a visible minimum.
      if(!magnitude) return {backgroundColor:'var(--_kjun-color-secondary)'};
      return {backgroundColor:'var(--_kjun-color-'+role+')',opacity:'calc(var(--_kjun-state-opacity-heat-minimum) + (var(--_kjun-state-opacity-heat-maximum) - var(--_kjun-state-opacity-heat-minimum)) * '+magnitude+')'};
    },
  },
};
</script>
<style scoped>
.ds-heatmap-cell{position:relative;display:inline-block;padding:var(--extension-financial-pill-padding-y) var(--extension-financial-pill-padding-x);border-radius:var(--extension-financial-cell-radius);color:var(--text-primary);font-variant-numeric:tabular-nums}
.ds-heatmap-cell__fill{position:absolute;inset:0;border-radius:inherit;pointer-events:none}
.ds-heatmap-cell__content{position:relative}
</style>
