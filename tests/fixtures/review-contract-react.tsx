import { createRoot } from "react-dom/client";
import * as K from "@kjun/react";
import { ContractCases } from "./review-contract-cases";
import { setRootValues } from "./style-values";
setRootValues();
const content = <ContractCases K={K} />;
createRoot(document.getElementById("root")!).render(location.search.includes('unscoped') ? content : <K.KjunProvider>{content}</K.KjunProvider>);
