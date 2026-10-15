import { createApp, defineComponent, reactive } from "vue";
import { KjunProvider, KjunButton, KjunInput, KjunModal } from "@kjun-ui/vue3";
import { scoped, rootValues, cssValues } from "./color-contract-values";
rootValues();
const state = reactive({ changed: false, override: false, open: false });
Object.assign(window, { configureFollowup: (next: Partial<typeof state>) => Object.assign(state, next) });
createApp(defineComponent(() => () => <KjunProvider>
  <KjunInput modelValue="outer" ariaLabel="Outer input" readOnly />
  <KjunProvider style={cssValues(scoped(state.changed, state.override))}>
    <KjunInput modelValue="scope" ariaLabel="Scoped input" readOnly />
    <KjunButton onClick={() => { state.open = true; }}>Open dialog</KjunButton>
    <KjunModal open={state.open} onUpdate:open={(open: boolean) => { state.open = open; }} title="Core colors">
      <KjunInput modelValue="dialog" ariaLabel="Dialog input" readOnly />
    </KjunModal>
  </KjunProvider>
</KjunProvider>)).mount("#root");
