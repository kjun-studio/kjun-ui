import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, DsButton, DsInput, DsModal } from "@kjun-ui/react";
import { scoped, rootValues, cssValues } from "./color-contract-values";
rootValues();
function App() {
  const [state, setState] = useState({ changed: false, override: false, open: false });
  Object.assign(window, { configureFollowup: (next: Partial<typeof state>) => setState(old => ({ ...old, ...next })) });
  return <KjunProvider><DsInput value="outer" ariaLabel="Outer input" readOnly />
    <KjunProvider style={cssValues(scoped(state.changed, state.override))}>
      <DsInput value="scope" ariaLabel="Scoped input" readOnly />
      <DsButton onClick={() => setState(old => ({ ...old, open: true }))}>Open dialog</DsButton>
      <DsModal open={state.open} onOpenChange={open => setState(old => ({ ...old, open }))} title="Core colors">
        <DsInput value="dialog" ariaLabel="Dialog input" readOnly />
      </DsModal>
    </KjunProvider>
  </KjunProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
