// KjunText, KjunStack and KjunInline cases shared by every platform fixture.
export const variants = ['pageTitle', 'sectionTitle', 'cardTitle', 'body', 'label', 'meta', 'caption',
  'numberSm', 'numberMd', 'numberLg', 'displaySm', 'displayMd', 'displayLg'] as const;
export const tones = ['default', 'secondary', 'tertiary', 'disabled'] as const;
export const toneTexts = { default: '기본', secondary: '보조', tertiary: '흐림', disabled: '비활성' };
export const longSentence = '한 줄로 줄여야 하는 아주 긴 안내 문장입니다. '.repeat(8);
export const boxCss = '.app-box{height:20px;width:40px;background:#cccccc}.app-wide{width:60px}'
  // An ordinary app content rule (0,1,1): KjunText inside it keeps KJUN margin and color.
  + '.app-prose p{margin:0 0 30px;color:rgb(1, 2, 3)}';
export const narrowNumber = '12,345,678';
export const formLabels = { stack: ['스택 이름 1', '스택 이름 2'], free: ['폼 이름 1', '폼 이름 2'] };
