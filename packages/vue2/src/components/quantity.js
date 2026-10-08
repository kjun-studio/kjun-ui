import { createNumberDomain, quantityKeyAction, tokens } from "@kjun/tokens";
import fieldMixin from "../source/form/fieldMixin.js";
export default {
  mixins: [fieldMixin],
  props: { block: { type: Boolean, default: false }, value: { type: Number, required: true }, min: { type: Number, default: 0 }, max: Number, step: { type: Number, default: 1 }, precision: { type: Number, default: 0 }, disabled: { type: Boolean, default: false }, error: { type: Boolean, default: false }, size: { type: String, default: "md", validator: v => ["sm", "md", "lg"].includes(v) }, id: String },
  data() { return { draft: String(this.value), composing: false, dirty: false, accepted: this.value }; },
  computed: { buttonStyle() { return { width: tokens.input[this.size].height + "px", padding: 0 }; }, domain() { return createNumberDomain({ min: this.min, max: this.max, step: this.step, precision: this.precision }); }, valid() { return this.domain.valid && this.domain.accepts(this.value); }, blocked() { return this.disabled || !this.valid; } },
  watch: { value: "resetDraft", min: "resetDraft", max: "resetDraft", step: "resetDraft", precision: "resetDraft", valid: { immediate: true, handler(value) { if (!value) console.warn("KJUN QuantityStepper: 범위·step·정밀도·값을 확인하세요."); } } },
  methods: {
    resetDraft() { this.draft = String(this.value); this.accepted = this.value; this.dirty = false; },
    emitValue(value) { this.draft = String(this.value); this.dirty = false; if (value !== this.value) { this.$emit("input", value); this.$emit("change", value); } },
    commit() { if (this.blocked || this.composing || !this.dirty) return; const next = this.domain.fromDraft(this.draft); if (next === null) { this.$emit("invalid-input", this.draft); this.draft = String(this.accepted); this.dirty = false; } else this.emitValue(next); },
    move(direction) { if (!this.blocked) this.emitValue(this.domain.move(this.accepted, direction)); },
    edit(event) { this.dirty = true; this.draft = event.target.value; },
    key(event) {
      if (this.blocked) return;
      const action = quantityKeyAction(event, this.composing, this.dirty);
      if (!action) return;
      event.preventDefault();
      if (action === "cancel") {
        event.stopPropagation();
        this.dirty = false;
        this.draft = String(this.accepted);
      } else if (action === "commit") this.commit();
      else this.move(action === "increment" ? 1 : -1);
    },
  },
};
