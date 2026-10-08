import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, DsButton, DsModal, DsInput } from "@kjun/react";
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
      <DsButton>Outer button</DsButton>
      <KjunProvider
        style={cssValues(scopedColors(changed), scopedFont(changed))}
      >
        <DsButton onClick={() => setOpen(true)}>Open scoped dialog</DsButton>
        <DsModal
          open={open}
          onOpenChange={setOpen}
          title="Scoped dialog"
          showFooter
          confirmText="Confirm"
          onConfirm={() => setOpen(false)}
        >
          <DsButton onClick={() => setChanged((v) => !v)}>
            Change scoped values
          </DsButton>
          <DsInput
            ariaLabel="Scoped input"
            value="example"
            onChange={() => {}}
            error
            errorMessage="Project error"
          />
          <DsButton onClick={() => setInnerOpen(true)}>
            Open inner dialog
          </DsButton>
          <DsModal
            open={innerOpen}
            onOpenChange={setInnerOpen}
            title="Inner dialog"
          >
            <DsButton onClick={() => setInnerOpen(false)}>
              Close inner dialog
            </DsButton>
          </DsModal>
        </DsModal>
      </KjunProvider>
    </KjunProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
