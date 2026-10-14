import Vue from "vue";
import { KjunProvider, KjunButton, KjunModal, KjunInput } from "@kjun-ui/vue2";
import {
  scopedColors,
  scopedFont,
  cssValues,
  setRootValues,
} from "./style-values";
setRootValues();
if(location.search.includes("missing-role")) {
 document.documentElement.style.removeProperty("--kjun-focus-ring");
 Vue.config.errorHandler=(error)=>{(window as any).__roleError=error.message;};
}
Vue.config.productionTip = false;
new Vue({
  data: () => ({
    changed: false,
    open: location.search.includes("open"),
    innerOpen: false,
  }),
  render(h) {
    return h(KjunProvider, [
      h(KjunButton, "Outer button"),
      h(
        KjunProvider,
        {
          style: cssValues(
            scopedColors(this.changed),
            scopedFont(this.changed)
          ),
        },
        [
          h(
            KjunButton,
            {
              on: {
                click: () => {
                  this.open = true;
                },
              },
            },
            "Open scoped dialog"
          ),
          h(
            KjunModal,
            {
              props: {
                value: this.open,
                title: "Scoped dialog",
                showFooter: true,
                confirmText: "Confirm",
              },
              on: {
                input: (v: boolean) => {
                  this.open = v;
                },
                confirm: () => {
                  this.open = false;
                },
              },
            },
            [
              h(
                KjunButton,
                {
                  on: {
                    click: () => {
                      this.changed = !this.changed;
                    },
                  },
                },
                "Change scoped values"
              ),
              h(KjunInput, {
                props: {
                  ariaLabel: "Scoped input",
                  value: "example",
                  error: true,
                  errorMessage: "Project error",
                },
              }),
              h(
                KjunButton,
                {
                  on: {
                    click: () => {
                      this.innerOpen = true;
                    },
                  },
                },
                "Open inner dialog"
              ),
              h(
                KjunModal,
                {
                  props: { value: this.innerOpen, title: "Inner dialog" },
                  on: {
                    input: (v: boolean) => {
                      this.innerOpen = v;
                    },
                  },
                },
                [
                  h(
                    KjunButton,
                    {
                      on: {
                        click: () => {
                          this.innerOpen = false;
                        },
                      },
                    },
                    "Close inner dialog"
                  ),
                ]
              ),
            ]
          ),
        ]
      ),
    ]);
  },
}).$mount("#root");
