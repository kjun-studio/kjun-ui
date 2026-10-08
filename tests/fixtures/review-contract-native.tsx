import { createRoot } from "react-dom/client";
import * as K from "@kjun/native";
import { ContractCases } from "./review-contract-cases";
import { appColors, setRootValues } from "./style-values";
setRootValues();
createRoot(document.getElementById("root")!).render(<K.KjunProvider colors={{ ...appColors, danger: "#aa1234" }}><ContractCases K={K} native /></K.KjunProvider>);
