<template>
  <div class="kjun-time-picker" :data-size="size" :data-error="String(fieldInvalid)" :data-disabled="String(disabled || !valid)" role="group" :aria-label="ariaLabel" :aria-labelledby="fieldLabelledby" :aria-describedby="fieldDescribedby">
    <div class="kjun-time-segments">
    <template v-for="(label, index) in labels">
    <span v-if="index" :key="label + '-separator'" class="kjun-time-separator" aria-hidden="true">:</span>
    <div :key="label" class="kjun-time-segment"><span :id="timeId + '-segment-' + index" class="kjun-sr-only" aria-hidden="true">{{ label }}</span><DsSelect :id="index === 0 ? timeId : timeId + '-' + index" :aria-labelledby="fieldLabelledby ? fieldLabelledby + ' ' + timeId + '-segment-' + index : undefined" :value="time === null ? null : domain.part(time, index)" :options="domain.options(value, index).map(n => ({ value: n, label: String(n).padStart(2, '0') }))" :aria-label="ariaLabel + ' ' + label" :placeholder="label" :disabled="disabled || !valid" :error="error" :size="size" :clearable="false" :searchable="false" @input="choose(index, $event)" /></div>
    </template>
    </div>
    <DsButton class="kjun-time-clear" v-if="clearable && value !== null" :size="size" variant="ghost" prefix-icon="x" :aria-label="ariaLabel + ' 지우기'" :disabled="disabled || !valid" @click="clear" />
  </div>
</template>
<script>
import { createTimeDomain } from "@kjun/tokens";
import DsSelect from "../source/form/Select.vue";
import DsButton from "../source/primitives/Button.vue";
import fieldMixin from "../source/form/fieldMixin";
export default {
  name: "DsTimePicker", components: { DsSelect, DsButton }, inheritAttrs: false, mixins: [fieldMixin],
  provide() { return { kjunCompoundControl: () => this.size }; },
  props: { value: { type: String, default: null }, precision: { type: String, default: "minute", validator: v => ["minute", "second"].includes(v) }, min: String, max: String, minuteStep: { type: Number, default: 1 }, secondStep: { type: Number, default: 1 }, disabled: { type: Boolean, default: false }, error: { type: Boolean, default: false }, clearable: { type: Boolean, default: true }, size: { type: String, default: "md", validator: v => ["sm", "md", "lg"].includes(v) }, ariaLabel: { type: String, default: "시간" } },
  computed: { timeId() { return this.fieldId || `kjun-time-${this._uid}`; }, domain() { return createTimeDomain(this); }, valid() { return this.domain.valid && this.domain.accepts(this.value); }, labels() { return ["시", "분", "초"].slice(0, this.precision === "second" ? 3 : 2); }, time() { return this.value === null ? null : this.domain.parse(this.value); } },
  watch: { valid: { immediate: true, handler(value) { if (!value) console.warn("KJUN TimePicker: 시각 범위·간격·값을 확인하세요."); } } },
  methods: { clear() { this.change(null); this.$nextTick(() => this.$el.querySelector('[role="combobox"]')?.focus()); }, change(value) { if (this.valid && !this.disabled && this.value !== value) { this.$emit("input", value); this.$emit("change", value); } }, choose(index, value) { if (typeof value === "number") this.change(this.domain.select(this.value, index, value)); } },
};
</script>
