import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as K from "@kjun/react";
import { StateCases } from "./review-state-cases";
import { setRootValues } from "./style-values";
setRootValues();
createRoot(document.getElementById("root")!).render(<StrictMode><K.KjunProvider><StateCases K={K} /></K.KjunProvider></StrictMode>);
