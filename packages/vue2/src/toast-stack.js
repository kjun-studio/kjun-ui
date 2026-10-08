import { layerMixin } from "./layer-host.js";
import { ToastView } from './toast.js';
import { layerMotion } from './adapters/layer-motion.js';

export const ToastStack = {
  name: 'KjunToastStack',
  mixins: [layerMixin, /* @__PURE__ */ layerMotion('toast')],
  props: { toasts: Array, controller: Object },
  methods: {
    leaveToast(el, done) {
      const parent = el.parentElement;
      parent.style.minHeight = parent.offsetHeight + 'px';
      parent.style.minWidth = parent.offsetWidth + 'px';
      Object.assign(el.style, { position: 'absolute', top: el.offsetTop + 'px', left: el.offsetLeft + 'px', width: el.offsetWidth + 'px' });
      this.motionLeave(el, done);
    },
    afterToastLeave() {
      this.$el.style.minHeight = ''; this.$el.style.minWidth = '';
    },
  },
  render(h) {
    return h('transition-group', {
      directives: [{ name: 'kjun-layer', value: 'toast' }],
      class: 'kjun-toast-stack', props: { tag: 'div', css: false, moveClass: 'kjun-toast-move' },
      on: { beforeEnter: this.motionPrepare, enter: this.motionEnter, leave: this.leaveToast,
        enterCancelled: this.motionCancel, leaveCancelled: this.motionCancel, afterLeave: this.afterToastLeave },
    }, this.toasts.map(toast => h(ToastView, { key: toast.id, props: { toast, controller: this.controller } })));
  },
};
