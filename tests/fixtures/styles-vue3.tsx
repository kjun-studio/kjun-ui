import { createApp, defineComponent, reactive } from "vue";
import { KjunProvider, KjunButton, KjunModal, KjunInput } from "@kjun-ui/vue3";
import { scopedColors, scopedFont, cssValues, setRootValues } from "./style-values";
setRootValues();
if (location.search.includes("missing-role")) document.documentElement.style.removeProperty("--kjun-focus-ring");
const state = reactive({ changed: false, open: location.search.includes("open"), innerOpen: false });
const app = createApp(defineComponent(() => () => (
  <KjunProvider>
    <KjunButton>Outer button</KjunButton>
    <KjunProvider style={cssValues(scopedColors(state.changed), scopedFont(state.changed))}>
      <KjunButton onClick={() => { state.open = true; }}>Open scoped dialog</KjunButton>
      <KjunModal open={state.open} onUpdate:open={(open: boolean) => { state.open = open; }} title="Scoped dialog" showFooter confirmText="Confirm"
        onConfirm={() => { state.open = false; }}>
        <KjunButton onClick={() => { state.changed = !state.changed; }}>Change scoped values</KjunButton>
        <KjunInput ariaLabel="Scoped input" modelValue="example" error errorMessage="Project error" />
        <KjunButton onClick={() => { state.innerOpen = true; }}>Open inner dialog</KjunButton>
        <KjunModal open={state.innerOpen} onUpdate:open={(open: boolean) => { state.innerOpen = open; }} title="Inner dialog">
          <KjunButton onClick={() => { state.innerOpen = false; }}>Close inner dialog</KjunButton>
        </KjunModal>
      </KjunModal>
    </KjunProvider>
  </KjunProvider>
)));
// Vue reports setup/lifecycle errors through the app error handler instead of an uncaught page error.
app.config.errorHandler = error => { (window as any).__roleError = (error as Error).message; };
app.mount("#root");
