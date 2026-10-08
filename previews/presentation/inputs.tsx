import * as K from '@kjun/react';
import { row, stack, field, input, options, noop } from './common';
export function inputs(name: string) {
  switch (name) {
    case 'DsInput': return stack(<>{field(input())}{field(<K.DsInput value="" placeholder="예: 장기 보유 자산" onValueChange={noop} />, '새 목록')}</>);
    case 'DsFormGroup': return <K.DsFormGroup label="목록 이름" hint="동료가 구분할 수 있는 이름을 입력하세요." required>{input()}</K.DsFormGroup>;
    case 'DsFormActions': return <K.DsFormActions size="lg" confirmText="변경 사항 저장" cancelText="취소" />;
    case 'DsTextarea': return field(<K.DsTextarea value="함께 검토할 자산을 모아두는 목록입니다." onValueChange={noop} rows={3} />, '목록 설명');
    case 'DsCheckbox': return stack(<><K.DsCheckbox value label="활동 알림 받기" /><K.DsCheckbox value={false} label="이메일로도 받기" /><K.DsCheckbox value disabled label="필수 알림" /></>);
    case 'DsSwitch': return stack(<><K.DsSwitch value label="활동 알림" /><K.DsSwitch value={false} label="이메일 알림" /><K.DsSwitch value disabled label="보안 알림" /></>);
    case 'DsRadio': return row(<><K.DsRadio value="team" val="private" label="나만 보기" name="visibility" /><K.DsRadio value="team" val="team" label="팀에 공개" name="visibility" /></>);
    case 'DsRadioGroup': return <K.DsRadioGroup value="team" options={options} direction="vertical" ariaLabel="공개 범위" />;
    case 'DsSelect': return field(<K.DsSelect value="team" options={options} onValueChange={noop} ariaLabel="공개 범위" />, '공개 범위');
    case 'DsCombobox': return field(<K.DsCombobox value="team" options={options} onValueChange={noop} ariaLabel="공개 범위 검색" />, '공개 범위');
    case 'DsSearchInput': return field(<K.DsSearchInput value="" placeholder="이름이나 종목 코드" loadOptions={async () => []} onValueChange={noop} ariaLabel="자산 검색" />, '자산 검색');
    case 'DsDatePicker': return field(<K.DsDatePicker value="2026-09-14" onValueChange={noop} ariaLabel="시작일" />, '시작일');
    case 'DsTimePicker': return field(<K.DsTimePicker value="09:30" onValueChange={noop} ariaLabel="알림 시각" />, '알림 시각');
    case 'DsQuantityStepper': return field(<K.DsQuantityStepper value={5} min={1} max={20} onValueChange={noop} ariaLabel="요청 수량" />, '요청 수량');
    case 'DsSlider': return <K.DsSlider value={65} label="알림 음량" onValueChange={noop} />;
    case 'DsRangeSlider': return <K.DsRangeSlider value={[20, 80]} label="알림 범위" onValueChange={noop} />;
  }
}
