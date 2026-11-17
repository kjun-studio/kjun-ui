// KjunText, KjunStack and KjunInline cases shared by every platform fixture.
export const variants = ['pageTitle', 'sectionTitle', 'cardTitle', 'bodyLg', 'body', 'bodyLong', 'label', 'labelStrong', 'meta', 'caption', 'captionStrong',
  'numberSm', 'numberMd', 'numberLg', 'displaySm', 'displayMd', 'displayLg'] as const;
export const tones = ['default', 'secondary', 'tertiary', 'disabled', 'brand', 'danger', 'success', 'warning', 'info',
  'inverse', 'onBrand', 'onDanger', 'onSuccess', 'onWarning'] as const;
export const toneTexts = { default: '기본', secondary: '보조', tertiary: '흐림', disabled: '비활성', brand: '브랜드', danger: '위험', success: '성공',
  warning: '경고', info: '안내', inverse: '반전', onBrand: '브랜드 면', onDanger: '위험 면', onSuccess: '성공 면', onWarning: '경고 면' };
// Each tone and the public color variable it resolves to on Web.
export const toneProbes = { secondary: '--kjun-text-secondary', danger: '--kjun-danger', info: '--kjun-info', onDanger: '--kjun-on-danger, var(--kjun-inverse)' } as const;
export const longSentence = '한 줄로 줄여야 하는 아주 긴 안내 문장입니다. '.repeat(8);
export const boxCss = '.app-box{height:20px;width:40px;background:#cccccc}.app-wide{width:60px}'
  // An ordinary app content rule (0,1,1): KjunText inside it keeps KJUN margin and color.
  + '.app-prose p{margin:0 0 30px;color:rgb(1, 2, 3)}'
  // An app list rule (0,1,1) that would paint a divider li like a card, and an app class that sets its own gap.
  + '.app-steps li{padding:12px;background:#ffffff;min-height:40px}.app-gap{gap:40px}';
export const narrowNumber = '12,345,678';
export const formLabels = { stack: ['스택 이름 1', '스택 이름 2'], free: ['폼 이름 1', '폼 이름 2'] };
