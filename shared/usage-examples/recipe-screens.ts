import { expr } from './builder';
import type { RecipeBuilder } from './recipe-builder';

export function screens(b: RecipeBuilder): string | undefined {
  const app = b.input.name === 'GuideAppScreen';
  const keyboardCase = b.input.name === 'GuideKeyboardLayout';
  if (!app && !keyboardCase && b.input.name !== 'GuideBottomCtaLayout') return;
  const box = b.native ? 'View' : 'div';
  const keyboard = b.state('keyboard', keyboardCase);
  const toggle = b.handler('toggleKeyboard', '', b.set('keyboard', '!' + b.read('keyboard')));
  const save = b.message('saveProject', '변경 사항 저장');
  const contents: string[] = [];
  // The app screen keeps its list full-bleed so row text and inset content share one left edge.
  const inset = (content: string) => app ? b.node(box, { style: b.native ? { paddingHorizontal: 16 } : { paddingInline: 16 } }, content) : content;
  if (app) contents.push(inset(b.node('DsFormGroup', { label: '프로젝트 이름', hint: '입력에 초점을 두면 앱에서 키보드 상태를 전달합니다.' },
    b.field('project', '함께 만드는 프로젝트', '프로젝트 이름', { onFocus: b.handler('showKeyboard', '', b.set('keyboard', 'true')) }))));
  const rows = b.data('activities', Array.from({ length: app ? 8 : keyboardCase ? 5 : 7 }, (_, index) => ({ id: index + 1, title: '활동 ' + (index + 1) })));
  contents.push(b.node('DsListSection', {}, b.each(rows.code, 'activity', 'activity.id', b.node('DsListRow', { title: expr('activity.title'), description: '본문만 스크롤합니다.' }))));
  if (keyboardCase) contents.push(b.node('DsFormGroup', { label: '프로젝트 이름', hint: '입력과 저장 버튼을 함께 확인하세요.' }, b.field('project', '함께 만드는 프로젝트', '프로젝트 이름')));
  contents.push(inset(b.paragraph('마지막 콘텐츠')));
  const padding = app ? (b.native ? { paddingVertical: 16 } : { paddingBlock: 16 }) : { padding: 16 };
  const scroll = b.node(b.native ? 'ScrollView' : 'div', {
    style: { flex: 1, minHeight: 0, ...(b.native ? {} : { overflowY: 'auto' }) },
    ...(b.native ? { contentContainerStyle: { ...padding, gap: 16 }, keyboardShouldPersistTaps: 'handled' } : {}),
  }, b.native ? contents.join('\n') : b.node('div', { style: { display: 'flex', flexDirection: 'column', gap: 16, ...padding } }, contents.join('\n')));
  const footer = [b.node('DsBottomActionBar', {
    description: '변경한 내용을 확인한 뒤 저장하세요.',
    keyboardVisible: app || keyboardCase ? keyboard : false,
    safeAreaBottom: keyboardCase ? expr('state.keyboard ? 0 : 24') : app ? expr('state.keyboard ? 24 : 0') : 0,
  }, b.button('변경 사항 저장', save))];
  if (!keyboardCase) footer.push(b.node('DsBottomNavigation', {
    value: b.state('destination', app ? 'home' : 'docs'), safeAreaBottom: 24, keyboardVisible: app ? keyboard : false,
    items: app ? [{ key: 'home', label: '홈', href: '#home', icon: 'home' }, { key: 'activity', label: '활동', href: '#activity', icon: 'list' }, { key: 'settings', label: '설정', href: '#settings', icon: 'settings' }]
      : [{ key: 'docs', label: '문서', href: '#docs', icon: 'file' }, { key: 'activity', label: '활동', href: '#activity', icon: 'list' }],
    onNavigate: b.handler('navigate', 'key, event', 'event?.preventDefault();\n' + b.set('destination', 'key')),
  }));
  const viewport = b.node(box, { style: keyboardCase ? expr('{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, marginBottom: state.keyboard ? ' + (b.vue ? '"220px"' : '220') + ' : 0 }') : { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } }, [scroll, b.node(box, { style: { flexShrink: 0 } }, footer.join('\n'))].join('\n'));
  const screenContent = [];
  if (app) screenContent.push(b.node('DsTopNavigation', { title: '프로젝트', safeAreaTop: 24 }, '', {
    leading: b.button('', b.message('goBack', '뒤로 가기 요청'), { variant: 'ghost', size: 'sm', ariaLabel: '뒤로 가기', prefixIcon: 'arrow-left' }),
  }));
  screenContent.push(viewport);
  if (keyboardCase) screenContent.push(b.when('state.keyboard', b.node(box, { style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 220, padding: 16, borderTopWidth: 1, ...(b.native ? {} : { borderTopStyle: 'solid' }) } }, b.text('키보드 예시 영역 · 220px'))));
  const screen = b.node(box, { style: { display: 'flex', flexDirection: 'column', position: 'relative', height: 520, overflow: 'hidden' } }, screenContent.join('\n'));
  return app || keyboardCase ? b.stack([
    b.button('키보드 상태 전환', toggle, { variant: 'secondary' }),
    b.paragraph('문서에서는 키보드 상태를 수동으로 재현합니다. 실제 화면에서는 앱의 키보드 높이와 안전 영역 값을 사용하세요.'), screen,
  ]) : screen;
}
