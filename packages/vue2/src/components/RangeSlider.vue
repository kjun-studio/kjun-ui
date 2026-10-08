<template>
  <div class="kjun-slider" :data-disabled="String(blocked)" role="group" :aria-label="ariaLabel || label || '범위'">
    <div class="kjun-slider-caption">
      <span v-if="label" class="kjun-slider-label">{{ label }}</span>
      <output class="kjun-slider-value">{{ values.join(' – ') }}</output>
    </div>
    <div class="kjun-slider-track kjun-vue-range" @click="trackClick">
      <div class="kjun-slider-rail" />
      <div class="kjun-slider-fill" :style="{ left: percent(values[0]) + '%', width: (percent(values[1]) - percent(values[0])) + '%' }" />
      <input v-for="(number, index) in values" :key="index" type="range"
        :aria-label="thumbLabels[index]" :aria-valuemin="index === 1 ? values[0] : min"
        :aria-valuemax="index === 0 ? values[1] : effectiveMax" :value="valid ? number : index * 100"
        :min="valid ? min : 0" :max="effectiveMax" :step="valid ? step : 1" :disabled="blocked"
        @input="update(index, Number($event.target.value)); $event.target.value = accepted[index]"
        @change="commit" @keydown="key($event, index)" @keyup="commit" @blur="commit" />
    </div>
  </div>
</template>
<script>
import slider from "./slider.js";
export default { name: "DsRangeSlider", mixins: [slider], props: { value: { type: Array, required: true }, thumbLabels: { type: Array, default: () => ["최솟값", "최댓값"] } } };
</script>
