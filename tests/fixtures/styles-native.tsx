import { Component, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, DsButton, DsModal, DsInput, DsSignedValue } from "@kjun-ui/native";
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
  if (location.search.includes("missing-domain"))return <KjunProvider colors={appColors}><DsSignedValue value={2}/></KjunProvider>;
  if (location.search.includes("partial-domain"))return <KjunProvider colors={appColors} domainColors={{priceUp: 'red'} as any}><DsSignedValue value={2}/></KjunProvider>;
  if (location.search.includes("missing-provider"))
    return <DsButton>Missing</DsButton>;
  if (location.search.includes("missing-colors"))
    return (
      <KjunProvider colors={{ brand: "red" } as any}>
        <DsButton>Missing</DsButton>
      </KjunProvider>
    );
  return (
    <KjunProvider colors={appColors} fontFamily={scopedFont(changed)}>
      <DsButton>Outer button</DsButton>
      <KjunProvider colors={scopedColors(changed)}>
        <DsButton onPress={() => setOpen(true)}>Open scoped dialog</DsButton>
        <DsModal
          open={open}
          onOpenChange={setOpen}
          title="Scoped dialog"
          showFooter
          confirmText="Confirm"
          onConfirm={() => setOpen(false)}
        >
          <DsButton onPress={() => setChanged((v) => !v)}>
            Change scoped values
          </DsButton>
          <DsInput
            ariaLabel="Scoped input"
            value="example"
            onChangeText={() => {}}
            error
            errorMessage="Project error"
          />
        </DsModal>
      </KjunProvider>
    </KjunProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>
);
