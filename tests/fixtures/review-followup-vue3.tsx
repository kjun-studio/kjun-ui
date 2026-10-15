import { createApp, defineComponent, reactive } from "vue";
import { KjunProvider, KjunTabs, KjunTabPane, KjunPagination, KjunSearchInput } from "@kjun-ui/vue3";
import { setRootValues } from "./style-values";
setRootValues();
const s = reactive({ value: location.search.includes("search") ? "initial" : "a", disabled: false, label: "Second", badge: 1, name: "b", mounted: true,
  size: 10, page: 2, total: 30, showSizeSelector: true, showInfo: true, debounce: 1000, handler: "first", events: [] as string[] });
Object.assign(window, { configureFollowup: (next: object) => Object.assign(s, next) });
createApp(defineComponent(() => () => {
  if (location.search.includes("search")) return <KjunProvider>
    {s.mounted && <KjunSearchInput modelValue={s.value} disabled={s.disabled} debounce={s.debounce} ariaLabel="검색"
      onUpdate:modelValue={(value: string) => { s.events = [...s.events, `${s.handler}:${value}`]; s.value = value; }} />}
    <output data-testid="model">{s.value}</output>
    <output data-testid="events">{JSON.stringify(s.events)}</output>
  </KjunProvider>;
  if (location.search.includes("pagination")) return <KjunProvider>
    <KjunPagination totalPages={Math.ceil(s.total / s.size)} totalRows={s.total} page={s.page} pageSize={s.size}
      showSizeSelector={s.showSizeSelector} showInfo={s.showInfo} onUpdate:pageSize={(size: number) => { s.size = size; }} onUpdate:page={(page: number) => { s.page = page; }} />
    <output data-testid="model">{s.size}:{s.page}</output>
  </KjunProvider>;
  return <KjunProvider>
    <KjunTabs modelValue={s.value} onUpdate:modelValue={(value: string) => { s.value = value; }}>
      <KjunTabPane key="a" name="a" label="First">first panel</KjunTabPane>
      {s.mounted && <KjunTabPane key="b" name={s.name} label={s.label} badge={s.badge} disabled={s.disabled}>second panel</KjunTabPane>}
    </KjunTabs>
    <output data-testid="model">{s.value}</output>
  </KjunProvider>;
})).mount("#root");
