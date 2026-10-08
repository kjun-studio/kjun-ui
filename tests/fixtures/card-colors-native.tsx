import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, DsCard, DsButton, type DsCardProps } from "@kjun/native";
import { cardColors } from "./card-colors-values";

function App() {
  const [surface, setSurface] = useState<DsCardProps["surface"]>("default");
  const [changed, setChanged] = useState(false);
  const [override, setOverride] = useState(false);
  const [glass, setGlass] = useState(false);
  return <KjunProvider colors={cardColors(changed, override)}>
    <DsButton onPress={() => setSurface(value => value === "default" ? "accent" : "default")}>Toggle accent</DsButton>
    <DsButton onPress={() => setSurface("subtle")}>Use subtle</DsButton>
    <DsButton onPress={() => setChanged(value => !value)}>Toggle colors</DsButton>
    <DsButton onPress={() => setOverride(value => !value)}>Toggle overrides</DsButton>
    <DsButton onPress={() => setGlass(value => !value)}>Toggle glass</DsButton>
    <div data-testid="card" style={{ width: 320 }}>
      <DsCard surface={glass ? "glass" : surface} border>Project card</DsCard>
    </div>
  </KjunProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
