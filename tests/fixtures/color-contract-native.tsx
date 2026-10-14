import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunButton, KjunInput, KjunModal } from "@kjun-ui/native";
import { core, scoped } from "./color-contract-values";
function App() {
  const [state, setState] = useState({ changed: false, override: false, open: false });
  Object.assign(window, { configureFollowup: (next: Partial<typeof state>) => setState(old => ({ ...old, ...next })) });
  return <KjunProvider colors={core()}><KjunInput value="outer" ariaLabel="Outer input" readOnly />
    <KjunProvider colors={scoped(state.changed, state.override)}>
      <KjunInput value="scope" ariaLabel="Scoped input" readOnly />
      <KjunButton onPress={() => setState(old => ({ ...old, open: true }))}>Open dialog</KjunButton>
      <KjunModal open={state.open} onOpenChange={open => setState(old => ({ ...old, open }))} title="Core colors">
        <KjunInput value="dialog" ariaLabel="Dialog input" readOnly />
      </KjunModal>
    </KjunProvider>
  </KjunProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
