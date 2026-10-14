import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunCard, KjunButton, type KjunCardProps } from "@kjun-ui/react";
import { cardColors, cssValues } from "./card-colors-values";

function App() {
  const [surface, setSurface] = useState<KjunCardProps["surface"]>("default");
  const [changed, setChanged] = useState(false);
  const [override, setOverride] = useState(false);
  const [glass, setGlass] = useState(false);
  return <KjunProvider style={cssValues(cardColors(changed, override))}>
    <KjunButton onClick={() => setSurface(value => value === "default" ? "accent" : "default")}>Toggle accent</KjunButton>
    <KjunButton onClick={() => setSurface("subtle")}>Use subtle</KjunButton>
    <KjunButton onClick={() => setChanged(value => !value)}>Toggle colors</KjunButton>
    <KjunButton onClick={() => setOverride(value => !value)}>Toggle overrides</KjunButton>
    <KjunButton onClick={() => setGlass(value => !value)}>Toggle glass</KjunButton>
    <div data-testid="card" style={{ width: 320 }}>
      <KjunCard surface={glass ? "glass" : surface} border>Project card</KjunCard>
    </div>
  </KjunProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
