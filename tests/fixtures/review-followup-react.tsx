import { createRoot } from "react-dom/client";
import { KjunProvider, KjunSearchInput, KjunPagination } from "@kjun-ui/react";
import { setRootValues } from "./style-values";
import { SearchCase, PaginationCase } from "./review-followup-cases";
setRootValues();
createRoot(document.getElementById("root")!).render(<KjunProvider>
  {location.search.includes("pagination") ? <PaginationCase Control={KjunPagination} /> : <SearchCase Control={KjunSearchInput} />}
</KjunProvider>);
