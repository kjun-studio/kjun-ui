import { UsageBuilder, expr, type UsageInput } from './builder';
import { sampleImage } from '../../previews/catalog/example-tools';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), { name, settings: s } = input;
  const action = b.native ? 'onPress' : 'onClick';
  const notify = (name: string, text: string) => b.handler(name, '', b.result(JSON.stringify(text)));
  const commit = () => b.handler('commit', 'value', b.result('"확정: " + value'));
  let content: string;
  switch (name) {
    case 'DsListRow': case 'DsListSection':
      content = b.node('DsListSection', { title: '설정', description: '계정과 알림을 관리합니다.' }, [
        b.node('DsListRow', { title: s.long ? '모든 기기에서 사용할 프로필과 계정 표시 이름' : '프로필 설정', description: '이름과 사진을 변경합니다.', disabled: s.disabled, [action]: notify('openProfile', '프로필 설정 열기') }, '', {
          leading: b.node('DsAvatar', { name: '김하늘', size: 'sm' }), actions: b.button('공유', notify('share', '프로필 공유'), { variant: 'ghost', size: 'sm' }),
        }),
        b.node('DsListRow', { title: '알림 받기', description: '중요한 변경 사항을 알려드립니다.' }, '', { actions: b.node('DsSwitch', { value: b.state('notifications', true), onValueChange: b.update('notifications'), ariaLabel: '알림 받기' }) }),
      ].join('\n')); break;
    case 'DsTopNavigation': {
      const leadingText = s.leading === '긴 문구' ? '프로젝트 목록으로 돌아가기' : '';
      const slots: Record<string, string> = {};
      if (s.leading !== '없음') slots.leading = b.button(leadingText, notify('back', '뒤로 가기 요청'), { ariaLabel: leadingText || '뒤로 가기', prefixIcon: 'arrow-left', variant: 'ghost', size: 'sm', disabled: s.disabled });
      if (s.actions === '아이콘 조합') slots.actions = [
        b.node('DsRefreshButton', { ...b.props('disabled', 'loading'), onRefresh: notify('refresh', '새로고침 요청') }),
        b.node('DsMenuButton', { compact: true, variant: 'ghost', ariaLabel: '더 보기', ...b.props('disabled', 'loading') }, b.node('DsDropdownItem', { [action]: notify('details', '세부 정보 요청') }, b.text('세부 정보'))),
        b.node('DsIconToggle', { activeIcon: 'heart', active: b.state('favorite', false), ariaLabel: '즐겨찾기', ...b.props('disabled', 'loading'), onToggle: b.handler('toggleFavorite', '', b.set('favorite', '!' + b.read('favorite')) + '\n' + b.result('"즐겨찾기 변경"')) }),
      ].join('\n');
      else if (s.actions !== '없음') slots.actions = (s.actions === '여러 행동' ? ['저장', '공유', '설정'] : [s.actions === '긴 문구' ? 'Save changes and continue' : '저장']).map((text, i) => b.button(text, notify('action' + i, text + ' 요청'), { variant: 'ghost', size: 'sm', ...b.props('disabled', 'loading') })).join('\n');
      content = b.node(b.native ? 'View' : 'div', { style: { width: b.vue ? s.exampleWidth + 'px' : Number(s.exampleWidth), maxWidth: '100%' } }, b.node(name, { title: s.long ? '팀과 함께 관리하는 프로젝트의 상세 설정' : '프로젝트 설정', description: s.showDescription ? '변경할 내용을 선택하세요.' : undefined, safeAreaTop: s.safeAreaTop }, '', slots)); break;
    }
    case 'DsBottomNavigation':
      content = b.group([b.node(name, { value: b.state('destination', 'home'), ...b.props('safeAreaBottom', 'keyboardVisible', 'hideOnKeyboard'),
        items: b.data('items', [{ key: 'home', label: '홈', href: '#home', icon: 'home' }, { key: 'activity', label: s.long ? '모든 프로젝트 활동 내역' : '활동', href: '#activity', icon: 'list', badge: 3 }, { key: 'settings', label: '설정', href: '#settings', icon: 'settings' }]),
        onNavigate: b.handler('navigate', 'key, event', 'if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;\nevent.preventDefault();\n' + b.set('destination', 'key')),
      }), b.text(expr('"현재 위치: " + state.destination'))]); break;
    case 'DsBottomActionBar':
      content = b.node(name, { description: s.long ? '변경한 설정은 저장한 뒤 모든 기기에 적용됩니다. 저장이 완료될 때까지 화면을 유지해 주세요.' : '저장하면 모든 기기에 적용됩니다.', ...b.props('safeAreaBottom', 'keyboardVisible', 'hideOnKeyboard') },
        b.node('DsFormActions', { confirmText: '변경 사항 저장', onConfirm: notify('save', '저장 요청'), onCancel: notify('cancel', '취소 요청') })); break;
    case 'DsImage': {
      b.state('imageReady', false); b.state('imageVersion', 0);
      b.data('images', [sampleImage(0), sampleImage(1)]);
      const waiting = s.imageState === '로딩' ? '!state.imageReady' : 'false';
      const image = b.node(name, { src: s.imageState === '실패' ? 'data:image/png;base64,invalid' : expr(`${waiting} ? undefined : images[state.imageVersion % images.length]`),
        alt: '산과 하늘을 표현한 프로젝트 표지', ...b.props('decorative', 'aspectRatio', 'fit'),
        onLoad: notify('loaded', '이미지 로드 완료'), onError: notify('failed', '이미지 로드 실패'),
      }, '', { fallback: b.text(expr(`${waiting} ? "이미지 주소를 준비합니다" : "이미지를 불러올 수 없습니다"`)) });
      content = b.group([image, ...(s.imageState === '로딩' ? [b.button('로컬 이미지 준비 · 2초', b.handler('prepareImage', '', 'await new Promise(resolve => setTimeout(resolve, 2000));\n' + b.set('imageReady', 'true'), true))] : []), b.button('이미지 주소 변경', b.handler('changeImage', '', b.set('imageVersion', b.read('imageVersion') + ' + 1')))]); break;
    }
    case 'DsAvatar':
      content = b.node(name, { name: '김하늘', src: s.imageState === '사진' ? b.data('avatarUrl', sampleImage(0)) : s.imageState === '실패' ? 'data:image/png;base64,invalid' : undefined, ...b.props('size', 'shape', 'decorative') }); break;
    case 'DsChip': {
      b.state('removed', false);
      const chip = b.node(name, { label: s.long ? '팀에서 함께 사용하는 프로젝트 분류' : '프로젝트', icon: 'folder', ...b.props('removable', 'disabled', 'size'), onRemove: b.handler('remove', '', b.set('removed', 'true')) });
      const restore = b.button('태그 복원', b.handler('restore', '', b.set('removed', 'false')));
      content = b.vue ? b.group([`<template v-if="!state.removed">\n${chip}\n</template>`, `<template v-else>\n${restore}\n</template>`]) : b.group([`{state.removed ? (\n${restore}\n) : (\n${chip}\n)}`]); break;
    }
    case 'DsSlider': case 'DsRangeSlider': {
      const range = name === 'DsRangeSlider', key = range ? 'range' : 'slider';
      content = b.node(name, { value: b.state(key, range ? (s.decimal ? [.2, .8] : [20, 80]) : s.decimal ? .5 : 40), onValueChange: b.update(key),
        min: 0, max: s.decimal ? 1 : 100, step: s.decimal ? .1 : 1, disabled: s.disabled, label: range ? '조회 범위' : '알림 음량', ...(range ? { thumbLabels: ['시작 값', '끝 값'] } : {}), onChangeCommit: commit(),
      }); break;
    }
    case 'DsTimePicker':
      content = b.node(name, { value: b.state('time', null), onValueChange: b.update('time'), ...b.props('precision', 'minuteStep', 'secondStep', 'disabled', 'error', 'clearable', 'size'),
        min: s.bounded ? s.precision === 'second' ? '09:30:15' : '09:30' : undefined, max: s.bounded ? s.precision === 'second' ? '18:30:45' : '18:30' : undefined, ariaLabel: '알림 시각', onChangeCommit: commit() }); break;
    case 'DsQuantityStepper':
      content = b.node(name, { value: b.state('quantity', s.decimal ? 1.25 : 2), onValueChange: b.update('quantity'), min: s.negative ? -10 : 0, max: 10, step: s.decimal ? .1 : 1, precision: s.decimal ? 2 : 0,
        ...b.props('disabled', 'error', 'size', 'block'), ariaLabel: '주문 수량', onChangeCommit: commit(), onInvalidInput: b.handler('invalid', 'draft', b.result('"잘못된 수량: " + draft')),
      }); break;
    default: throw Error('기본 사용 코드 생성기 누락: ' + name);
  }
  // A visible label and error text so the error state never relies on the border color alone.
  const fieldLabels: Record<string, [string, string]> = { DsTimePicker: ['알림 시각', '알림 시각을 선택해 주세요.'], DsQuantityStepper: ['주문 수량', '주문 수량을 확인해 주세요.'] };
  if (fieldLabels[name]) content = b.node('DsFormGroup', { label: fieldLabels[name][0], error: s.error ? fieldLabels[name][1] : '' }, content);
  if (['DsTimePicker', 'DsQuantityStepper'].includes(name)) content = b.node(b.native ? 'View' : 'div', { style: { width: b.native ? 360 : '360px', maxWidth: '100%' } }, content);
  return b.finish(content);
}
