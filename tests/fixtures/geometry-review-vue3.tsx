import { createApp, defineComponent, reactive } from 'vue';
import * as api from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
// Same text as longGeometryText in geometry-review-common.tsx, which imports React.
const longGeometryText = '긴한국어설명과InternationalPortfolioPerformanceSummary2026';
const Cases = defineComponent(() => {
  const state = reactive({ drawer: false, modal: false, long: false, removed: false, events: 0 });
  const feedback = api.useKjunFeedback();
  const label = () => state.long ? longGeometryText : '검사 항목';
  const event = () => { state.events++; };
  Object.assign(window, { geometryLong: () => { state.long = true; }, geometryToast: () => feedback.toast.info(label(), { title: '검사 토스트', duration: 0, action: { label: '토스트 실행', onClick: event } }) });
  const box = (id: string, child: any, narrow = false) => <div key={id} data-testid={id} style={{ display: 'flex', flexDirection: 'column',
    alignItems: ['badge', 'chip', 'removable'].includes(id) ? 'flex-start' : 'stretch', marginBottom: '16px', width: narrow ? '240px' : undefined, maxWidth: '100%', minWidth: 0 }}>{child}</div>;
  const button = (name: string, action: () => void) => <button onClick={action}>{name}</button>;
  return () => {
    const text = label(), long = state.long;
    const items = [{ label: text, value: long ? '12345678901234567890' : 12345, desc: text, badge: { text, variant: 'info' as const }, clickable: true, mobileSecondary: false },
      { label: text, value: 678, desc: text, mobileSecondary: false }];
    const secondary = [{ label: text, value: 987, desc: text, prefix: long ? '미국달러InternationalSettlementCurrencyUnit' : undefined, suffix: long ? '정산 단위' : undefined }];
    return <div style={{ padding: '16px', minWidth: 0 }}>
      {box('badge', <api.KjunBadge size="xs">{text}</api.KjunBadge>)}{box('chip', <api.KjunChip size="lg" label={text} />)}
      {box('removable', !state.removed && <api.KjunChip removable label={text} removeLabel="칩 삭제" onRemove={() => { state.removed = true; event(); }} />)}
      {box('navigation', <api.KjunTopNavigation title={text} description={text} />)}
      {box('list', <api.KjunListSection title={text} description={text}><api.KjunListRow title={text} description={text} onClick={event} /></api.KjunListSection>)}
      {box('actionbar', <api.KjunBottomActionBar description={text} safeAreaBottom={7}>{button('하단 실행', event)}</api.KjunBottomActionBar>)}
      {box('card', <api.KjunCard title={text} subtitle={text} dividers>{{ default: () => text, footer: () => text }}</api.KjunCard>, true)}
      {box('hero', <api.KjunKpiHero label={text} value={long ? '12345678901234567890' : 12345} prefix={long ? '대한민국원InternationalCurrencyDenominationKoreanWon' : 'KRW'}
        suffix={long ? '원/장기정산통화단위' : '원'} secondary={secondary} animated={false} />)}
      {box('hero-sm', <api.KjunKpiHero size="sm" label={text} value={123} secondary={secondary} animated={false} />, true)}
      {box('row', <api.KjunKpiRow items={items} mobileSummary={false} onItem-click={event} />)}
      {box('row-sm', <api.KjunKpiRow items={items} size="sm" onItem-click={event} />, true)}
      {box('row-summary', <api.KjunKpiRow items={items} mobileSummary onItem-click={event} />)}
      {box('alert', <api.KjunAlert size="md" title={text}>{text}</api.KjunAlert>)}
      {box('skeleton', <api.KjunSkeleton type="card" animated={false} />, true)}
      {box('table', <api.KjunTable data={[{ id: 1, name: text, amount: 123 }]} columns={[{ key: 'name', label: '이름' }, { key: 'amount', label: '값' }]}
        responsive="card" cardTitle="name" onRowClick={event} />, true)}
      {button('패널 열기', () => { state.drawer = true; })}{button('대화상자 열기', () => { state.modal = true; })}
      <api.KjunDrawer open={state.drawer} onUpdate:open={(open: boolean) => { state.drawer = open; }} position="bottom" title="검사 패널">{{ default: () => text, footer: () => text }}</api.KjunDrawer>
      <api.KjunModal open={state.modal} onUpdate:open={(open: boolean) => { state.modal = open; }} title="검사 대화상자" showFooter>{text}</api.KjunModal>
      <output data-testid="events">{state.events}</output>
    </div>;
  };
});
createApp(defineComponent(() => () => <api.KjunProvider><api.KjunFeedbackProvider><Cases /></api.KjunFeedbackProvider></api.KjunProvider>)).mount('#root');
