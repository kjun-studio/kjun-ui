import { createRoot } from "react-dom/client";
import { KjunProvider, KjunCombobox, KjunSelect, KjunSearchInput } from "@kjun-ui/react";
import { setRootValues } from "./style-values";
import { InputContracts } from "./review-input-contracts";
setRootValues();
createRoot(document.getElementById("root")!).render(<KjunProvider>
  <InputContracts Combo={KjunCombobox} Select={KjunSelect} Search={KjunSearchInput} />
</KjunProvider>);
