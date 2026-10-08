import { createRoot } from "react-dom/client";
import { KjunProvider, DsCombobox, DsSelect, DsSearchInput } from "@kjun-ui/react";
import { setRootValues } from "./style-values";
import { InputContracts } from "./review-input-contracts";
setRootValues();
createRoot(document.getElementById("root")!).render(<KjunProvider>
  <InputContracts Combo={DsCombobox} Select={DsSelect} Search={DsSearchInput} />
</KjunProvider>);
