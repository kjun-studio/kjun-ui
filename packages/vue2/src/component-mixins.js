import { layerMixin } from "./layer-host.js";
import { formatterMixin } from "./adapters/formatters.js";

// Preserve existing formatter/feedback injection without importing the feedback UI.
export const feedbackMixin = {
  inject: { kjunFeedback: { default: null } },
  computed: {
    $toast() {
      return this.kjunFeedback?.toast || {
        success() {}, error() {}, warning() {}, info() {},
      };
    },
  },
};
export const componentMixins = [formatterMixin, feedbackMixin, layerMixin];
