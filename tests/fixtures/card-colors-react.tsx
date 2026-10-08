import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, DsCard, DsButton, type DsCardProps } from "@kjun-ui/react";
import { cardColors, cssValues } from "./card-colors-values";

function App() {
  const [surface, setSurface] = useState<DsCardProps["surface"]>("default");
  const [changed, setChanged] = useState(false);
  const [override, setOverride] = useState(false);
  const [glass, setGlass] = useState(false);
  return <KjunProvider style={cssValues(cardColors(changed, override))}>
    <DsButton onClick={() => setSurface(value => value === "default" ? "accent" : "default")}>Toggle accent</DsButton>
    <DsButton onClick={() => setSurface("subtle")}>Use subtle</DsButton>
    <DsButton onClick={() => setChanged(value => !value)}>Toggle colors</DsButton>
    <DsButton onClick={() => setOverride(value => !value)}>Toggle overrides</DsButton>
    <DsButton onClick={() => setGlass(value => !value)}>Toggle glass</DsButton>
    <div data-testid="card" style={{ width: 320 }}>
      <DsCard surface={glass ? "glass" : surface} border>Project card</DsCard>
    </div>
  </KjunProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
