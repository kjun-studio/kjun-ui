import { tokens } from '@kjun-ui/tokens';
import { filledIcons } from '@kjun-ui/tokens/icons';
import type { ExampleTools } from './example-tools';
export function renderIconExample(name: string, tools: ExampleTools): any {
  const { h, settings, platform, get, set, action } = tools;
  switch (name) {
    case 'GuideIconSelection':
      return h('Group', {}, [
        h('DsIcon', { name: settings.name, size: platform === 'vue2' ? settings.size + 'px' : settings.size, filled: settings.filled }),
        h('Text', {}, settings.name + ' · ' + settings.size + (platform === 'native' ? ' 논리 단위' : 'px') + (settings.filled ? ' · 채움형' : ' · 선형')),
      ]);
    case 'GuideIconAlignment': {
      const fontSize = get('largeText', false) ? 24 : 16;
      return h('Stack', {}, [
        // Bottom alignment keeps every size label on one baseline.
        h('Group', { style: { alignItems: 'flex-end' } }, Object.entries(tokens.iconSizes).map(([role, size]) => h('Stack', {}, [
          h('DsIcon', { name: 'star', size: platform === 'vue2' ? size + 'px' : size }), h('Text', {}, role + ' · ' + size),
        ]))),
        h('Group', {}, [h('DsIcon', { name: 'check', size: platform === 'vue2' ? '16px' : 16 }), h('Text', {}, '저장을 완료했습니다.')]),
        h(platform === 'native' ? 'IconAlignmentRow' : 'Group', { style: { alignItems: 'flex-start', flexWrap: 'nowrap', maxWidth: platform === 'vue2' ? '260px' : 260 } }, [
          h('DsIcon', { name: 'info-circle', size: platform === 'vue2' ? '16px' : 16 }),
          h('Text', { style: { flex: 1, minWidth: 0 } }, '긴 안내는 두 줄로 나눕니다. 아이콘은 첫 줄 옆에 둡니다.'),
        ]),
        h('Group', {}, [h('DsButton', { prefixIcon: 'plus' }, '추가'), h('DsButton', { suffixIcon: 'arrow-right' }, '계속')]),
        ...(platform === 'native' ? [h('Text', {}, 'Native 기본 크기는 16 논리 단위입니다. 웹의 em 상속과 구분합니다.')] : [
          h('Group', {}, [h('DsButton', { variant: 'secondary', size: 'sm', ...action(() => set('largeText', !get('largeText', false))) }, '글자 크기 ' + (fontSize === 16 ? '24' : '16') + 'px로 변경')]),
          h('Group', { style: { fontSize: platform === 'vue2' ? fontSize + 'px' : fontSize } }, [h('DsIcon', { name: 'heart' }), h('Text', {}, '기본 1em · ' + fontSize + 'px')]),
          h('Group', { style: { fontSize: platform === 'vue2' ? fontSize + 'px' : fontSize } }, [h('DsIcon', { name: 'heart', size: platform === 'vue2' ? '16px' : 16 }), h('Text', {}, '명시한 16px')]),
        ]),
      ]);
    }
    case 'GuideIconVariants':
      return h('Stack', {}, [
        ...Object.keys(filledIcons).map(icon => h('Group', {}, [h('Text', {}, icon), h('DsIcon', { name: icon }), h('Text', {}, '선형'), h('DsIcon', { name: icon, filled: true }), h('Text', {}, '채움형')])),
        h('Group', {}, [h('DsIcon', { name: 'search', filled: true }), h('Text', {}, 'search + filled → search 선형')]),
        h('Group', {}, [h('DsIcon', { name: 'not-a-kjun-icon' }), h('Text', {}, '없는 이름 → help-circle')]),
      ]);
  }
}
