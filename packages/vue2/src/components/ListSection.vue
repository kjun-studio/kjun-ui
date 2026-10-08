<template>
  <section class="kjun-list-section" :aria-labelledby="title ? 'list-heading-' + _uid : undefined" :aria-label="title ? undefined : ariaLabel">
    <div v-if="title || description || $slots.actions" class="kjun-list-heading"><div><h3 v-if="title" :id="'list-heading-' + _uid">{{ title }}</h3><p v-if="description">{{ description }}</p></div><slot name="actions" /></div>
    <ul class="kjun-list" :aria-label="ariaLabel || title"><slot /></ul>
  </section>
</template>
<script>
export default { name: "DsListSection", props: { title: String, description: String, ariaLabel: String } };
</script>
