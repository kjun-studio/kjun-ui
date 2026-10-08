import actions from './actions.mjs';
import inputs from './inputs.mjs';
import navigation from './navigation.mjs';
import layout from './layout.mjs';
import feedback from './feedback.mjs';
import display from './data-display.mjs';
import finance from './finance.mjs';
import { profiles, notApplicable } from './profiles.mjs';
import { platformBehavior } from './behavior.mjs';
export const platforms = ['vue2', 'react', 'native'];
export const items = ['keyboard', 'labeling', 'focus'];
export const itemLabels = { keyboard: '키보드 동작', labeling: '라벨·오류 연결', focus: '포커스 이동·복귀' };
const rows = [...actions, ...inputs, ...navigation, ...layout, ...feedback, ...display, ...finance];
export const targets = rows.map(([name, profile, api, subject, scenario]) => ({ name, profile, api, subject, scenario }));
const responsibilities = {
  keyboard: '실행·선택 콜백과 제어 상태를 연결하고 실제 업무의 비활성 조건을 제공합니다. 사용자 정의 슬롯의 키보드 동작은 프로젝트가 구현합니다.',
  labeling: '사용 목적을 나타내는 이름·단위·대체 텍스트를 제공하고, 검증 오류를 텍스트로 전달합니다. 사용자 지정 ID는 화면 전체에서 유일하게 관리합니다.',
  focus: '열기 트리거를 유지하고 화면 전환·항목 삭제 후의 다음 포커스를 정합니다. 추가한 슬롯과 실제 화면 순서를 함께 검증합니다.',
};
export function definitions() {
  return targets.flatMap(target => platforms.flatMap(platform => items.map((item, index) => {
    const contract = platform === 'native' && ['select', 'search', 'time'].includes(target.profile) && item === 'keyboard'
      ? { procedure: '키보드로 Native 선택 Modal을 열고 내부 입력·radio 옵션에서 방향키와 Enter로 값을 선택합니다.', expected: 'Modal 내부 활성 옵션이 방향키에 반응하고 Enter로 선택값을 전달하며 닫힙니다.' }
      : platform === 'native' && ['select', 'search', 'time'].includes(target.profile) && item === 'focus'
      ? { procedure: '키보드 진입으로 열린 Modal의 초기 포커스를 확인하고 Escape로 닫습니다.', expected: '내부 입력 또는 옵션으로 포커스가 이동하고 닫힌 뒤 외부 입력·트리거로 복귀합니다.' }
      : target.profile === 'boundary' && platform === 'vue2' && item === 'keyboard'
      ? { procedure: '자식 렌더에서 오류를 발생시키고 새로고침 버튼을 키보드로 실행합니다.', expected: 'fallback 메시지가 오류를 설명하고 페이지를 다시 불러옵니다. Vue는 reset 콜백 대신 새로고침을 제공합니다.' }
      : profiles[target.profile]?.[index];
    if (!profiles[target.profile]) throw Error('Unknown accessibility profile: ' + target.profile);
    const native = platform === 'native';
    return {
      id: `${target.name}.${platform}.${item}.v1`, component: target.name, platform, item, label: itemLabels[item],
      profile: target.profile, scenario: target.scenario,
      behavior: contract ? platformBehavior(target, platform, item) : notApplicable(target.profile, item, target.subject),
      responsibility: responsibilities[item],
      platformNote: native
        ? 'Native는 Pressable·TextInput·Modal과 접근성 속성을 사용합니다. 이 검사는 Native Web의 DOM·키보드 결과만 확인합니다. iOS·Android 기기와 스크린리더 검증은 미실행입니다.'
        : platform === 'vue2' ? 'Vue 2의 DOM 속성·이벤트·슬롯 조합을 검사합니다. React와 동일한 속성 전달이나 포커스 구현을 가정하지 않습니다.'
          : 'React DOM·React Aria의 실제 출력과 키보드 상호작용을 검사합니다. 스크린리더 발화 검증은 포함하지 않습니다.',
      api: (typeof target.api === 'string' ? target.api : target.api[platform]).split(' ').filter(Boolean),
      applicable: !!contract, reason: contract ? null : notApplicable(target.profile, item, target.subject),
      procedure: contract?.procedure || '정의된 비대화형 조건을 확인합니다. 실행 가능한 접근성 검사는 해당 없음으로 기록합니다.',
      expected: contract?.expected || notApplicable(target.profile, item, target.subject),
      limitation: '명시된 예제·설정의 자동 DOM·키보드 검사입니다. 전체 접근성 준수, 색 대비, 스크린리더 발화, 실제 기기 지원을 보증하지 않습니다.',
    };
  })));
}
