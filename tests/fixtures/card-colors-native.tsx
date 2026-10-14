import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunCard, KjunButton, type KjunCardProps } from "@kjun-ui/native";
import { cardColors } from "./card-colors-values";

function App() {
  const [surface, setSurface] = useState<KjunCardProps["surface"]>("default");
  const [changed, setChanged] = useState(false);
  const [override, setOverride] = useState(false);
  const [glass, setGlass] = useState(false);
  return <KjunProvider colors={cardColors(changed, override)}>
    <KjunButton onPress={() => setSurface(value => value === "default" ? "accent" : "default")}>Toggle accent</KjunButton>
    <KjunButton onPress={() => setSurface("subtle")}>Use subtle</KjunButton>
    <KjunButton onPress={() => setChanged(value => !value)}>Toggle colors</KjunButton>
    <KjunButton onPress={() => setOverride(value => !value)}>Toggle overrides</KjunButton>
    <KjunButton onPress={() => setGlass(value => !value)}>Toggle glass</KjunButton>
    <div data-testid="card" style={{ width: 320 }}>
      <KjunCard surface={glass ? "glass" : surface} border>Project card</KjunCard>
    </div>
  </KjunProvider>;
}
createRoot(document.getElementById("root")!).render(<App />);
