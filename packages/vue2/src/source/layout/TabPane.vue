<template>
  <div
    v-show="isActive"
    :id="'kjun-tabpanel-' + kjunTabs._uid + '-' + name"
    role="tabpanel"
    :tabindex="panelTabIndex"
    :aria-labelledby="'kjun-tab-' + kjunTabs._uid + '-' + name"
  >
    <slot></slot>
  </div>
</template>

<script>
import { panelNeedsFocus } from "../../../../../shared/package-runtime/tab-keyboard";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  name: 'KjunTabPane',
  inject: ['kjunTabs'],
  props: {
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: null
    },
    badge: {
      type: [String, Number],
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() { return { panelTabIndex: 0 } },
  updated() { this.updatePanelFocus() },
  methods: { updatePanelFocus() { if (this.isActive) this.panelTabIndex = panelNeedsFocus(this.$el) ? 0 : -1 } },
  computed: {
    registration() {
      return { registrationId: this._uid, name: this.name, label: this.label, icon: this.icon, badge: this.badge, disabled: this.disabled }
    },
    isActive() {
      return this.kjunTabs.value === this.name
    }
  },
  watch: {
    registration(tab) {
      this.kjunTabs.updateTab(tab)
    }
  },
  mounted() {
    this.kjunTabs.registerTab(this.registration)
    this.updatePanelFocus()
  },
  beforeDestroy() {
    this.kjunTabs.unregisterTab(this._uid)
  }
}
</script>
