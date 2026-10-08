import { UsageBuilder, expr, literal, type UsageInput } from './builder';
import { defaultOptions, buttonComparisons, inputComparisons, fieldOptions, formActionsComparisons } from '../../previews/catalog/example-tools';
import { iconToggleExample } from './icon-toggle';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), { name, settings: s } = input;
  const field = (key = 'input', label = '입력 예제') => b.node('DsInput', {
    value: b.state(key, ''), onValueChange: b.update(key), ariaLabel: label,
    ...b.props('size', 'disabled', 'readOnly'), disabled: s.childDisabled ?? s.disabled ?? false,
    error: !!s.error || !!s.errorMessage, clearable: true, placeholder: '내용을 입력하세요',
  });
  const options = () => b.data('options', ['DsSelect', 'DsCombobox'].includes(name) ? fieldOptions(name, s.data) : s.data === 'empty' ? [] : defaultOptions.map(option => s.data === 'long' ? { ...option, label: option.label + ' · 긴 옵션 이름과 설명을 함께 표시합니다' } : option));
  let content: string;
  switch (name) {
    case 'DsButton': {
      const cases = buttonComparisons[String(s.comparison)];
      if (cases) {
        const wrapper = b.native ? 'View' : 'div';
        content = b.node(wrapper, { style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: b.native ? 12 : '12px' } },
          cases.map(item => b.node(wrapper, { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: b.native ? 12 : '12px' } },
            [b.text(item.caption), b.node(name, { ...b.props('size', 'variant', 'disabled', 'loading'), ...item.props }, item.label ? b.text(item.label) : '')].join('\n'),
          )).join('\n'));

        break;
      }
      // Keep the first example small enough to read without scrolling through setup.
      const count = literal(Object.hasOwn(input.values, 'count') ? input.values.count : 0);
      const props = ['size', 'variant', 'disabled', 'loading', 'block'].map(key => b.vue ? (typeof s[key] === 'string' ? `${key}="${String(s[key]).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"` : `:${key}="${literal(s[key])}"`) : `${key}={${literal(s[key])}}`);
      if (s.iconOnly) props.push(b.vue ? 'prefix-icon="plus" aria-label="항목 추가"' : 'prefixIcon="plus" ariaLabel="항목 추가"');
      const event = b.vue ? '@click="count++"' : `${b.native ? 'onPress' : 'onClick'}={() => setCount(count => count + 1)}`;
      const label = s.iconOnly ? '' : '계속하기';
      const code = b.vue ? `<template>\n  <div>\n    <DsButton\n      ${props.slice(0, 2).join(' ')}\n      ${props.slice(2).join(' ')}\n      ${event}\n    >${label}</DsButton>\n    <output>{{ count }}번 실행했습니다</output>\n  </div>\n</template>\n\n<script>\nimport { DsButton } from "@kjun-ui/vue2";\n\nexport default {\n  components: { DsButton },\n  data() { return { count: ${count} }; },\n};\n</script>\n`
        : `import { useState } from "react";\nimport { DsButton } from "@kjun-ui/${input.platform}";\n${b.native ? 'import { View, Text } from "react-native";\n' : ''}\nexport default function Example() {\n  const [count, setCount] = useState(${count});\n  return (\n    <${b.native ? 'View' : 'div'}>\n      <DsButton\n        ${props.slice(0, 2).join(' ')}\n        ${props.slice(2).join(' ')}\n        ${event}\n      >${label}</DsButton>\n      <${b.native ? 'Text' : 'output'}>{count}번 실행했습니다</${b.native ? 'Text' : 'output'}>\n    </${b.native ? 'View' : 'div'}>\n  );\n}\n`;
      return { code, provider: true as const, domainColors: false, feedback: false };
    }
    case 'DsInput': {
      const cases = inputComparisons[String(s.comparison)];
      const fields = cases ? cases.map((item, index) => b.node('DsFormGroup', {
        label: item.caption, error: item.props?.error ? '목록 이름을 입력해 주세요.' : '',
      }, b.node(name, { size: s.size, value: b.state('inputCase' + index, item.value || ''),
        onValueChange: b.update('inputCase' + index), placeholder: '목록 이름', ...item.props,
      }, '', item.suffix ? { suffix: b.text(item.suffix) } : {}))) : [b.node('DsFormGroup', {
        label: '목록 이름', hint: '동료가 구분할 수 있는 이름을 입력하세요.', error: s.error ? '목록 이름을 입력해 주세요.' : '',
      }, b.node(name, { value: b.state('input', ''), onValueChange: b.update('input'), ...b.props('size', 'disabled', 'readOnly', 'error'), clearable: true, placeholder: '예: 장기 보유 자산' }))];
      content = b.node(b.native ? 'View' : 'div', { style: { width: b.native ? 360 : '360px', maxWidth: '100%' } }, b.native ? b.node('DsFormLayout', { gap: 20 }, fields.join('\n')) : b.node('div', { [b.vue ? 'class' : 'className']: 'ds-form-layout kjun-form-layout', style: { display: 'flex', flexDirection: 'column', gap: '20px' } }, fields.join('\n'))); break;
    }
    case 'DsFormGroup':
      content = b.node(name, { ...b.props('label', 'hint', 'required'), error: s.errorMessage }, field('input', String(s.label))); break;
    case 'DsFormActions': {
      const wrapper = b.native ? 'View' : 'div';
      const props = { ...b.props('size', 'variant', 'cancelVariant', 'confirmText', 'cancelText', 'showCancel', 'showConfirm', 'cancelDisabled'), loading: s.loading, confirmDisabled: s.disabled,
        onConfirm: b.handler('confirm', '', b.result('"확인"')), onCancel: b.handler('cancel', '', b.result('"취소"')) };
      const cases = formActionsComparisons[String(s.comparison)] || [{ caption: '', props: {} }];
      content = b.node(wrapper, { style: { width: b.native ? Number(s.exampleWidth || 360) : `${s.exampleWidth || 360}px`, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: b.native ? 16 : '16px' } },
        cases.map(item => b.node(wrapper, { style: { display: 'flex', flexDirection: 'column', gap: b.native ? 16 : '16px' } },
          [item.caption ? b.text(item.caption) : '', b.node(name, { ...props, ...item.props })].join('\n'))).join('\n'));
      break;
    }
    case 'DsCheckbox': case 'DsSwitch': {
      const key = name === 'DsCheckbox' ? 'checked' : 'switch';
      content = b.node(name, { value: b.state(key, false), onValueChange: b.update(key), disabled: s.disabled, label: name === 'DsCheckbox' ? '알림 받기' : '자동 갱신' }); break;
    }
    case 'DsRadio':
      content = b.node('DsRadioGroup', { value: b.state('radio', 'a'), onValueChange: b.update('radio') }, [
        b.node(name, { val: 'a', label: '첫 선택', disabled: s.disabled }), b.node(name, { val: 'c', label: '다음 선택' }),
      ].join('\n')); break;
    case 'DsRadioGroup':
      content = b.node(name, { value: b.state('radio', 'a'), onValueChange: b.update('radio'), options: options(), ariaLabel: '과일 라디오', ...(b.vue ? b.props('disabled') : {}) }); break;
    case 'DsTextarea':
      content = b.node(name, { value: b.state('textarea', ''), onValueChange: b.update('textarea'), placeholder: '목록의 목적과 공유할 내용을 입력하세요.', ariaLabel: '목록 설명', rows: 3, ...b.props('size', 'disabled', 'error') }); break;
    case 'DsSelect':
      content = b.node(name, { value: b.state('select', s.multiple ? [] : null), onValueChange: b.update('select'),
        open: b.state('selectOpen', false), onOpenChange: b.update('selectOpen'), options: options(), ariaLabel: '공개 범위',
        ...b.props('multiple', 'size', 'searchable', 'clearable', 'disabled', 'loading', 'error') }); break;
    case 'DsCombobox':
      content = b.node(name, { value: b.state('combo', null), onValueChange: b.update('combo'), options: options(), ariaLabel: '자산 선택', clearable: true, ...b.props('size', 'disabled', 'error') }); break;
    case 'DsDatePicker':
      content = b.node(name, { value: b.state('date', '2026-09-12'), onValueChange: b.update('date'), min: '2026-09-01', max: '2026-09-30', ariaLabel: '시작일', ...b.props('size', 'disabled', 'error') }); break;
    case 'DsButtonGroup': case 'DsFilterGroup': {
      const key = name === 'DsButtonGroup' ? 'group' : 'filters';
      content = b.node(name, { value: b.state(key, key === 'group' ? 'a' : ['a']), onValueChange: b.update(key), options: options(), multiple: key === 'filters', disabled: s.disabled, ariaLabel: '과일 보기', ...(key === 'group' ? b.props('size', 'fullWidth') : {}) }); break;
    }
    case 'DsTabs': case 'DsTabPane':
      content = b.node('DsTabs', { value: b.state('tab', 'one'), onValueChange: b.update('tab'), ...b.props('variant', 'density') }, [
        b.node('DsTabPane', { name: 'one', label: '첫 탭' }, b.text('첫 내용')),
        b.node('DsTabPane', { name: 'two', label: '둘째 탭' }, b.text('둘째 내용')),
        b.node('DsTabPane', { name: 'blocked', label: '비활성 탭', disabled: true }, b.text('비활성 내용')),
      ].join('\n')); break;
    case 'DsIconToggle': return iconToggleExample(input);
    case 'DsCopyButton':
      content = b.node(name, { value: 'KJUN UI', text: '복사', disabled: s.disabled,
        copyText: b.declare('copyText', 'async function copyText(value) {\n  // 프로젝트의 클립보드 연결 지점입니다.\n  console.log("복사 요청:", value);\n}'),
        onCopied: b.handler('copied', '', b.result('"복사 완료"')) }); break;
    case 'DsRefreshButton':
      content = b.node(name, { targetName: '목록', ...b.props('mode', 'size', 'disabled', 'loading'), onRefresh: b.handler('refresh', '', b.result('"갱신 요청"')) }); break;
    case 'DsExternalLink':
      content = b.node(name, { href: 'https://example.com', label: '외부 페이지', openUrl: b.declare('openUrl', 'function openUrl(url) {\n  // 프로젝트의 브라우저 또는 Linking 연결 지점입니다.\n  console.log("링크 열기:", url);\n}') }, b.text('외부 페이지')); break;
    case 'DsProgress':
      content = b.group([b.node(name, { value: b.state('progress', 42), showLabel: true, label: '완료율' }), b.button('진행', b.handler('advance', '', b.set('progress', `(${b.read('progress')} + 10) % 101`)))]); break;
    default: throw Error('기본 사용 코드 생성기 누락: ' + name);
  }
  // [label, hint, error]: the error text replaces the hint so the state never relies on color alone.
  const fieldLabels: Record<string, [string, string, string]> = {
    DsTextarea: ['목록 설명', '목록의 목적을 간단히 설명해 주세요.', '목록 설명을 입력해 주세요.'],
    DsSelect: ['공개 범위', '선택한 범위의 사용자만 목록을 볼 수 있습니다.', '공개 범위를 선택해 주세요.'],
    DsCombobox: ['자산 선택', '자산 이름을 입력해 후보를 찾아보세요.', '목록에 있는 자산을 선택해 주세요.'],
    DsDatePicker: ['시작일', '목록을 사용하기 시작할 날짜를 선택하세요.', '시작일을 선택해 주세요.'],
  };
  if (fieldLabels[name]) content = b.node('DsFormGroup', { label: fieldLabels[name][0], hint: fieldLabels[name][1], error: s.error ? fieldLabels[name][2] : '' }, content);
  if (['DsTextarea', 'DsSelect', 'DsCombobox', 'DsDatePicker', 'DsFormGroup'].includes(name)) {
    content = b.node(b.native ? 'View' : 'div', { style: { width: b.native ? 360 : '360px', maxWidth: '100%' } }, content);
  }
  return b.finish(content);
}
