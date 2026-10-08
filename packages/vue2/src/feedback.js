import { tokens } from "@kjun-ui/tokens";
import { ToastStack } from "./toast-stack.js";
import { createFeedbackController } from "@kjun-ui/tokens";
import DsModal from "./source/layout/Modal.vue";
import DsInput from "./source/primitives/Input.vue";
export const KjunFeedbackProvider = {
  name: "KjunFeedbackProvider",
  data() {
    const controller = createFeedbackController();
    return {
      controller,
      snapshot: controller.getSnapshot(),
      presentedRequest: null,
      input: "",
      error: "",
      busy: false,
    };
  },
  provide() {
    return { kjunFeedback: this.controller.api };
  },
  created() {
    this._motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._motionChanged = () => { if (this._motionMedia.matches) { clearTimeout(this._requestExitTimer); this.adoptRequest(this.snapshot.current); } };
    this._motionMedia.addEventListener('change', this._motionChanged);
    this._unsubscribe = this.controller.subscribe(() => {
      this.snapshot = this.controller.getSnapshot();
      clearTimeout(this._requestExitTimer);
      if (!this.presentedRequest || this.presentedRequest.id === this.snapshot.current?.id || this._motionMedia.matches) {
        this.adoptRequest(this.snapshot.current);
      } else this._requestExitTimer = setTimeout(() => this.adoptRequest(this.snapshot.current), tokens.motion.layerExit);
    });
  },
  beforeDestroy() {
    clearTimeout(this._requestExitTimer);
    this._motionMedia.removeEventListener("change", this._motionChanged);
    this.controller.dispose();
    this._unsubscribe();
  },
  methods: {
    adoptRequest(request) {
      if (request?.id !== this.presentedRequest?.id) {
        this.input = request?.options.initialValue || ''; this.error = ''; this.busy = false;
      }
      this.presentedRequest = request;
    },
    cancel(request) {
      if (request.id === this.snapshot.current?.id && !this.busy)
        this.controller.settle(request.kind === "confirm" ? false : null, undefined, request.id);
    },
    async confirm(request) {
      // Bind each event to the request that rendered it, including during exit.
      if (request.id !== this.snapshot.current?.id || this.busy) return;
      if (request.kind === "prompt") {
        const valid = request.options.validator?.(this.input);
        if (valid === false || typeof valid === "string") {
          this.error =
            typeof valid === "string" ? valid : "입력 내용을 확인하세요.";
          return;
        }
        this.controller.settle(this.input, undefined, request.id);
        return;
      }
      this.busy = true;
      try {
        await request.options.onConfirm?.();
        this.controller.settle(true, undefined, request.id);
      } catch (error) {
        this.controller.settle(false, error, request.id);
      } finally {
        if (this.presentedRequest?.id === request.id) this.busy = false;
      }
    },
  },
  render(h) {
    const request = this.presentedRequest,
      options = request?.options || {};
    return h("div", { class: "kjun-feedback-scope" }, [
      this.$slots.default,
      h(ToastStack, { props: { toasts: this.snapshot.toasts, controller: this.controller } }),
      request &&
        h(
          DsModal,
          {
            key: request.id,
            props: {
              value: request.id === this.snapshot.current?.id,
              title:
                options.title || (request.kind === "prompt" ? "입력" : "확인"),
              showFooter: true,
              confirmText: options.confirmText || "확인",
              cancelText: options.cancelText || "취소",
              loading: this.busy,
              closable: !this.busy,
              closeOnEsc: !this.busy,
              closeOnOverlay: !this.busy,
              confirmVariant: options.type === "danger" ? "danger" : "primary",
            },
            on: {
              confirm: () => this.confirm(request),
              input: (value) => {
                if (!value) this.cancel(request);
              },
            },
          },
          [
            options.message && h("p", options.message),
            request.kind === "prompt" &&
              h(DsInput, {
                attrs: { autofocus: true },
                props: {
                  value: this.input,
                  placeholder: options.placeholder,
                  ariaLabel: options.title || "입력",
                  error: !!this.error,
                  errorMessage: this.error,
                },
                on: {
                  input: (value) => {
                    if (request.id !== this.snapshot.current?.id) return;
                    this.input = value;
                    this.error = "";
                  },
                  enter: () => this.confirm(request),
                },
              }),
          ]
        ),
    ]);
  },
};
export { feedbackMixin } from "./component-mixins.js";
