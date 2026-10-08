import DsIcon from "./icon.js";
export const ToastView = {
  name: "KjunToastView",
  props: { toast: Object, controller: Object },
  created() {
    this._pauseReasons = { hover: Symbol("hover"), focus: Symbol("focus") };
  },
  mounted() {
    this._previous = document.activeElement;
  },
  beforeDestroy() {
    this.controller.resumeToast(this.toast.id, this._pauseReasons.hover);
    this.controller.resumeToast(this.toast.id, this._pauseReasons.focus);
  },
  methods: {
    dismiss() {
      if (this._previous?.isConnected) this._previous.focus();
      this.controller.api.toast.dismiss(this.toast.id);
    },
  },
  render(h) {
    const t = this.toast,
      c = this.controller,
      tone = t.type === "error" ? "danger" : t.type || "info",
      icon = {
        success: "circle-check",
        danger: "alert-circle",
        warning: "alert-triangle",
        info: "info-circle",
      }[tone];
    return h(
      "div",
      {
        class: "kjun-toast",
        attrs: {
          "data-tone": tone,
          "data-title": !!t.title,
          role: "alert",
          "aria-live": tone === "danger" ? "assertive" : "polite",
        },
        on: {
          mouseenter: () => c.pauseToast(t.id, this._pauseReasons.hover),
          mouseleave: () => c.resumeToast(t.id, this._pauseReasons.hover),
          focusin: () => c.pauseToast(t.id, this._pauseReasons.focus),
          focusout: (event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              c.resumeToast(t.id, this._pauseReasons.focus);
          },
        },
      },
      [
        h(
          "span",
          {
            class: "kjun-toast-icon",
            style: { color: `var(--_kjun-color-${tone}-accent)` },
          },
          [h(DsIcon, { props: { name: icon } })]
        ),
        h("div", { class: "kjun-toast-content" }, [
          t.title && h("strong", t.title),
          h("span", { class: "kjun-toast-message" }, t.message),
          t.action &&
            h(
              "button",
              {
                class: "kjun-toast-action",
                attrs: { type: "button" },
                on: {
                  click: () => {
                    try {
                      t.action.onClick();
                    } finally {
                      this.dismiss();
                    }
                  },
                },
              },
              t.action.label
            ),
        ]),
        t.closable !== false &&
          h(
            "button",
            {
              class: "kjun-toast-close",
              attrs: { type: "button", "aria-label": "알림 닫기" },
              on: { click: this.dismiss },
            },
            [h(DsIcon, { props: { name: "x" } })]
          ),
        t.showProgress !== false &&
          t.duration > 0 &&
          h("div", {
            key: t.startedAt + ":" + t.paused,
            class: "kjun-toast-progress",
            attrs: { "aria-hidden": "true" },
            style: {
              "--toast-start": `${(t.remaining / t.duration) * 100}%`,
              animationDuration: `${t.remaining}ms`,
              animationPlayState: t.paused ? "paused" : "running",
              background: `var(--_kjun-color-${tone})`,
            },
          }),
      ]
    );
  },
};
