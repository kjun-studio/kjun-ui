import { createRoot } from "react-dom/client";
import { KjunProvider, KjunCombobox, KjunSelect, KjunSearchInput } from "@kjun-ui/native";
import { scopedColors } from "./style-values";
import { InputContracts } from "./review-input-contracts";
createRoot(document.getElementById("root")!).render(<KjunProvider colors={scopedColors(false)}>
  <InputContracts Combo={KjunCombobox} Select={KjunSelect} Search={KjunSearchInput} />
</KjunProvider>);
