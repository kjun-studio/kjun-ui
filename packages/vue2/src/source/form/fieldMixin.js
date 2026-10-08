export default {
  inject: { dsFormGroup: { default: null } },
  props: {
    error: { type: Boolean, default: false },
    ariaLabel: { type: String, default: '' },
  },
  computed: {
    fieldRequired() {
      const explicit = this.required ?? this.$attrs.required;
      return explicit === undefined ? !!this.dsFormGroup?.required : explicit !== false && explicit !== null;
    },
    fieldInvalid() {
      return !!(this.error || this.errorMessage || this.dsFormGroup?.error)
    },
    fieldId() {
      return this.$attrs.id || this.dsFormGroup?.id || undefined
    },
    fieldLabelledby() {
      return this.$attrs['aria-labelledby'] || this.dsFormGroup?.labelId || undefined
    },
    fieldDescribedby() {
      const ids = [this.$attrs['aria-describedby'], this.dsFormGroup?.describedById]
      if (this.showFieldErrorMessage) ids.push(`input-error-${this._uid}`)
      return ids.filter(Boolean).join(' ') || undefined
    },
    showFieldErrorMessage() {
      return !!this.errorMessage && !this.dsFormGroup?.error
    },
    fieldSizeClass() {
      return `ds-field--${this.size || 'md'}`
    },
    fieldClasses() {
      return ['ds-field', this.fieldSizeClass, { 'ds-field--error': this.fieldInvalid }]
    },
  },
}
