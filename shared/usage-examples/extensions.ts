import { UsageBuilder, expr, type UsageInput } from './builder';
import { sampleImage } from '../../previews/catalog/example-tools';
import { eventCalendar } from './event-calendar';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), { name, settings: s } = input;
  const action = b.native ? 'onPress' : 'onClick';
  const notify = (name: string, text: string) => b.handler(name, '', b.result(JSON.stringify(text)));
  const commit = () => b.handler('commit', 'value', b.result('"확정: " + value'));
  let content: string, numberLabel = '', numberError = '';
  switch (name) {
    case 'KjunListSection':
      // A details section: label and value pairs that are read, not pressed, closed by an emphasized total.
      if (s.variant === 'details') {
        content = b.node('KjunListSection', { title: '결제 정보', variant: 'details' }, [
          b.node('KjunListRow', { title: '결제 수단' }, '', { trailing: b.text('신한카드 (1234)') }),
          b.node('KjunListRow', { title: '승인 번호' }, '', { trailing: b.text('30418827') }),
          b.node('KjunListRow', { title: '배송 메모', trailingPosition: 'below' }, '', { trailing: b.text('문 앞에 두고 벨은 누르지 말아 주세요.') }),
          b.node('KjunListRow', { title: '총 결제 금액', emphasized: true }, '', { trailing: b.text('29,000원') }),
        ].join('\n'));
        break;
      }
      // A single choice the section owns: rows carry values, the section the chosen one.
      content = b.node('KjunListSection', { title: '화면 테마', description: '앱의 색 모드를 고릅니다.', variant: s.variant === 'open' ? 'open' : undefined, selectionMode: 'single', value: b.state('theme', 'system'), onValueChange: b.update('theme') }, [
        b.node('KjunListRow', { title: '밝게', icon: s.variant === 'open' ? 'sun' : undefined, value: 'light' }),
        b.node('KjunListRow', { title: '어둡게', icon: s.variant === 'open' ? 'moon' : undefined, value: 'dark' }),
        b.node('KjunListRow', { title: '시스템 설정', description: '기기의 화면 모드를 따릅니다.', icon: s.variant === 'open' ? 'device-desktop' : undefined, value: 'system', disabled: s.disabled }),
      ].join('\n'), { footer: b.text('바꾼 테마는 이 기기에만 적용됩니다.') }); break;
    case 'KjunListRow': {
      const leadingSize = typeof s.leadingSize === 'string' && ['xs', 'sm', 'md', 'lg'].includes(s.leadingSize) ? s.leadingSize : undefined;
      if (b.native) b.declare('appColors', 'import { appColors } from "./kjun";');
      const iconColor = s.iconColor ? b.native ? expr('appColors.brand') : 'var(--kjun-brand)' : undefined;
      const iconBackground = s.iconBackground ? b.native ? expr('appColors.secondary') : 'var(--kjun-secondary)' : undefined;
      const devices = b.node('KjunText', { tone: 'secondary' }, '이 휴대폰 · 방금 전, 사무실 노트북 · 어제');
      content = b.node('KjunListSection', { title: '설정', description: '계정과 알림을 관리합니다.' }, [
        b.node('KjunListRow', { title: s.long ? '모든 기기에서 사용할 프로필과 계정 표시 이름' : '프로필 설정', description: '이름과 사진을 변경합니다.', leadingSize: leadingSize ?? 'sm', current: s.current || undefined, disabled: s.disabled, [action]: notify('openProfile', '프로필 설정 열기') }, '', {
          leading: b.node('KjunAvatar', { name: '김하늘', size: leadingSize ?? 'sm' }), actions: b.button('공유', notify('share', '프로필 공유'), { variant: 'ghost', size: 'sm' }),
        }),
        b.node('KjunListRow', { title: '알림 받기', description: '중요한 변경 사항을 알려드립니다.', icon: 'bell', leadingSize, iconColor, iconBackground, disabled: s.disabled }, '', { actions: b.node('KjunSwitch', { value: b.state('notifications', true), onValueChange: b.update('notifications'), ariaLabel: '알림 받기', disabled: s.disabled }) }),
        // A row that opens its own content. Vue takes the content in the expanded slot, React and Native in expandedContent.
        ...(s.expandable ? [b.node('KjunListRow', { title: '로그인한 기기', icon: 'device-mobile', leadingSize, iconColor, iconBackground, disabled: s.disabled, expanded: b.state('devices', false), onExpandedChange: b.update('devices'),
          ...(b.vue ? {} : { expandedContent: expr(devices) }) }, '', { trailing: b.text('2대'), ...(b.vue ? { expanded: devices } : {}) })] : []),
      ].join('\n')); break;
    }
    case 'KjunListGroup':
      content = b.node('KjunListGroup', { variant: s.variant === 'inset' ? undefined : s.variant }, [
        b.node('KjunListSection', { title: '계정' }, b.node('KjunListRow', { title: '프로필', chevron: true, [action]: notify('openProfile', '프로필 열기') }, '', { trailing: b.text('김하늘') })),
        b.node('KjunListSection', { title: '알림' }, b.node('KjunListRow', { title: '푸시 알림', checked: b.state('push', true), onCheckedChange: b.update('push') }), { footer: b.text('푸시 알림은 이 기기에서만 적용됩니다.') }),
        // A count after the title: it centers on the title line and is heard with the title as the list's name.
        b.node('KjunListSection', { title: '연결된 기기' }, [
          b.node('KjunListRow', { title: '이 휴대폰', icon: 'device-mobile' }, '', { trailing: b.text('방금 전') }),
          b.node('KjunListRow', { title: '사무실 노트북', icon: 'device-laptop' }, '', { trailing: b.text('어제') }),
        ].join('\n'), { badge: b.node('KjunBadge', { count: 2 }) }),
      ].join('\n')); break;
    case 'KjunListItem':
      content = b.node('KjunListSection', { title: '화면' }, [
        b.node('KjunListItem', {}, b.node('KjunText', { tone: 'secondary' }, b.text('화면 테마는 기기 설정을 따릅니다.'))),
        b.node('KjunListRow', { title: '글자 크기', chevron: true, [action]: notify('openFontSize', '글자 크기 열기') }),
      ].join('\n')); break;
    case 'KjunTopNavigation': {
      const leadingText = s.leading === '긴 문구' ? '프로젝트 목록으로 돌아가기' : '';
      const slots: Record<string, string> = {};
      if (s.leading !== '없음') slots.leading = b.button(leadingText, notify('back', '뒤로 가기 요청'), { ariaLabel: leadingText || '뒤로 가기', prefixIcon: 'arrow-left', variant: 'ghost', size: 'sm', disabled: s.disabled });
      if (s.actions === '아이콘 조합') slots.actions = [
        b.node('KjunRefreshButton', { ...b.props('disabled', 'loading'), onRefresh: notify('refresh', '새로고침 요청') }),
        b.node('KjunMenuButton', { compact: true, variant: 'ghost', ariaLabel: '더 보기', ...b.props('disabled', 'loading') }, b.node('KjunDropdownItem', { [action]: notify('details', '세부 정보 요청') }, b.text('세부 정보'))),
        b.node('KjunIconToggle', { activeIcon: 'heart', active: b.state('favorite', false), ariaLabel: '즐겨찾기', ...b.props('disabled', 'loading'), onToggle: b.handler('toggleFavorite', '', b.set('favorite', '!' + b.read('favorite')) + '\n' + b.result('"즐겨찾기 변경"')) }),
      ].join('\n');
      else if (s.actions !== '없음') slots.actions = (s.actions === '여러 행동' ? ['저장', '공유', '설정'] : [s.actions === '긴 문구' ? 'Save changes and continue' : '저장']).map((text, i) => b.button(text, notify('action' + i, text + ' 요청'), { variant: 'ghost', size: 'sm', ...b.props('disabled', 'loading') })).join('\n');
      content = b.node(b.native ? 'View' : 'div', { style: { width: b.vue ? s.exampleWidth + 'px' : Number(s.exampleWidth), maxWidth: '100%' } }, b.node(name, { title: s.long ? '팀과 함께 관리하는 프로젝트의 상세 설정' : '프로젝트 설정', description: s.showDescription ? '변경할 내용을 선택하세요.' : undefined }, '', slots));
      break;
    }
    case 'KjunBottomNavigation':
      content = b.group([b.node(name, { value: b.state('destination', 'home'), ...b.props('iconStyle', 'showLabels', 'keyboardVisible', 'hideOnKeyboard'),
        items: b.data('items', [{ key: 'home', label: '홈', href: '#home', icon: 'home' }, { key: 'activity', label: s.long ? '모든 프로젝트 활동 내역' : '활동', href: '#activity', icon: 'list', badge: 3 }, { key: 'settings', label: '설정', href: '#settings', icon: 'settings' }]),
        onNavigate: b.handler('navigate', 'key, event', 'if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;\nevent.preventDefault();\n' + b.set('destination', 'key')),
      }), b.text(expr('"현재 위치: " + state.destination'))]);
      break;
    case 'KjunFloatingNavigation':
      content = b.group([b.node(name, { value: b.state('destination', 'home'), ...b.props('keyboardVisible', 'hideOnKeyboard'),
        items: b.data('items', [{ key: 'home', label: '홈', href: '#home', icon: 'home' }, { key: 'search', label: '검색', href: '#search', icon: 'search', ...(s.badges ? { badge: true } : {}) }, { key: 'activity', label: '알림', href: '#activity', icon: 'bell', ...(s.badges ? { badge: 3 } : {}) }, { key: 'profile', label: '내 정보', href: '#profile', icon: 'user' }]),
        onNavigate: b.handler('navigate', 'key, event', 'if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;\nevent.preventDefault();\n' + b.set('destination', 'key')),
      }), b.text(expr('"현재 위치: " + state.destination'))]);
      break;
    case 'KjunSideNavigation': {
      if (s.spaces) { content = sideNavigationSpaces(b); break; }
      // Icons only: the app narrows its column (72 with names under the icons) and widens it again when a parent is pressed.
      const narrow = s.railLabels ? 72 : 44;
      const toggles = s.collapsed || s.chrome;
      const width = toggles ? expr(b.vue ? `(state.collapsed ? ${narrow} : 240) + 'px'` : `state.collapsed ? ${narrow} : 240`) : b.vue ? '240px' : 240;
      content = b.group([b.node(b.native ? 'View' : 'div', { style: { width } }, b.node(name, { ariaLabel: '작업 공간', value: b.state('destination', 'home'),
        ...(toggles ? { collapsed: b.state('collapsed', !!s.collapsed), onCollapsedChange: b.update('collapsed') } : {}),
        ...(s.collapsedParent === 'flyout' ? { collapsedParent: 'flyout' } : {}), ...(s.chrome ? { collapseToggle: true } : {}),
        ...(s.collapsibleGroups ? { collapsibleGroups: true } : {}), ...(s.groupCounts ? { groupCounts: true } : {}), ...(s.rail === 'groups' ? { rail: 'groups' } : {}),
        ...(s.railLabels ? { railLabels: true } : {}), ...(s.density === 'compact' ? { density: 'compact' } : {}),
        items: b.data('items', [{ key: 'home', label: '홈', href: '#home', icon: 'home' }, { key: 'activity', label: s.long ? '아주 긴 이름을 가진 프로젝트 활동 내역' : '활동', ...(s.long && s.railLabels ? { shortLabel: '활동' } : {}), href: '#activity', icon: 'list', badge: 3, ...(s.neutralBadges ? { badgeTone: 'neutral' } : {}) },
          { title: '문서', icon: 'file-text', ...(s.limit ? { limit: 1 } : {}), items: [{ key: 'projects', label: '프로젝트', icon: 'folder', children: [{ key: 'brand', label: '브랜드 웹사이트', href: '#brand', badge: true }, { key: 'checkout', label: '결제 화면 개선', href: '#checkout' },
            ...(s.nested ? [{ key: 'design', label: '디자인', children: [{ key: 'tokens', label: '토큰', href: '#tokens' }, { key: 'icons', label: '아이콘', href: '#icons' }] }] : [])] }, { key: 'archive', label: '보관함', href: '#archive', icon: 'box', ...(s.actions ? { actions: [{ key: 'new', icon: 'plus', label: '새 문서' }, { key: 'more', icon: 'dots', label: '더 보기' }] } : {}) }] },
          { key: 'help', label: '도움말', href: 'https://example.com/help', icon: 'help-circle', target: '_blank' },
          { title: '관리', icon: 'adjustments', items: [{ key: 'settings', label: '설정', href: '#settings', icon: 'settings', ...(s.disabled ? { disabled: true } : {}) }] }]),
        // Modified clicks and target links never reach onNavigate, so a plain click is the app's to route.
        onNavigate: b.handler('navigate', 'key, event', (b.native ? '' : 'event.preventDefault();\n') + b.set('destination', 'key')),
        // A row's action reports the row and the action; the app opens its own menu or dialog.
        ...(s.actions ? { onAction: b.handler('action', 'key, action', b.set('destination', 'key + ":" + action')) } : {}),
      }, '', s.chrome ? { header: b.node(b.native ? 'Text' : 'strong', {}, b.text('KJ Studio')), footer: b.node(b.native ? 'Text' : 'span', {}, b.text('계정')) } : {})), b.text(expr('"현재 위치: " + state.destination'))]);
      break;
    }
    case 'KjunSideNavigationLayout': {
      // The layout keeps the column (open, collapsed, or a drawer below the breakpoint); pass collapsed to both, and close
      // the drawer when a page is chosen.
      const menu = b.node('KjunSideNavigation', { ariaLabel: '작업 공간', value: b.state('destination', 'home'), collapsed: b.state('collapsed', !!s.collapsed), ...(s.railLabels ? { railLabels: true } : {}),
        items: b.data('items', [{ key: 'home', label: '홈', href: '#home', icon: 'home' }, { key: 'activity', label: '활동', href: '#activity', icon: 'list', badge: 3, badgeTone: 'neutral' },
          { title: '문서', icon: 'file-text', items: [{ key: 'projects', label: '프로젝트', href: '#projects', icon: 'folder' }, { key: 'archive', label: '보관함', href: '#archive', icon: 'box' }] }]),
        onNavigate: b.handler('navigate', 'key, event', (b.native ? '' : 'event.preventDefault();\n') + b.set('destination', 'key') + '\n' + b.set('navOpen', 'false')) });
      content = b.node(name, { collapsed: b.state('collapsed', !!s.collapsed), ...(s.width && s.width !== 'md' ? { width: s.width } : {}), ...(s.railLabels ? { railLabels: true } : {}),
        navOpen: b.state('navOpen', false), onNavOpenChange: b.update('navOpen') }, b.text(expr('"현재 위치: " + state.destination')), { nav: menu });
      break;
    }
    case 'KjunPressable':
      content = b.group([b.node(name, { ariaLabel: '추억 지도에서 보기', ...b.props('pressEffect', 'focusRingInset', 'disabled'), style: { borderRadius: b.vue ? '16px' : 16, overflow: 'hidden' }, [action]: notify('openMap', '지도 열기') },
        b.node('KjunCard', { title: '교토 3박 4일', subtitle: '사진 128장 · 7월 14일–17일', surface: 'muted' }))]);
      break;
    case 'KjunBottomActionBar':
      content = b.node(name, { ...(s.variant === 'floating' ? { variant: 'floating' } : {}), description: s.long ? '변경한 설정은 저장한 뒤 모든 기기에 적용됩니다. 저장이 완료될 때까지 화면을 유지해 주세요.' : '저장하면 모든 기기에 적용됩니다.', ...b.props('keyboardVisible', 'hideOnKeyboard') },
        b.node('KjunFormActions', { confirmText: '변경 사항 저장', onConfirm: notify('save', '저장 요청'), onCancel: notify('cancel', '취소 요청') }));
      break;
    case 'KjunCarousel': {
      const cards = [['이번 주 추천', '새로 나온 템플릿을 확인하세요'], ['팀 공간', '동료와 문서를 함께 정리합니다'], ['알림 정리', '중요한 소식만 받아 보세요'], ['보관함', '지난 작업을 다시 찾습니다']].map(([title, subtitle], i) =>
        b.node('KjunCard', { title, subtitle, border: true, media: b.node('KjunImage', { src: expr(`images[${i % 2}]`), decorative: true, aspectRatio: 2 }) }));
      b.data('images', [sampleImage(0), sampleImage(1)]);
      const slides = s.slideSize === 'auto' ? cards.map(card => b.node(b.native ? 'View' : 'div', { style: { width: 240 } }, card)) : cards;
      content = b.group([b.node(name, { ...(s.title ? { title: '추천 콘텐츠' } : { ariaLabel: '추천 콘텐츠' }), ...b.props('slideSize', 'gap', 'controls', 'snapAlign', 'bleed', 'indicatorPlacement', ...(b.native ? [] : ['mouseDrag'])), ...(s.indicators === 'dots' ? {} : { indicators: s.indicators === 'none' ? false : s.indicators }), index: b.state('slide', 0), onIndexChange: b.update('slide') }, slides.join('\n')),
        b.text(expr('"현재 슬라이드: " + (state.slide + 1)'))]); break;
    }
    case 'KjunSteps': {
      const vertical = s.orientation === 'vertical';
      const items = vertical
        ? [{ label: '주문 접수', meta: '11월 17일 09:12', description: '주문이 접수되었습니다' }, { label: '상품 준비', meta: '11월 17일 10:40', description: '판매자가 상품을 포장하고 있습니다' }, { label: '배송 시작', meta: '11월 17일 14:05', description: '서울 강서 허브에서 출발했습니다' }, { label: '배송 중', meta: '도착 예정 11월 18일', description: '기사님이 배송 중입니다' }, { label: '배송 완료' }]
        : ['약관 동의', '배송지', '결제', '주문 확인', '완료'].map(label => ({ label }));
      content = b.group([b.node(name, { ariaLabel: vertical ? '배송 진행' : '주문 진행', items: b.data('steps', items), current: s.current ?? 2, ...b.props('currentStatus', 'orientation', 'layout'),
        onStepSelect: b.handler('selectStep', 'index', b.result('steps[index].label + " 단계 선택"')) })]); break;
    }
    case 'KjunEventCalendar': content = eventCalendar(b, s); break;
    case 'KjunImage': {
      b.state('imageReady', false); b.state('imageVersion', 0);
      b.data('images', [sampleImage(0), sampleImage(1)]);
      const waiting = s.imageState === '로딩' ? '!state.imageReady' : 'false';
      const image = b.node(name, { src: s.imageState === '실패' ? 'data:image/png;base64,invalid' : expr(`${waiting} ? undefined : images[state.imageVersion % images.length]`),
        alt: '산과 하늘을 표현한 프로젝트 표지', ...b.props('decorative', 'aspectRatio', 'fit'),
        onLoad: notify('loaded', '이미지 로드 완료'), onError: notify('failed', '이미지 로드 실패'),
      }, '', { fallback: b.text(expr(`${waiting} ? "이미지 주소를 준비합니다" : "이미지를 불러올 수 없습니다"`)) });
      content = b.group([image, ...(s.imageState === '로딩' ? [b.button('로컬 이미지 준비 · 2초', b.handler('prepareImage', '', 'await new Promise(resolve => setTimeout(resolve, 2000));\n' + b.set('imageReady', 'true'), true))] : []), b.button('이미지 주소 변경', b.handler('changeImage', '', b.set('imageVersion', b.read('imageVersion') + ' + 1')))]); break;
    }
    case 'KjunAvatar':
      content = b.node(name, { name: '김하늘', src: s.imageState === '사진' ? b.data('avatarUrl', sampleImage(0)) : s.imageState === '실패' ? 'data:image/png;base64,invalid' : undefined, ...b.props('size', 'shape', 'decorative') }); break;
    case 'KjunAvatarGroup': {
      const many = s.people === '128명', count = s.people === '3명' ? 3 : 5;
      content = b.node(name, { items: b.data('people', ['김하늘', '이서준', '박지우', '최민서', '정도윤'].slice(0, count).map((name, i) => ({ key: 'p' + i, name }))), max: 3,
        total: many ? 128 : undefined, ariaLabel: `참여자 ${many ? 128 : count}명`, ...b.props('size', 'shape', 'pressable', 'disabled'),
        ...(s.pressable ? { [action]: notify('openPeople', '참여자 목록 열기') } : {}) }); break;
    }
    case 'KjunChip': {
      b.state('removed', false);
      const chip = b.node(name, { label: s.long ? '팀에서 함께 사용하는 프로젝트 분류' : '프로젝트', icon: 'folder', ...b.props('removable', 'disabled', 'size'), onRemove: b.handler('remove', '', b.set('removed', 'true')) });
      const restore = b.button('태그 복원', b.handler('restore', '', b.set('removed', 'false')));
      content = b.vue ? b.group([`<template v-if="!state.removed">\n${chip}\n</template>`, `<template v-else>\n${restore}\n</template>`]) : b.group([`{state.removed ? (\n${restore}\n) : (\n${chip}\n)}`]); break;
    }
    case 'KjunSlider': case 'KjunRangeSlider': {
      const range = name === 'KjunRangeSlider', key = range ? 'range' : 'slider', twoWay = !range && s.twoWay;
      const min = twoWay ? -50 : 0, max = twoWay ? 50 : s.decimal ? 1 : 100, step = s.decimal && !twoWay ? .1 : 1;
      const unitCode = !s.unit ? undefined : s.decimal ? '(value) => Math.round(value * 100) + "%"' : range ? '(value) => value + "만"' : twoWay ? '(value) => (value > 0 ? "+" : "") + value + "%"' : '(value) => value + "%"';
      if (unitCode) b.declare('formatUnit', `const formatUnit = ${unitCode};`);
      if (unitCode && range && !s.decimal) b.declare('formatPrice', 'const formatPrice = (start, end) => `${start}만~${end}만 원`;');
      const unit = (value: number) => !s.unit ? String(value) : s.decimal ? Math.round(value * 100) + '%' : range ? value + '만' : (twoWay && value > 0 ? '+' : '') + value + '%';
      const marks = !s.marks || s.marks === '없음' ? undefined : [0, .25, .5, .75, 1].map(f => { const value = Math.round((min + f * (max - min)) * 100) / 100;
        return s.marks === '라벨' && f % .5 === 0 ? { value, label: unit(value) } : { value }; });
      content = b.node(name, { value: b.state(key, range ? (s.decimal ? [.2, .8] : [20, 80]) : twoWay ? 20 : s.decimal ? .5 : 40), onValueChange: b.update(key),
        min, max, step, disabled: s.disabled, label: range ? (s.unit ? '가격' : '조회 범위') : twoWay ? '밝기 보정' : '알림 음량', ...(range ? { thumbLabels: ['시작 값', '끝 값'] } : {}),
        size: s.size === 'sm' ? 'sm' : undefined, marks, valueLabel: s.valueLabel && s.valueLabel !== 'off' ? s.valueLabel : undefined, orientation: s.vertical ? 'vertical' : undefined,
        formatValue: unitCode ? expr('formatUnit') : undefined, formatRange: unitCode && range && !s.decimal ? expr('formatPrice') : undefined,
        fillOrigin: twoWay ? 0 : undefined, minStepsBetweenThumbs: range && s.minSteps ? Number(s.minSteps) : undefined, onChangeCommit: commit(),
      }); break;
    }
    case 'KjunTimePicker':
      content = b.node(name, { value: b.state('time', null), onValueChange: b.update('time'), ...b.props('precision', 'minuteStep', 'secondStep', 'disabled', 'error', 'clearable', 'size', 'block'),
        min: s.bounded ? s.precision === 'second' ? '09:30:15' : '09:30' : undefined, max: s.bounded ? s.precision === 'second' ? '18:30:45' : '18:30' : undefined, ariaLabel: '알림 시각', onChangeCommit: commit() }); break;
    case 'KjunZoneGauge': {
      // Zone colours are the app's own: KJUN draws them as given.
      if (b.native) b.declare('appColors', 'import { appColors } from "./kjun";');
      const color = (role: string) => b.native ? `appColors.${role}` : `"var(--kjun-${role})"`;
      b.declare('zones', `const zones = [\n  { to: 30, label: "저평가", color: ${color('info')} },\n  { to: 70, label: "중립" },\n  { to: 100, label: "고평가", color: ${color('warning')} },\n];`);
      content = b.node(name, { label: 'PER 백분위', value: s.missing ? null : Number(s.value), zones: expr('zones'), size: s.size === 'sm' ? 'sm' : undefined, zoneLabels: s.zoneLabels === false ? false : undefined }); break;
    }
    case 'KjunStackedBar': {
      if (b.native) b.declare('appColors', 'import { appColors } from "./kjun";');
      const color = (role: string) => b.native ? `appColors.${role}` : `"var(--kjun-${role})"`;
      const values = s.data === '작은 조각' ? [990, 5, 5] : s.data === '모두 0' ? [0, 0, 0] : [12, 6, 2];
      b.declare('opinions', s.data === '없음' ? 'const opinions = null;'
        : `const opinions = [\n  { key: "bull", label: "강세", value: ${values[0]}, color: ${color('danger')} },\n  { key: "flat", label: "중립", value: ${values[1]} },\n  { key: "bear", label: "약세", value: ${values[2]}, color: ${color('info')} },\n];`);
      content = b.node(name, { label: '애널리스트 의견', items: expr('opinions'), size: s.size === 'sm' ? 'sm' : undefined, legend: s.legend === false ? false : undefined }); break;
    }
    case 'KjunSplitPane': {
      const vertical = s.direction === 'vertical', height = vertical ? 320 : 180, px = s.unit === 'px', rail = !!s.collapsible, start = px ? 240 : 0.6;
      const pane = (title: string, subtitle: string) => b.node('KjunCard', { title, subtitle });
      // A collapsed list leaves a 48px rail; the app draws it from the collapsed value.
      const icon = b.node('KjunIcon', { name: 'list', size: 20 }), list = pane('메시지 목록', '첫 패널');
      const first = !rail ? list : b.vue ? `${icon.replace('<KjunIcon', '<KjunIcon v-if="state.collapsed"')}\n${list.replace('<KjunCard', '<KjunCard v-else')}`
        : `{${b.read('collapsed')} ? ${icon} : ${list}}`;
      content = b.group([b.node(b.native ? 'View' : 'div', { style: { height: b.native ? height : height + 'px' } },
        b.node(name, { ariaLabel: '메시지 목록 크기', direction: vertical ? 'vertical' : undefined, sizeUnit: px ? 'px' : undefined, size: b.state('split', start), onSizeChange: b.update('split'), defaultSize: start,
          minSize: s.limits ? vertical ? [80, 80] : [160, 200] : undefined, disabled: s.disabled || undefined, onChangeCommit: commit(),
          ...(rail ? { collapsible: true, collapsedSize: 48, collapsed: b.state('collapsed', false), onCollapsedChange: b.update('collapsed') } : {}) }, '',
        { first, second: pane('상세 내용', '둘째 패널') })),
        b.text(expr(px ? '"첫 패널 폭: " + state.split + "px"' : '"첫 패널 비율: " + Math.round(state.split * 100) + "%"'))]); break;
    }
    case 'KjunColorPicker':
      content = b.node(name, { value: b.state('color', s.alpha ? '#3B82F6CC' : '#3B82F6'), onValueChange: b.update('color'), swatches: s.swatches ? ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B', '#111111'] : undefined,
        ...b.props('custom', 'alpha', 'input', 'clearable', 'eyeDropper', 'disabled', 'error', 'size'),
        recentColors: s.recent ? b.state('recentColors', ['#0EA5E9', '#7C3AED']) : undefined, onRecentColorsChange: s.recent ? b.update('recentColors') : undefined,
        ariaLabel: '라벨 색', onChangeCommit: commit() }); break;
    case 'KjunFileUpload': {
      // The app uploads; this example marks each accepted file as done right away.
      const sample = s.sample === '여러 상태' ? [
        { id: 'receipt', name: '영수증_11월.pdf', size: 245760, status: 'done' },
        { id: 'photo', name: '매장_외관_사진_2026.jpg', size: 4404019, status: 'uploading', progress: 64 },
        { id: 'license', name: '사업자등록증.pdf', size: 1153434, status: 'error' },
        { id: 'clients', name: '거래처_목록.xlsx', size: 327680, status: 'queued' },
      ].slice(0, s.multiple === false ? 1 : 4) : [];
      const add = 'accepted.map(file => ({ id: file.name + "-" + Date.now(), name: file.name, size: file.size, type: file.type, status: "done" }))';
      content = b.node(name, { files: b.state('files', sample), accept: '.pdf,image/*,.xlsx', maxSize: 20 * 1024 * 1024, maxFiles: 5,
        ...b.props('multiple', 'disabled'),
        onSelect: b.handler('select', 'accepted', b.set('files', s.multiple === false ? add : `[...${b.read('files')}, ...${add}]`)),
        onRemove: b.handler('remove', 'id', b.set('files', `${b.read('files')}.filter(file => file.id !== id)`)),
        onRetry: b.handler('retry', 'id', b.set('files', `${b.read('files')}.map(file => file.id === id ? { ...file, status: "done" } : file)`)),
        ...(b.native ? { onPick: b.handler('pick', '', '// Connect the app\'s picker, for example expo-document-picker.\nreturn [{ name: "영수증_12월.pdf", size: 245760, type: "application/pdf" }];', true) } : {}),
      }); break;
    }
    case 'KjunQuantityStepper':
      content = b.node(name, { value: b.state('quantity', s.decimal ? 1.25 : 2), onValueChange: b.update('quantity'), min: s.negative ? -10 : 0, max: 10, step: s.decimal ? .1 : 1, precision: s.decimal ? 2 : 0,
        ...b.props('disabled', 'error', 'size', 'block'), onChangeCommit: commit(), onInvalidInput: b.handler('invalid', 'draft', b.result('"잘못된 수량: " + draft')),
      }); break;
    case 'KjunNumberInput': {
      // The wording follows the format; the value is a normalized string the app owns, and a range is checked when the edit is committed.
      // The error text reads like the built-in range message.
      const unit = !!s.unit, prefixed = !unit && !!s.prefix, format = unit || prefixed ? 'number' : String(s.format ?? 'number');
      const decimals = prefixed ? 2 : unit ? Math.max(1, Number(s.decimals)) : Number(s.decimals) > 0 ? Number(s.decimals) : undefined;
      const spec = unit ? { label: '몸무게', prefix: undefined, suffix: 'kg', value: '62.5', min: 0, max: 300, error: '300kg 이하로 입력해 주세요' }
        : prefixed ? { label: '단가', prefix: '$', suffix: undefined, value: '1234.50', min: 0, max: 100000, error: '100,000 이하로 입력해 주세요' }
        : format === 'amount' ? { label: '보낼 금액', prefix: undefined, suffix: '원', value: '1250000', min: 1000, max: undefined, error: '1,000원 이상 입력해 주세요' }
        : format === 'percent' ? { label: '목표 수익률', prefix: undefined, suffix: undefined, value: '12.5', min: undefined, max: 100, error: '100% 이하로 입력해 주세요' }
        : { label: '참여 인원', prefix: undefined, suffix: '명', value: '12480', min: 1, max: 100000, error: '100,000명 이하로 입력해 주세요' };
      numberLabel = spec.label; numberError = spec.error;
      content = b.node(name, { value: b.state('amount', spec.value), onValueChange: b.update('amount'), format: format === 'number' ? undefined : format, decimals, prefix: spec.prefix, suffix: spec.suffix, min: spec.min, max: spec.max,
        readingAid: s.readingAid ? true : undefined, align: s.align === 'end' ? 'end' : undefined, ...b.props('disabled', 'error', 'size'), onChangeCommit: commit() }); break;
    }
    default: throw Error('기본 사용 코드 생성기 누락: ' + name);
  }
  // A visible label and error text so the error state never relies on the border color alone.
  const fieldLabels: Record<string, [string, string]> = { KjunTimePicker: ['알림 시각', '알림 시각을 선택해 주세요.'], KjunColorPicker: ['라벨 색', '라벨 색을 선택해 주세요.'], KjunFileUpload: ['증빙 자료', '증빙 자료를 첨부해 주세요.'], KjunQuantityStepper: ['주문 수량', '주문 수량을 확인해 주세요.'], KjunNumberInput: [numberLabel, numberError] };
  if (fieldLabels[name]) content = b.node('KjunFormGroup', { label: fieldLabels[name][0], error: s.error ? fieldLabels[name][1] : '' }, content);
  if (['KjunTimePicker', 'KjunColorPicker', 'KjunFileUpload', 'KjunQuantityStepper', 'KjunNumberInput'].includes(name)) content = b.node(b.native ? 'View' : 'div', { style: { width: b.native ? 360 : '360px', maxWidth: '100%' } }, content);
  return b.finish(content);
}

// Spaces and a menu panel: one side navigation collapsed with names (railLabels) picks the space, a second one lists that
// space's pages densely. The app keeps both values; choosing a space opens its first page.
function sideNavigationSpaces(b: UsageBuilder) {
  const spaces = b.data('spaces', [{ key: 'home', label: '홈', href: '#home', icon: 'home' }, { key: 'projects', label: '프로젝트', href: '#projects', icon: 'folder' },
    { key: 'team', label: '팀', href: '#team', icon: 'building', badge: true }, { key: 'settings', label: '설정', href: '#settings', icon: 'settings' }]);
  b.data('pages', {
    home: [{ key: 'overview', label: '개요', href: '#overview', icon: 'chart-bar' }, { key: 'requests', label: '받은 요청', href: '#requests', icon: 'bell', badge: 4 }],
    projects: [{ key: 'board', label: '보드', href: '#board', icon: 'clipboard-list' },
      { title: '즐겨찾기', items: [{ key: 'brand', label: '브랜드 웹사이트', href: '#brand', icon: 'world', badge: 8 }, { key: 'checkout', label: '결제 화면 개선', href: '#checkout', icon: 'currency-won' }] },
      { title: '보관', items: [{ key: 'archive', label: '보관함', href: '#archive', icon: 'box' }] }],
    team: [{ key: 'members', label: '구성원', href: '#members', icon: 'user' }, { key: 'invites', label: '초대', href: '#invites', icon: 'mail', badge: true }],
    settings: [{ key: 'profile', label: '프로필', href: '#profile', icon: 'user' }, { key: 'billing', label: '결제', href: '#billing', icon: 'wallet' }],
  });
  const plain = b.native ? '' : 'event.preventDefault();\n';
  const column = (width: number, child: string) => b.node(b.native ? 'View' : 'div', { style: { width: b.vue ? width + 'px' : width } }, child);
  return b.group([b.node(b.native ? 'View' : 'div', { style: b.native ? { flexDirection: 'row', alignItems: 'flex-start', gap: 8 } : { display: 'flex', alignItems: 'flex-start', gap: b.vue ? '8px' : 8 } }, [
    column(72, b.node('KjunSideNavigation', { ariaLabel: '공간', items: spaces, value: b.state('space', 'projects'), collapsed: true, railLabels: true,
      onNavigate: b.handler('chooseSpace', 'key, event', plain + b.set('space', 'key') + '\n' + b.set('destination', 'pages[key][0].key')) })),
    column(240, b.node('KjunSideNavigation', { ariaLabel: '메뉴', items: expr('pages[state.space]'), value: b.state('destination', 'board'), density: 'compact',
      onNavigate: b.handler('navigate', 'key, event', plain + b.set('destination', 'key')) })),
  ].join('\n')), b.text(expr('"현재 위치: " + state.space + " / " + state.destination'))]);
}
