<template>
  <li class="kjun-list-row">
    <component :is="href ? 'a' : $listeners.click ? 'button' : 'div'" class="kjun-list-main" :href="disabled ? undefined : href" :type="!href && $listeners.click ? 'button' : undefined" :disabled="!href && $listeners.click ? disabled : undefined" :aria-disabled="href && disabled ? 'true' : undefined" @click="activate">
      <span v-if="$slots.leading" class="kjun-list-leading"><slot name="leading" /></span><span class="kjun-list-body"><span class="kjun-list-title">{{ title }}</span><span v-if="description" class="kjun-list-description">{{ description }}</span></span><span v-if="$slots.trailing" class="kjun-list-trailing"><slot name="trailing" /></span>
    </component>
    <div v-if="$slots.actions" class="kjun-list-actions" :data-disabled="disabled || undefined" :inert="disabled || undefined"><slot name="actions" /></div>
  </li>
</template>
<script>
export default {
  name: "DsListRow",
  props: { title: { type: String, required: true }, description: String, href: String, disabled: { type: Boolean, default: false } },
  methods: { activate(event) { if (this.disabled) { event.preventDefault(); return; } this.$emit("click", event); } },
};
</script>
