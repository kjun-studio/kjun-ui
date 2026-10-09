<template>
  <nav aria-label="경로" class="flex items-center text-sm">
    <template v-for="(item, idx) in items">
      <DsIcon
        v-if="idx > 0"
        :key="`sep-${idx}`"
        name="chevron-right" size="var(--extension-breadcrumb-separator-size)"
        class="mx-2 text-text-tertiary text-xs"
      />

      <a
        v-if="item.to && idx < items.length - 1"
        :key="`link-${idx}`"
        :href="safeHref(item.to)" @click="$emit('navigate', item, $event)"
        class="ds-breadcrumb-link text-text-secondary hover:text-brand transition-colors"
      >
        <DsIcon v-if="item.icon" :name="item.icon" size="var(--extension-breadcrumb-icon-size)" class="mr-1" />
        {{ item.label }}
      </a>

      <span
        v-else
        :key="`text-${idx}`"
        :class="idx === items.length - 1 ? 'text-text-primary font-medium' : 'text-text-secondary'"
      >
        <DsIcon v-if="item.icon" :name="item.icon" size="var(--extension-breadcrumb-icon-size)" class="mr-1" />
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>

<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { safeLinkHref } from "../primitives/externalUrl";
export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsBreadcrumb',
  props: {
    items: {
      type: Array,
      required: true
      // [{ label: 'Home', to: '/', icon: 'home' }, { label: 'Current' }]
    }
  },
  methods: { safeHref: safeLinkHref }
}
</script>
