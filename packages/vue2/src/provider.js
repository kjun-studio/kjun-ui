import { defaultIcons, mergeIcons } from "../../../shared/package-runtime/icon-registry";
import { createVueLayerHost } from "./layer-host.js";
import { validateKjunCssScope } from '../../../shared/package-runtime/css-contract';
export const KjunProvider = {
  name: 'KjunProvider',
  inject: { kjunParentIcons: { from: 'kjunIcons', default: null }, kjunParentLayers: { from: 'kjunLayers', default: null }, kjunParentFormatters: { from: 'kjunFormatters', default: null }, kjunParentIdentity: { from: 'kjunRenderIdentity', default: null } },
  props: { icons: { type: Object, default: null }, formatters: { type: Object, default: () => ({}) }, renderIdentity: { type: Function, default: null } },
  data() { return { layerHost: createVueLayerHost(this.kjunParentLayers) }; },
  computed: {
    iconRegistry() { return mergeIcons(this.kjunParentIcons?.() || defaultIcons, this.icons); },
  },
  provide() {
    const self = this;
    return {
      kjunLayers: this.layerHost,
      kjunIcons: () => self.iconRegistry,
      kjunFormatters: new Proxy({}, { get(_, key) { return self.formatters[key] ?? self.kjunParentFormatters?.[key]; } }),
      kjunRenderIdentity: (h, props, slots) => (self.renderIdentity || self.kjunParentIdentity)?.(h, props, slots),
    };
  },
  mounted() {
    this.layerHost.mount(this.$el, this.$refs.content, this.$refs.layers, () => {
      let ancestor = this.$parent;
      while (ancestor && !this.layerHost.state.entries.has(ancestor._kjunLayerId)) ancestor = ancestor.$parent;
      return ancestor?._kjunLayerId;
    });
    this.validateColorRoles();
  },
  beforeDestroy() { this.layerHost.destroy(); },
  updated() { this.validateColorRoles(); },
  methods: {
    validateColorRoles() {
      validateKjunCssScope(this.$el);
    },
  },
  render(h) { return h('div', { class: 'kjun-scope' }, [h('div', { ref: 'content', attrs: { 'data-kjun-content': '' } }, this.$slots.default), h('div', { ref: 'layers', class: 'kjun-layers', attrs: { 'data-kjun-layer-host': '' } })]); },
};
