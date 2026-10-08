import { createRoot } from "react-dom/client";
import { KjunProvider, DsCombobox, DsSelect, DsSearchInput } from "@kjun/native";
import { scopedColors } from "./style-values";
import { InputContracts } from "./review-input-contracts";
createRoot(document.getElementById("root")!).render(<KjunProvider colors={scopedColors(false)}>
  <InputContracts Combo={DsCombobox} Select={DsSelect} Search={DsSearchInput} />
</KjunProvider>);
