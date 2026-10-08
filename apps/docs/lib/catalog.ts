import guides from '../../../shared/component-guides.json';
import { documents } from './discovery';
export const routes = documents;
export type PageId = string;
export const findPage = (id: PageId) => routes.find((x) => x.id === id)!;
export const componentNameFor = (id: string) => Object.entries(guides).find(([,guide])=>guide.slug===id)?.[0];
export const componentGuides = {
  button: {
    title: '행동의 중요도를 구분하세요.',
    paragraph:
      '한 영역의 주된 행동에는 primary를, 보조 행동에는 secondary나 ghost를 사용합니다. 같은 툴바 안에서는 아이콘 전용 또는 텍스트 전용으로 라벨 모드를 통일합니다.',
    do: '보조 버튼은 텍스트만, 또는 접근성 이름이 있는 아이콘만 사용합니다.',
    dont: '보조 버튼에 장식 아이콘과 텍스트를 동시에 붙이지 않습니다.',
    rows: [
      [
        'variant',
        'primary | secondary | ghost | danger | danger-ghost | success | warning',
        'primary',
        '행동의 중요도와 의미',
      ],
      ['size', 'xs | sm | md | lg | xl', 'md', '24 · 32 · 40 · 48 · 56px'],
      ['loading', 'boolean', 'false', '최소 400ms 표시하며 중복 실행 차단'],
      ['disabled', 'boolean', 'false', '실행 차단, 비활성 표현'],
      ['block', 'boolean', 'false', '가용 너비 전체 사용'],
      ['prefixIcon / suffixIcon', 'string', '—', '앞·뒤 아이콘 이름'],
      ['ariaLabel', 'string', '—', '아이콘 전용 버튼의 접근성 이름'],
      ['spinOnLoading', 'boolean', '자동', 'refresh 아이콘의 로딩 회전 여부'],
      ['click / onClick / onPress', 'event', '—', '플랫폼별 실행 이벤트'],
    ],
  },
  input: {
    title: '필드의 맥락에 맞는 크기를 사용하세요.',
    paragraph:
      '기본 필드는 md(40px), 작성·설정 폼은 lg(48px), 표·검색 툴바는 sm(32px)을 사용합니다. 같은 줄의 버튼도 같은 size로 맞춥니다. 기존 md의 48px 높이가 필요하면 lg를 지정하세요. 오류 상태에서는 포커스가 있어도 오류 테두리를 유지합니다.',
    do: 'DsFormGroup으로 라벨·안내·오류를 필드와 연결합니다.',
    dont: 'placeholder만으로 입력의 목적을 설명하지 않습니다.',
    rows: [
      ['value', 'string | number', '필수 / Vue: ""', '제어형 입력값'],
      ['size', 'sm | md | lg', 'md', '32 · 40 · 48px (기존 md 48→40, lg 52→48)' ],
      ['disabled', 'boolean', 'false', '입력과 지우기 동작 차단'],
      [
        'readonly / readOnly',
        'boolean',
        'false',
        '값 표시를 유지하고 편집 차단',
      ],
      [
        'error / errorMessage',
        'boolean / string',
        'false / ""',
        '오류 상태와 설명',
      ],
      ['clearable', 'boolean', 'false', '값이 있을 때 지우기 버튼 표시'],
      ['prefixIcon / suffixIcon', 'string', '—', '입력 양쪽의 보조 아이콘'],
      ['ariaLabel', 'string', '—', '별도 라벨이 없는 필드의 접근성 이름'],
      [
        'input / onChange / onChangeText',
        'event',
        '—',
        '플랫폼별 값 변경 이벤트',
      ],
    ],
  },
  modal: {
    title: '완료와 닫기의 의미를 구분하세요.',
    paragraph:
      'confirm은 확인 이벤트만 전달합니다. 작업 완료 후 닫기는 소비 코드에서 결정합니다. 취소는 cancel → 닫힘 상태 변경 → close 순서로 처리하며, 닫은 뒤에는 이전 포커스로 돌아갑니다.',
    do: '저장 폼에서는 입력 md와 푸터 버튼 lg를 함께 사용합니다.',
    dont: '비동기 저장을 시작하자마자 성공으로 간주해 모달을 닫지 않습니다.',
    rows: [
      [
        'value / open',
        'boolean',
        'false / 필수',
        'Vue v-model / React·Native 제어 상태',
      ],
      ['title', 'string', '""', '접근성 이름으로도 사용되는 제목'],
      [
        'size',
        'sm | md | lg | xl | full',
        'md',
        '400 · 560 · 720 · 900px 또는 전체',
      ],
      ['closable', 'boolean', 'true', '헤더 닫기 버튼 표시'],
      [
        'closeOnOverlay / closeOnEsc',
        'boolean',
        'true',
        '바깥 영역·Escape / Native 뒤로 가기',
      ],
      [
        'showHeader / showFooter',
        'boolean',
        'true / false',
        '헤더·기본 푸터 표시',
      ],
      [
        'showConfirmButton / showCancelButton',
        'boolean',
        'true',
        '기본 푸터 액션 표시',
      ],
      ['confirmText / cancelText', 'string', '확인 / 취소', '기본 푸터 라벨'],
      [
        'confirmDisabled / loading',
        'boolean',
        'false',
        '확인 동작의 비활성·로딩',
      ],
      [
        'confirmVariant',
        'primary | danger | success',
        'primary',
        '확인 행동의 의미',
      ],
      ['footerSize', 'sm | md | lg', 'md', '저장 폼은 lg 권장'],
      [
        'noPadding / height',
        'boolean / string·number',
        'false / —',
        '본문 여백과 프레임 높이',
      ],
      [
        'header / footer / children',
        'slot / ReactNode',
        '—',
        '사용자 정의 내용',
      ],
      ['confirm / cancel / close', 'event', '—', '확인·취소·닫기 이벤트'],
    ],
  },
} as const;
