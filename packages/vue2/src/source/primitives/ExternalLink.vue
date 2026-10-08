<template>
  <component :is="url ? 'a' : 'span'" :href="url || undefined" :target="url ? '_blank' : undefined"
    :rel="url ? 'noopener noreferrer' : undefined" :class="url ? 'kjun-external-link' : undefined" :aria-label="accessibleLabel"
    :title="accessibleLabel" @click.stop>
    <template v-if="mode === 'icon'"><DsIcon name="external-link" /></template>
    <slot v-else />
    <DsIcon v-if="url && mode === 'text'" name="external-link" :size="iconSize" class="kjun-external-link-icon" />
    <span v-if="url && mode === 'text' && !label && !$attrs['aria-label']" class="sr-only"> (새 창)</span>
  </component>
</template>
<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { tokens } from '@kjun-ui/tokens'
import { safeExternalUrl } from './externalUrl'
import { oneOf, ACTION_LABEL_MODES } from '../tokens'
export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsExternalLink',
  props: {
    href: { type: String, default: '' },
    mode: { type: String, default: 'text', validator: oneOf(ACTION_LABEL_MODES) },
    label: { type: String, default: '' },
  },
  computed: {
    iconSize() { return String(tokens.iconSizes.small) },
    url() { return safeExternalUrl(this.href) },
    accessibleLabel() {
      const label = this.label || this.$attrs['aria-label']
      return label ? label + (this.url ? ' (새 창)' : '') : this.mode === 'icon' ? '외부 링크' + (this.url ? ' (새 창)' : '') : undefined
    },
  },
}
</script>
