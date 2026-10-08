import { defaultIcons, mergeIcons } from "../../../shared/package-runtime/icon-registry";
import { createVueLayerHost } from "./layer-host.js";
import { validateKjunCssScope } from '../../../shared/package-runtime/css-contract';
export const KjunProvider = {
  name: 'KjunProvider',
  inject: { parentIcons: { from: 'kjunIcons', default: null }, parentLayers: { from: 'kjunLayers', default: null }, parentFormatters: { from: 'kjunFormatters', default: null }, parentIdentity: { from: 'kjunRenderIdentity', default: null } },
  props: { icons: { type: Object, default: null }, formatters: { type: Object, default: () => ({}) }, renderIdentity: { type: Function, default: null } },
  data() { return { layerHost: createVueLayerHost(this.parentLayers) }; },
  computed: {
    iconRegistry() { return mergeIcons(this.parentIcons?.() || defaultIcons, this.icons); },
  },
  provide() {
    const self = this;
    return {
      kjunLayers: this.layerHost,
      kjunIcons: () => self.iconRegistry,
      kjunFormatters: new Proxy({}, { get(_, key) { return self.formatters[key] ?? self.parentFormatters?.[key]; } }),
      kjunRenderIdentity: (h, props, slots) => (self.renderIdentity || self.parentIdentity)?.(h, props, slots),
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
  render(h) { return h('div', { class: 'kjun-scope' }, [h('div', { ref: 'content', attrs: { 'data-kjun-content': '' } }, this.$slots.default), h('div', { ref: 'layers', attrs: { 'data-kjun-layer-host': '' } })]); },
};
