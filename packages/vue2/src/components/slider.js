import { createSliderDomain, sliderKey } from "@kjun/tokens";
export default {
  props: { min: { type: Number, default: 0 }, max: { type: Number, default: 100 }, step: { type: Number, default: 1 }, disabled: { type: Boolean, default: false }, label: String, ariaLabel: String },
  data() { return { accepted: Array.isArray(this.value) ? [...this.value] : [this.value], dirty: false }; },
  computed: {
    domain() { return createSliderDomain(this.min, this.max, this.step); },
    values() { return Array.isArray(this.value) ? this.value : [this.value]; },
    valid() { return this.domain.valid && (!Array.isArray(this.value) || this.value.length === 2) && this.values.every(this.domain.accepts) && (this.values.length === 1 || this.values[0] <= this.values[1]); },
    blocked() { return this.disabled || !this.valid; },
    effectiveMax() { return this.valid ? this.domain.snap(this.max) : 100; },
  },
  watch: { value() { this.accepted = [...this.values]; }, valid: { immediate: true, handler(value) { if (!value) console.warn("KJUN Slider: 범위·step·값을 확인하세요."); } } },
  methods: {
    update(index, number) {
      if (this.blocked) return;
      const next = [...this.accepted];
      next[index] = Math.min(index === 0 && next.length === 2 ? next[1] : this.max, Math.max(index === 1 ? next[0] : this.min, this.domain.snap(number)));
      if (next[index] === this.accepted[index]) return;
      this.accepted = next; this.dirty = true; this.$emit("input", next.length === 1 ? next[0] : next);
    },
    commit() { if (!this.blocked && this.dirty) { this.dirty = false; this.$emit("change", this.accepted.length === 1 ? this.accepted[0] : [...this.accepted]); } },
    key(event, index) { const next = sliderKey(event.key, this.accepted[index], this.min, this.max, this.step); if (next !== null) { event.preventDefault(); this.update(index, next); } },
    percent(value) { return this.valid && this.effectiveMax > this.min ? Math.max(0, Math.min(100, (value - this.min) / (this.effectiveMax - this.min) * 100)) : 0; },
    trackClick(event) { if (event.target.tagName === "INPUT" || this.blocked) return; const box = event.currentTarget.getBoundingClientRect(); const number = this.min + (event.clientX - box.left) / box.width * (this.effectiveMax - this.min); const index = this.values.length === 2 && Math.abs(number - this.values[1]) < Math.abs(number - this.values[0]) ? 1 : 0; this.update(index, number); this.commit(); },
  },
};
