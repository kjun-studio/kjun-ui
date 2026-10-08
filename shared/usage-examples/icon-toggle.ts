import { UsageBuilder, expr, type UsageInput } from './builder';

export function iconToggleExample(input: UsageInput) {
  const b = new UsageBuilder(input), { settings: s } = input;
  const active = b.state('active', false);
  const kind = s.usage === '즐겨찾기' ? 'favorite' : s.usage === '관심' ? 'interest' : null;
  if (!kind) return b.finish(b.node('DsIconToggle', {
    active, activeIcon: 'heart', ariaLabel: '좋아요', ...b.props('size', 'disabled', 'loading'),
    onToggle: b.handler('toggle', '', b.set('active', '!' + b.read('active'))),
  }));

  b.domainColors = true;
  b.state('pending', false);
  const label = kind === 'favorite' ? '즐겨찾기' : '관심';
  const color = b.vue ? { activeColorClass: 'text-' + kind }
    : { activeColor: b.native
      ? (b.declare('appDomainColors', 'import { appDomainColors } from "./kjun";'), expr('appDomainColors.' + kind))
      : `var(--kjun-${kind})` };
  b.declare('saveSelection', `async function saveSelection(next) {
  // 프로젝트 API를 호출하고 서버가 확정한 등록 여부를 반환하세요.
  return next;
}`);
  const onToggle = b.handler('toggle', '', `if (${b.read('pending')}) return;
const next = !${b.read('active')};
${b.set('pending', 'true')}
try {
  const saved = await saveSelection(next);
  ${b.set('active', 'saved')}
  ${b.result('"저장했습니다"')}
} catch {
  ${b.result('"저장하지 못했습니다. 다시 시도해 주세요."')}
} finally {
  ${b.set('pending', 'false')}
}`, true);
  return b.finish(b.node('DsIconToggle', {
    active, activeIcon: kind === 'favorite' ? 'star' : 'heart', ...color,
    ariaLabel: expr(`"예제 항목 ${label} " + (state.active ? "해제" : "등록")`),
    ...b.props('size', 'disabled'), loading: expr(`state.pending || ${!!s.loading}`), onToggle,
  }));
}
