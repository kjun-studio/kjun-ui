import { createRoot } from "react-dom/client";
import { Text } from "react-native";
import { KjunProvider, KjunTable } from "@kjun-ui/native";
import { scopedColors } from "./style-values";
import { TableCase } from "./state-contracts-table";
createRoot(document.getElementById("root")!).render(<KjunProvider colors={scopedColors(false)}>
  <TableCase Control={KjunTable} detail={id => <Text>Detail {id}</Text>} />
</KjunProvider>);
