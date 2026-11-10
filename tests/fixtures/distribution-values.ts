// Shared by the React/Native cases and the Vue 3 mirror. Colours are the app's: KJUN draws them as given.
export const blue = '#2459a6', orange = '#e07a2f', red = '#c52f3b';
export const zones = [{ to: 30, label: '저평가', color: blue }, { to: 70, label: '중립' }, { to: 100, label: '고평가', color: orange }];
export const opinions = (bull: number | null, flat: number | null, bear: number | null) =>
  [{ key: 'bull', label: '강세', value: bull, color: red }, { key: 'flat', label: '중립', value: flat }, { key: 'bear', label: '약세', value: bear, color: blue }];
export const times = (value: number) => value + '배';
