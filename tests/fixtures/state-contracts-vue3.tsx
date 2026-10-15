import { createApp, defineComponent, reactive, ref } from 'vue';
import { KjunProvider, KjunModal, KjunTable, KjunButton, KjunDropdown, KjunDropdownItem, KjunMenuButton, KjunTooltip } from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const tableRows = [{ id: 2, name: 'Two' }, { id: 0, name: 'Zero' }, { id: 1, name: 'One' }];
const ModalCase = defineComponent(() => {
  const config = reactive({ open: true, ariaLabel: 'Custom dialog', title: '', showHeader: true, customHeader: false });
  Object.assign(window, { configureState: (next: Partial<typeof config>) => Object.assign(config, next) });
  return () => {
    const { customHeader, ...props } = config;
    return <KjunModal {...props} onUpdate:open={(open: boolean) => { config.open = open; }}>
      {{ default: () => 'Dialog body', ...(customHeader ? { header: () => <span>Custom heading</span> } : {}) }}
    </KjunModal>;
  };
});
const MenuCase = defineComponent(() => {
  const config = reactive({ kind: 'button', disabled: false, triggerId: '', tooltip: false });
  const chosen = ref(0), clicks = ref(0);
  Object.assign(window, { configureState: (next: Partial<typeof config>) => Object.assign(config, next) });
  return () => {
    const items = () => <KjunDropdownItem onClick={() => chosen.value++}>Choose item</KjunDropdownItem>;
    const props = { disabled: config.disabled, triggerId: config.triggerId || undefined, menuId: 'choices' };
    const click = () => clicks.value++;
    let trigger = config.kind === 'native' || config.kind === 'custom'
      ? <button id="existing-trigger" onClick={click}>Open menu</button>
      : <KjunButton id="existing-trigger" onClick={click}>Open menu</KjunButton>;
    if (config.tooltip) trigger = <KjunTooltip content="Menu help">{trigger}</KjunTooltip>;
    return <>
      {config.kind === 'menu-button'
        ? <KjunMenuButton {...props} label="Open menu" tooltip={config.tooltip ? 'Menu help' : undefined}>{items()}</KjunMenuButton>
        : <KjunDropdown {...props}>{{ trigger: () => trigger, default: items }}</KjunDropdown>}
      <output data-testid="chosen">{chosen.value}</output>
      <output data-testid="clicks">{clicks.value}</output>
    </>;
  };
});
const TableCase = defineComponent(() => {
  const config = reactive({ expanded: [] as number[], controlled: true, accept: true, single: false });
  const events = ref<number[][]>([]);
  Object.assign(window, { configureState: (next: Partial<typeof config>) => Object.assign(config, next) });
  return () => <>
    <KjunTable data={tableRows} columns={[{ key: 'name', label: 'Name' }]} responsive="card" expandable
      expandedRows={config.controlled ? config.expanded : undefined} expandSingle={config.single}
      onUpdate:expandedRows={(expanded: any[]) => { events.value.push(expanded); if (config.accept) config.expanded = expanded; }}>
      {{ expand: ({ row }: any) => <span>Detail {row.id}</span> }}
    </KjunTable>
    <output data-testid="expanded">{JSON.stringify(config.expanded)}</output>
    <output data-testid="events">{JSON.stringify(events.value)}</output>
  </>;
});
createApp(defineComponent(() => () => <KjunProvider>
  {location.search.includes('table') ? <TableCase /> : location.search.includes('menu') ? <MenuCase /> : <ModalCase />}
</KjunProvider>)).mount('#root');
