<template>
  <nav aria-label="경로" class="kj-flex kj-items-center kj-text-sm">
    <template v-for="(item, idx) in items">
      <DsIcon
        v-if="idx > 0"
        :key="`sep-${idx}`"
        name="chevron-right" size="var(--_kjun-extension-breadcrumb-separator-size)"
        class="kj-mx-2 kj-text-text-tertiary kj-text-xs"
      />

      <a
        v-if="item.to && idx < items.length - 1"
        :key="`link-${idx}`"
        :href="safeHref(item.to)" @click="$emit('navigate', item, $event)"
        class="kjun-breadcrumb-link kj-text-text-secondary hover:kj-text-brand kj-transition-colors"
      >
        <DsIcon v-if="item.icon" :name="item.icon" size="var(--_kjun-extension-breadcrumb-icon-size)" class="kj-mr-1" />
        {{ item.label }}
      </a>

      <span
        v-else
        :key="`text-${idx}`"
        :class="idx === items.length - 1 ? 'kj-text-text-primary kj-font-medium' : 'kj-text-text-secondary'"
      >
        <DsIcon v-if="item.icon" :name="item.icon" size="var(--_kjun-extension-breadcrumb-icon-size)" class="kj-mr-1" />
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
