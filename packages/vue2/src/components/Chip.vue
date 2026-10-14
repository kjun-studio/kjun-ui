<template>
  <span class="kjun-chip" :data-size="size" :data-disabled="String(disabled)" :data-removable="String(removable)"><KjunIcon v-if="icon" :name="icon" :size="`var(--_kjun-extension-chip-icon-sizes-${size})`" /><span>{{ label }}</span><button v-if="removable" type="button" :aria-label="removeLabel || label + ' 삭제'" :disabled="disabled" @click="$emit('remove')"><KjunIcon name="x" :size="`var(--_kjun-extension-chip-remove-icon-sizes-${size})`" /></button></span>
</template>
<script>
import KjunIcon from "../icon.js";
export default { name: "KjunChip", components: { KjunIcon }, props: { label: { type: String, required: true }, icon: String, removable: { type: Boolean, default: false }, disabled: { type: Boolean, default: false }, size: { type: String, default: "md", validator: v => ["sm", "md", "lg"].includes(v) }, removeLabel: String } };
</script>
