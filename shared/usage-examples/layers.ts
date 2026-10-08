import { generateCard } from './card';
import { UsageBuilder, expr, literal, type UsageInput } from './builder';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), { name, settings: s } = input;
  const notify = (name: string, text: string) => b.handler(name, '', b.result(JSON.stringify(text)));
  const action = b.native ? 'onPress' : 'onClick';
  const menu = () => [
    b.node('DsDropdownItem', { disabled: !!s.itemDisabled, [action]: notify('selectFirst', '첫 항목 선택') }, b.text('첫 항목')),
    b.node('DsDropdownDivider'), b.node('DsDropdownItem', { disabled: true }, b.text('비활성 항목')),
    b.node('DsDropdownItem', { variant: 'danger', [action]: notify('selectLast', '마지막 항목 선택') }, b.text('마지막 항목')),
  ].join('\n');
  let content: string;
  switch (name) {
    case 'DsCard': return generateCard(input);
    case 'DsAlert': {
      const body = String(s.body ?? '');
      const description = b.native ? `{${literal(body)}}` : b.text(body);
      // Unsized buttons in actions follow the alert size.
      const actions: Record<string, string> = s.action ? { actions: b.button('다시 시도', notify('retry', '재시도 요청'), { variant: 'secondary' }) } : {};
      content = b.node(name, { variant: s.tone, ...b.props('size', 'title', 'closable'), onClose: notify('closeAlert', '알림 닫힘') }, body.trim() ? description : '', actions);
      break;
    }
    case 'DsDropdown': case 'DsDropdownItem': case 'DsDropdownDivider':
      content = b.node('DsDropdown', { disabled: s.disabled }, menu(), { trigger: b.button('메뉴 열기') }); break;
    case 'DsMenuButton': content = b.node(name, { label: '작업 메뉴', ...b.props('size', 'variant', 'compact', 'disabled', 'loading') }, menu()); break;
    case 'DsAccordion': case 'DsAccordionItem':
      content = b.node('DsAccordion', b.props('tone', 'multiple'), [b.node('DsAccordionItem', { title: '첫 항목', disabled: !!s.itemDisabled }, b.text('첫 내용')), b.node('DsAccordionItem', { title: '둘째 항목' }, b.text('둘째 내용'))].join('\n')); break;
    case 'DsModal': case 'DsDrawer': {
      b.feedback = true;
      content = b.group([
        b.button(name === 'DsModal' ? '모달 열기' : '패널 열기', b.handler('openDialog', '', b.set('open', 'true'))),
        b.node(name, { open: b.state('open', false), onOpenChange: b.update('open'), title: s.title ?? '작업 확인',
          ...(name === 'DsModal' ? { size: s.size, confirmText: s.confirmText, showFooter: true, loading: s.loading, confirmDisabled: s.disabled,
            onConfirm: b.handler('confirm', '', b.set('open', 'false') + '\n' + b.result('"저장했습니다"')) } : {}),
        }, [b.node('DsInput', { value: b.state('input', ''), onValueChange: b.update('input'), ariaLabel: '입력 예제', clearable: true }),
          b.button('알림 표시', b.handler('showToast', '', `${b.vue ? 'this.kjunFeedback' : 'feedback'}.toast.info("열린 레이어의 영역 알림", { duration: 0 });`))].join('\n')),
      ]); break;
    }
    case 'DsTooltip': content = b.node(name, { content: '이 버튼의 도움말', delay: 100 }, b.button('도움말')); break;
    case 'DsPopover':
      content = b.node(name, { noPadding:s.noPadding, manualTrigger: true, ariaLabel: '추가 정보', open: b.state('popoverOpen', false), onOpenChange: b.update('popoverOpen') },
        [b.native ? b.node('Text', { style: { fontSize: 14, lineHeight: 20 } }, '{"팝오버 내용"}') : b.text('팝오버 내용'),
          b.node('DsFormActions', { size: 'md', showCancel: false, confirmText: '실행', onConfirm: notify('run', '팝오버 실행') })].join('\n'), {
          trigger: b.button('추가 정보', b.handler('togglePopover', '', b.set('popoverOpen', '!' + b.read('popoverOpen'))), { variant: 'ghost' }),
        }); break;
    case 'DsBreadcrumb':
      content = b.node(name, { items: b.data('items', [{ label: '홈', href: '#home', to: '#home' }, { label: '목록', href: '#list', to: '#list' }, { label: '현재 위치' }]), onNavigate: notify('navigate', '탐색') }); break;
    case 'DsPagination':
      content = b.node(name, { currentPage: b.state('page', 1), onPageChange: b.update('page'), pageSize: b.state('pageSize', 20), onPageSizeChange: b.update('pageSize'), totalPages: 10, totalRows: 195, showInfo: true, showSizeSelector: true }); break;
    case 'DsScrollFade':
      content = b.node(name, {}, b.group(Array.from({ length: 12 }, (_, i) => b.button('항목 ' + (i + 1), undefined, { variant: 'secondary', size: 'sm' })))); break;
    case 'DsErrorBoundary':
      content = b.node(name, { fallbackMessage: '예제를 표시할 수 없습니다', onReset: notify('reset', '다시 시도') }, b.node('DsAlert', { type: 'success' }, b.text('정상 콘텐츠를 표시합니다.'))); break;
    default: throw Error('기본 사용 코드 생성기 누락: ' + name);
  }
  return b.finish(content);
}
