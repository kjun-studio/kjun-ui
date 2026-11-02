import { createApp, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { thumbColor, trackColor } from './additions-cases';
applyDemoColors('default');
const date = ref('2026-10-23'), saving = ref(false), presses = ref(0);
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
  <div data-testid="switch-thumb">
    <div style={{ '--kjun-switch-thumb-on': thumbColor }}><K.KjunProvider><K.KjunSwitch modelValue label="Themed thumb" /></K.KjunProvider></div>
    <K.KjunProvider><K.KjunSwitch modelValue label="Default thumb" /></K.KjunProvider>
  </div>
  <div data-testid="switch-track"><div style={{ '--kjun-switch-track': trackColor }}><K.KjunProvider><K.KjunSwitch modelValue={false} label="Track" /></K.KjunProvider></div></div>
  <K.KjunProvider><div data-testid="switch-saving"><K.KjunSwitch modelValue={saving.value} label="Sync" loading onUpdate:modelValue={(v: boolean) => { saving.value = v; presses.value++; }} />
    <output data-testid="saving-presses">{presses.value}</output></div></K.KjunProvider>
  <K.KjunProvider><div data-testid="badge-count" style={{ display: 'flex', gap: '8px' }}>
    <K.KjunBadge count={0} variant="danger">zero</K.KjunBadge>
    <K.KjunBadge count={120} variant="danger" label="읽지 않은 알림 120개" />
    <K.KjunBadge dot label="새 소식" />
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="switch-description"><K.KjunSwitch modelValue label="Alerts" description="Sent once a day" /></div></K.KjunProvider>
  <K.KjunProvider><div data-testid="date-clear">
    <K.KjunDatePicker modelValue={date.value} clearable onUpdate:modelValue={(v: string) => { date.value = v; }} />
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="button-group">
    <K.KjunButtonGroup modelValue="a" options={[{ value: 'a', label: 'Mine' }, { value: 'b', label: 'Ours' }]} />
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="circle-buttons" style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
    <K.KjunButton shape="circle" size="sm" prefixIcon="plus" ariaLabel="Add sm" />
    <K.KjunButton shape="circle" size="md" prefixIcon="plus" ariaLabel="Add md" />
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="compact-list">
    <K.KjunListSection ariaLabel="Upcoming" divider={false} density="compact">
      <K.KjunListRow title="Trip" />
      <K.KjunListRow title="Dinner" />
    </K.KjunListSection>
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="badge-sizes" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '8px' }}>
    {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <K.KjunBadge key={size} size={size} variant="success" dot>{'Badge ' + size}</K.KjunBadge>)}
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="icon-list">
    <K.KjunListSection title="Settings">
      <K.KjunListRow icon="bell" title="Alerts" description="Push and email" />
      <K.KjunListRow title="Kim" description="kim@example.com">{{ leading: () => <K.KjunAvatar name="Kim" size="sm" /> }}</K.KjunListRow>
      <K.KjunListRow title="Sign out" />
    </K.KjunListSection>
  </div></K.KjunProvider>
  <K.KjunProvider><div data-testid="link-button" style={{ display: 'flex', flexDirection: 'row' }}>
    <K.KjunButton variant="link">More</K.KjunButton>
  </div></K.KjunProvider>
  <div data-testid="fab-area" style={{ position: 'relative', height: '200px', width: '300px' }}>
    <K.KjunProvider safeArea={{ bottom: 20 }}><K.KjunFab icon="plus" ariaLabel="Add schedule" /></K.KjunProvider>
  </div>
  <div data-testid="optional-ko"><K.KjunProvider><K.KjunFormGroup label="Nickname" optional><K.KjunInput modelValue="" /></K.KjunFormGroup></K.KjunProvider></div>
  <div data-testid="optional-en"><K.KjunProvider locale="en-US"><K.KjunFormGroup label="Nickname" optional><K.KjunInput modelValue="" /></K.KjunFormGroup></K.KjunProvider></div>
</div>).mount('#root');
