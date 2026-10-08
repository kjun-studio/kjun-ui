<template>
  <div class="kjun-slider" :data-disabled="String(blocked)">
    <div class="kjun-slider-caption">
      <label v-if="label" class="kjun-slider-label" :for="'slider-' + _uid">{{ label }}</label>
      <output class="kjun-slider-value">{{ value }}</output>
    </div>
    <div class="kjun-slider-track kjun-vue-range" @click="trackClick">
      <div class="kjun-slider-rail" />
      <div class="kjun-slider-fill" :style="{ width: percent(value) + '%' }" />
      <input :id="'slider-' + _uid" type="range" class="kjun-vue-single"
        :aria-label="ariaLabel || label || '값'" :value="valid ? value : 0"
        :min="valid ? min : 0" :max="effectiveMax" :step="valid ? step : 1" :disabled="blocked"
        @input="update(0, Number($event.target.value))" @change="commit"
        @keydown="key($event, 0)" @keyup="commit" @blur="commit" />
    </div>
  </div>
</template>
<script>
import slider from "./slider.js";
export default { name: "DsSlider", mixins: [slider], props: { value: { type: Number, required: true } } };
</script>
