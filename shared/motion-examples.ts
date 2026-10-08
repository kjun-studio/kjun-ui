import type { GuideCase } from './visual-guides/types';

export const motionExampleNames = ['GuideMotionToast', 'GuideMotionNumber'];
// The document and packed source compilation use these same scenarios.
// tab, hint and timing describe the docs playground; timing names motion token keys.
export type MotionTiming = [duration: string, curve: string | null];
export const motionScenarios: { name: string; destination: string; tab: string; hint: string; timing: MotionTiming[]; scenario: GuideCase }[] = [
  { name: 'DsTabs', destination: '/components/tabs',
    tab: '선택선', hint: '탭을 바꾸면 내용은 바로 바뀌고 선택선은 새 위치로 이어집니다.', timing: [['indicator', 'easeOut']], scenario: {
    id: 'motion-tabs', label: 'Tabs · 선택선 이동',
    description: '첫 탭과 둘째 탭을 빠르게 왕복하세요. 선택 상태와 내용은 즉시 바뀌고 선택선은 새 위치로 이어집니다.',
    values: { tab: 'one' },
  } },
  { name: 'DsAccordion', destination: '/components/accordion',
    tab: '펼침', hint: '항목을 펼치는 도중 다시 누르면 현재 높이에서 방향이 바뀝니다.', timing: [['collapse', 'easeOut']], scenario: {
    id: 'motion-accordion', label: 'Accordion · 펼침과 접힘',
    description: '첫 항목을 열고 펼쳐지는 도중 다시 누르세요. 현재 높이에서 방향이 바뀝니다.',
  } },
  { name: 'DsModal', destination: '/components/modal',
    tab: '모달', hint: '모달을 열고 닫아 보세요. 닫으면 열기 버튼으로 포커스가 돌아옵니다.', timing: [['layerEnter', 'easeOut'], ['layerExit', 'easeIn']], scenario: {
    id: 'motion-modal', label: 'Modal · 등장과 퇴장',
    description: '모달을 열고 닫기 버튼이나 Escape로 닫으세요. 퇴장 후 모달 열기 버튼으로 포커스가 돌아옵니다.',
    values: { open: false }, viewportHeight: 600,
  } },
  { name: 'DsDrawer', destination: '/components/drawer',
    tab: '패널', hint: '패널이 가장자리에서 들어오고 나가는 움직임을 살펴보세요.', timing: [['layerEnter', 'easeEmphasized'], ['layerExit', 'easeIn']], scenario: {
    id: 'motion-drawer', label: 'Drawer · 가장자리에서 이동',
    description: '패널을 열고 닫으세요. 패널 크기만큼 가장자리에서 이동하며 닫힌 뒤 트리거로 포커스가 돌아옵니다.',
    values: { open: false }, viewportHeight: 600,
  } },
  { name: 'GuideMotionToast', destination: '/feedback',
    tab: '알림', hint: '알림을 표시한 뒤 중간 알림을 닫아 남은 알림의 이동을 살펴보세요.', timing: [['toastMove', 'easeOut'], ['toastExit', 'easeIn']], scenario: {
    id: 'motion-toast', label: 'Toast · 알림 재배치',
    description: '세 알림을 표시한 뒤 알림 2의 중간 알림 닫기를 누르세요. 자동으로 닫히지 않습니다. 남은 알림은 새 위치로 이동하며, 동작 줄이기를 켜면 즉시 배치합니다.',
    viewportHeight: 600,
  } },
  { name: 'GuideMotionNumber', destination: '/components/animated-number',
    tab: '숫자', hint: '숫자가 증가하는 중 120을 누르면 현재 값에서 새 목표로 이어집니다.', timing: [['number', null]], scenario: {
    id: 'motion-number', label: 'AnimatedNumber · 목표값 변경',
    description: '100에서 1000으로 올린 뒤, 증가하는 도중 120을 누르세요. 현재 표시값에서 새 목표값으로 이어집니다.',
    values: { number: 100 },
  } },
];
