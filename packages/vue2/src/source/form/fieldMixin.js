export default {
  inject: { kjunFormGroup: { default: null } },
  props: {
    error: { type: Boolean, default: false },
    ariaLabel: { type: String, default: '' },
  },
  computed: {
    fieldRequired() {
      const explicit = this.required ?? this.$attrs.required;
      return explicit === undefined ? !!this.kjunFormGroup?.required : explicit !== false && explicit !== null;
    },
    fieldInvalid() {
      return !!(this.error || this.errorMessage || this.kjunFormGroup?.error)
    },
    fieldId() {
      return this.$attrs.id || this.kjunFormGroup?.id || undefined
    },
    fieldLabelledby() {
      return this.$attrs['aria-labelledby'] || this.kjunFormGroup?.labelId || undefined
    },
    fieldDescribedby() {
      const ids = [this.$attrs['aria-describedby'], this.kjunFormGroup?.describedById]
      if (this.showFieldErrorMessage) ids.push(`kjun-input-error-${this._uid}`)
      return ids.filter(Boolean).join(' ') || undefined
    },
    showFieldErrorMessage() {
      return !!this.errorMessage && !this.kjunFormGroup?.error
    },
    fieldSizeClass() {
      return `kjun-field--${this.size || 'md'}`
    },
    fieldClasses() {
      return ['kjun-field', this.fieldSizeClass, { 'kjun-field--error': this.fieldInvalid }]
    },
  },
}
