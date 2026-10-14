import { demoPalettes } from '../../shared/demo-colors';
import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
const colors = new URLSearchParams(location.search).get('palette') === 'dark' ? demoPalettes.dark : demoPalettes.default;
for (const [role, value] of Object.entries(colors)) document.documentElement.style.setProperty('--kjun-' + role.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value);
document.body.style.background = colors.background;
document.body.style.color = colors.text;
const s = reactive({ escape: true, parent: false, child: false, drawer: false, popup: false, select: false, keep: false, present: true, trigger: true, actions: 0, closes: 0 });
const Cases = defineComponent(() => {
  const feedback = K.useKjunFeedback();
  Object.assign(window, { elevation: { openWindow: () => s.child = true, openParent: () => s.parent = true, closeWindow: () => s.child = false, escape: (v: boolean) => s.escape = v,
    acknowledge: () => { s.popup = false; s.select = false; },
    delay: () => s.keep = true, removeTrigger: () => s.trigger = false, unmount: () => s.present = false,
    reopen: () => { s.child = false; setTimeout(() => s.child = true, 30); },
    toast: (duration = 0) => feedback.toast.info('진행 상태 알림', { duration, action: { label: '알림 행동', onClick: () => s.actions++ } }),
  } });
  const button = (label: string, action?: () => void) => <K.KjunButton variant="secondary" onClick={action}>{label}</K.KjunButton>;
  const pop = (label: string, controlled = false) => (
    <K.KjunPopover ariaLabel={label + ' 내용'} {...(controlled ? { open: s.popup, 'onUpdate:open': (v: boolean) => { if (!v) s.closes++; if (v || !s.keep) s.popup = v; } } : {})}>
      {{ trigger: () => button(label), default: () => <div>{button('새 창 열기', () => s.child = true)}{button('팝업 행동', () => s.actions++)}</div> }}
    </K.KjunPopover>
  );
  return () => (
    <div style={{ padding: '16px', display: 'grid', gap: '16px' }}>
      <div data-testid="flat"><K.KjunCard title="기본 표면" border>{button('카드 내부 행동', () => s.actions++)}</K.KjunCard></div>
      <div data-testid="raised"><K.KjunCard title="분리된 표면" elevation="raised">분리된 내용</K.KjunCard></div>
      {s.trigger && pop('화면 팝업', true)}
      <K.KjunSelect ariaLabel="화면 선택" modelValue="a" options={[{ value: 'a', label: '첫 옵션' }, { value: 'b', label: '둘째 옵션' }]} open={s.select}
        onUpdate:open={(v: boolean) => { if (v || !s.keep) s.select = v; if (!v) s.closes++; }} />
      <K.KjunDropdown>{{ trigger: () => button('화면 메뉴'), default: () => <K.KjunDropdownItem onClick={() => s.child = true}>메뉴에서 새 창</K.KjunDropdownItem> }}</K.KjunDropdown>
      <K.KjunCombobox ariaLabel="화면 자동완성" modelValue={null} options={['자동완성 후보']} />
      <K.KjunSearchInput ariaLabel="화면 검색 제안" modelValue="" minChars={0} debounce={0} loadOptions={async () => [{ id: 'result', name: '검색 후보' }] as any} />
      {button('상위 창 열기', () => s.parent = true)}{button('패널 열기', () => s.drawer = true)}
      <K.KjunTooltip content="짧은 도움말">{button('도움말')}</K.KjunTooltip>
      {s.present && <K.KjunModal open={s.parent} onUpdate:open={(v: boolean) => s.parent = v} title="상위 창" height="360px">
        {s.trigger && pop('상위 팝업')}{button('중첩 패널', () => s.drawer = true)}
        <K.KjunSelect ariaLabel="상위 선택" options={['옵션 A', '옵션 B']} />
        <div style={{ height: '800px' }}>긴 본문</div>{button('본문 마지막')}
      </K.KjunModal>}
      {s.present && <K.KjunDrawer open={s.drawer} onUpdate:open={(v: boolean) => s.drawer = v} title="패널" position="bottom">{pop('패널 팝업')}</K.KjunDrawer>}
      {s.present && <K.KjunModal open={s.child} onUpdate:open={(v: boolean) => s.child = v} title="새 창" closeOnEsc={s.escape}>
        {button('새 창 닫기', () => s.child = false)}{button('새 창 행동', () => s.actions++)}<K.KjunTextarea ariaLabel="새 창 메모" />
      </K.KjunModal>}
      <output data-testid="actions">{s.actions}</output><output data-testid="closes">{s.closes}</output>
    </div>
  );
});
createApp(defineComponent(() => () => <K.KjunProvider><K.KjunFeedbackProvider><Cases /></K.KjunFeedbackProvider></K.KjunProvider>)).mount('#root');
