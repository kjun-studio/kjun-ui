import { Component, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunButton, KjunModal, KjunInput, KjunSignedValue } from "@kjun-ui/native";
import { appColors, scopedColors, scopedFont } from "./style-values";

class Boundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <p role="alert">{this.state.error}</p>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [changed, setChanged] = useState(false);
  const [open, setOpen] = useState(location.search.includes("open"));
  if (location.search.includes("missing-domain"))return <KjunProvider colors={appColors}><KjunSignedValue value={2}/></KjunProvider>;
  if (location.search.includes("partial-domain"))return <KjunProvider colors={appColors} domainColors={{priceUp: 'red'} as any}><KjunSignedValue value={2}/></KjunProvider>;
  if (location.search.includes("missing-provider"))
    return <KjunButton>Missing</KjunButton>;
  if (location.search.includes("missing-colors"))
    return (
      <KjunProvider colors={{ brand: "red" } as any}>
        <KjunButton>Missing</KjunButton>
      </KjunProvider>
    );
  return (
    <KjunProvider colors={appColors} fontFamily={scopedFont(changed)}>
      <KjunButton>Outer button</KjunButton>
      <KjunProvider colors={scopedColors(changed)}>
        <KjunButton onPress={() => setOpen(true)}>Open scoped dialog</KjunButton>
        <KjunModal
          open={open}
          onOpenChange={setOpen}
          title="Scoped dialog"
          showFooter
          confirmText="Confirm"
          onConfirm={() => setOpen(false)}
        >
          <KjunButton onPress={() => setChanged((v) => !v)}>
            Change scoped values
          </KjunButton>
          <KjunInput
            ariaLabel="Scoped input"
            value="example"
            onChangeText={() => {}}
            error
            errorMessage="Project error"
          />
        </KjunModal>
      </KjunProvider>
    </KjunProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>
);
