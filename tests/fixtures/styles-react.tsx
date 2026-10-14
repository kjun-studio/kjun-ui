import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunButton, KjunModal, KjunInput } from "@kjun-ui/react";
import {
  scopedColors,
  scopedFont,
  cssValues,
  setRootValues,
} from "./style-values";
setRootValues();
if(location.search.includes("missing-role"))document.documentElement.style.removeProperty("--kjun-focus-ring");
function App() {
  const [changed, setChanged] = useState(false);
  const [open, setOpen] = useState(location.search.includes("open"));
  const [innerOpen, setInnerOpen] = useState(false);
  return (
    <KjunProvider>
      <KjunButton>Outer button</KjunButton>
      <KjunProvider
        style={cssValues(scopedColors(changed), scopedFont(changed))}
      >
        <KjunButton onClick={() => setOpen(true)}>Open scoped dialog</KjunButton>
        <KjunModal
          open={open}
          onOpenChange={setOpen}
          title="Scoped dialog"
          showFooter
          confirmText="Confirm"
          onConfirm={() => setOpen(false)}
        >
          <KjunButton onClick={() => setChanged((v) => !v)}>
            Change scoped values
          </KjunButton>
          <KjunInput
            ariaLabel="Scoped input"
            value="example"
            onChange={() => {}}
            error
            errorMessage="Project error"
          />
          <KjunButton onClick={() => setInnerOpen(true)}>
            Open inner dialog
          </KjunButton>
          <KjunModal
            open={innerOpen}
            onOpenChange={setInnerOpen}
            title="Inner dialog"
          >
            <KjunButton onClick={() => setInnerOpen(false)}>
              Close inner dialog
            </KjunButton>
          </KjunModal>
        </KjunModal>
      </KjunProvider>
    </KjunProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
