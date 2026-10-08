import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as K from "@kjun/native";
import { StateCases } from "./review-state-cases";
import { appColors, setRootValues } from "./style-values";
setRootValues();
createRoot(document.getElementById("root")!).render(<StrictMode><K.KjunProvider colors={appColors}><StateCases K={K} native /></K.KjunProvider></StrictMode>);
