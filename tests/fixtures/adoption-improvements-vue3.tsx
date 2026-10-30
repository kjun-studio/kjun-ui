import { createApp, defineComponent, nextTick, reactive, ref, withModifiers } from 'vue';
import { KjunProvider, KjunButton, KjunTabs, KjunTabPane, KjunKpiRow, KjunProgress, KjunDropdown,
  KjunDropdownItem, KjunMenuButton, KjunSelect, KjunPopover, KjunTooltip, KjunCopyButton,
  KjunSlider, KjunRangeSlider, KjunTable } from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
import { domainColorRoles } from '@kjun-ui/tokens';
setRootValues();
for (const role of domainColorRoles) document.documentElement.style.setProperty('--kjun-' + role.replace(/[A-Z]/g, value => '-' + value.toLowerCase()), '#345678');
const params = new URLSearchParams(location.search), scenario = params.get('scenario');
const config = reactive({ open: params.has('controlled') ? false : undefined as boolean | undefined,
  accept: true, disabled: false, loading: false, showValue: true, format: false,
  value: null as number | null, max: 100, indeterminate: false, sticky: true, prevent: false, styled: true });
const events = ref<unknown[]>([]), value = ref(20), range = ref<[number, number]>([20, 80]), tab = ref('first');
const record = (type: string, detail?: unknown) => events.value.push([type, detail ?? null]);
const updateOpen = (open: boolean) => { record('request', open); if (config.accept && config.open !== undefined) config.open = open; };
const action = withModifiers((event: MouseEvent | KeyboardEvent) => record('item', { type: event.type, key: 'key' in event ? event.key : null }), ['stop']);
document.addEventListener('click', event => { if ((event.target as Element).closest('[role="menuitem"]')) record('bubbled'); });
document.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key) && (event.target as Element).closest('[role="menuitem"]')) record('bubbled-key'); });
Object.assign(window, {
  configure: async (next: object) => { Object.assign(config, next); await nextTick(); },
  resetEvents: () => { events.value = []; },
  reopen: async () => { config.open = false; await nextTick(); config.open = true; await nextTick(); },
});
const items = () => <>
  <KjunDropdownItem onClick={action}>First action</KjunDropdownItem>
  <KjunDropdownItem onClick={action} disabled>Disabled action</KjunDropdownItem>
  <KjunDropdownItem onClick={action}>Last action</KjunDropdownItem>
</>;
const rows = [{ id: 'first', amount: 7 }], selected = ref<typeof rows>([]);
createApp(defineComponent(() => () => <KjunProvider>
  <main style={{ padding: '24px', maxWidth: '600px' }}>
    <button data-testid="outside">Outside</button>
    {(scenario === 'dropdown' || scenario === 'menu-button') && <div>
      {scenario === 'dropdown' ? <KjunDropdown open={config.open} disabled={config.disabled} onUpdate:open={updateOpen}
        class="custom-dropdown" style={{ marginTop: '9px' }} data-owner="dropdown" menuClass="custom-menu"
        onOpen={() => record('open')} onClose={() => record('close')}>
        {{ trigger: () => <KjunButton loading={config.loading}>Actions</KjunButton>, default: items }}
      </KjunDropdown> : <KjunMenuButton label="Actions" open={config.open} disabled={config.disabled} loading={config.loading}
        tooltip="Menu hint" class="custom-menu-button" onUpdate:open={updateOpen} onOpen={() => record('open')} onClose={() => record('close')}>
        {{ default: items }}
      </KjunMenuButton>}
    </div>}
    {scenario === 'attrs' && <div style={{ display: 'grid', gap: '12px' }}>
      <KjunSelect modelValue={null} options={[{ value: 'one', label: 'One' }]} class="custom-select" style={{ width: '180px' }}
        aria-label="Custom select" aria-describedby="extra-description" data-owner="select" onFocus={() => record('select-focus')} />
      <p id="extra-description">Extra description</p>
      <KjunPopover class="custom-popover-trigger" style={{ marginTop: '7px' }} panelClass="custom-popover-panel" panelStyle={config.styled ? { width: '210px' } : false}>
        {{ trigger: () => <KjunButton>Popover</KjunButton>, default: () => <p>Panel content</p> }}
      </KjunPopover>
      <KjunTooltip content="Tooltip content" class="custom-tooltip-trigger" style={{ marginLeft: '11px' }} data-owner="tooltip"
        panelClass="custom-tooltip-panel" panelStyle={config.styled ? { maxWidth: '180px' } : false} aria-describedby="extra-description" onFocus={() => record('tooltip-focus')}>
        <KjunButton class="original-trigger">Tooltip</KjunButton>
      </KjunTooltip>
      <KjunCopyButton value="copy me" text="Copy" class="custom-copy" style={{ width: '190px' }} data-owner="copy"
        onClick={(event: MouseEvent) => { record('copy-click'); if (config.prevent) event.preventDefault(); }}
        copyText={text => record('copied', text)} />
    </div>}
    {scenario === 'anchor' && <KjunPopover open={!!config.open} onUpdate:open={updateOpen} anchorRect={{ x: 80, y: 80 }}
      ariaLabel="Anchored" class="custom-anchor-panel" style={{ width: '220px' }} data-owner="anchor"
      onKeydown={() => record('anchor-key')}>
      <button>Inside anchor</button>
    </KjunPopover>}
    {scenario === 'values' && <div>
      <KjunKpiRow items={[
        { label: 'Loading', value: undefined, loading: config.loading, badge: null, semantic: 'price' },
        { label: 'Missing', value: config.value, semantic: 'price', prefix: '$', suffix: '%', formatter: number => { if (!Number.isFinite(number)) throw Error('Invalid formatter input'); return String(number); } },
        { label: 'Invalid', value: NaN, semantic: 'price', animated: true },
        { label: 'Zero', value: 0, badge: { text: '0' } },
      ]} />
      {(['bar', 'circle'] as const).map(shape => <section data-testid={shape}>
        <KjunProgress value={config.value} max={config.max} indeterminate={config.indeterminate} label="Progress" shape={shape} showLabel size="lg" />
        <KjunProgress label="Default zero" shape={shape} showLabel size="lg" />
      </section>)}
    </div>}
    {scenario === 'tabs' && <div data-testid="scroll" style={{ height: '240px', overflow: 'auto' }}>
      <div style={{ height: '40px' }} />
      <KjunTabs modelValue={tab.value} onUpdate:modelValue={next => { tab.value = next; }} stickyHeader={config.sticky} stickyOffset={12}>
        <KjunTabPane name="first" label="First" badge={null}><div style={{ height: '650px' }}>First panel</div></KjunTabPane>
        <KjunTabPane name="second" label="Second" badge={0}><div style={{ height: '650px' }}>Second panel</div></KjunTabPane>
      </KjunTabs>
      <div style={{ height: '300px' }} />
    </div>}
    {scenario === 'slider' && <div>
      <KjunSlider modelValue={value.value} onUpdate:modelValue={next => { value.value = next as number; }} onChange={next => record('commit', next)}
        ariaLabel="Amount" showValue={config.showValue} formatValue={config.format ? number => `${number}%` : undefined} />
      <KjunRangeSlider modelValue={range.value} onUpdate:modelValue={next => { range.value = next as [number, number]; }}
        label="Range" showValue={config.showValue} formatValue={config.format ? number => `$${number}` : undefined} />
    </div>}
    {scenario === 'table' && <KjunTable data={rows} columns={[{ key: 'amount', label: 'Amount' }]} selected={selected.value}
      onUpdate:selected={next => { selected.value = next; }} selectable expandable>
      {{ cell: ({ row }) => `Cell ${row.amount}`, expand: ({ row }) => `Expand ${row.amount}`,
        selectionToolbar: ({ selected: chosen }) => `Selected ${chosen[0].amount}` }}
    </KjunTable>}
    <pre data-testid="events">{JSON.stringify(events.value)}</pre>
  </main>
</KjunProvider>)).mount('#root');
