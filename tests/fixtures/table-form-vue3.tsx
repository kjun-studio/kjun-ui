import { createApp, defineComponent, reactive } from "vue";
import { KjunProvider, KjunTable } from "@kjun-ui/vue3";
import { setRootValues } from "./style-values";
setRootValues();
// The Vue table form case from integration-contracts-vue2.ts: table controls inside a <form>.
const state = reactive({ submits: 0, selected: [] as object[] });
createApp(defineComponent(() => () => <KjunProvider>
  <form onSubmit={(event: Event) => { event.preventDefault(); state.submits++; }}>
    <KjunTable data={[{ id: 1, name: "One" }, { id: 2, name: "Two" }]} columns={[{ key: "name", label: "Name" }]}
      expandable selectable selected={state.selected} responsive="card" onUpdate:selected={(rows: object[]) => { state.selected = rows; }}>
      {{ expand: () => <span>Detail</span> }}
    </KjunTable>
    <button type="submit">Save</button>
  </form>
  <output data-testid="submits">{String(state.submits)}</output>
  <output data-testid="selected">{String(state.selected.length)}</output>
</KjunProvider>)).mount("#root");
