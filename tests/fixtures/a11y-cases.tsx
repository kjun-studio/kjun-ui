import { useState, type ComponentType } from 'react';
// Deliberately assembled by a consumer, with no package source imports.
export function AccessibilityCase({ ui, native = false }: { ui: Record<string, any>; native?: boolean }) {
  const params = new URLSearchParams(location.search), target = params.get('component') || 'DsInput';
  const fieldName = target === 'DsFormGroup' ? 'DsInput' : target;
  const [value, setValue] = useState<any>(fieldName === 'DsDatePicker' ? '2026-09-12' : fieldName === 'DsQuantityStepper' ? 2 : ''),
    [error, setError] = useState(''), [disabled, setDisabled] = useState(false), [required, setRequired] = useState(true),
    [readOnly, setReadOnly] = useState(false), [fieldRequired, setFieldRequired] = useState<boolean | undefined>(),
    [broken, setBroken] = useState(true), [resets, setResets] = useState(0);
  Object.assign(window, { configureA11y: (next: { error?: string; disabled?: boolean; required?: boolean; fieldRequired?: boolean; readOnly?: boolean }) => {
    if ('error' in next) setError(next.error || '');
    if ('disabled' in next) setDisabled(!!next.disabled);
    if ('required' in next) setRequired(!!next.required);
    if ('readOnly' in next) setReadOnly(!!next.readOnly);
    if ('fieldRequired' in next) setFieldRequired(next.fieldRequired);
  } });
  const Field: ComponentType<any> = ui[fieldName], Group = ui.DsFormGroup, Boundary = ui.DsErrorBoundary;
  function Broken(): any { if (broken) throw Error('Intentional accessibility boundary fixture'); return '복구 완료'; }
  if (target === 'DsErrorBoundary') return <><Boundary fallbackMessage="예제 렌더 오류" onReset={() => { setResets(v => v + 1); setBroken(false); }}><Broken /></Boundary><output data-testid="resets">{resets}</output></>;
  return <>
    <button data-testid="field-before">입력 앞</button>
    {[0, 1].map(index => <div key={index} data-field={index}>
      <Group label={`검증 필드 ${index + 1}`} hint={`도움말 ${index + 1}`} error={error} required={required}>
        <Field value={value} {...(native ? { onChangeText: setValue } : { onValueChange: setValue })} disabled={disabled}
          required={fieldRequired} readOnly={readOnly} error={!!error} {...(fieldName === 'DsInput' ? { errorMessage: error } : {})} />
      </Group>
    </div>)}
    <output data-testid="field-value">{String(value)}</output>
    <button data-testid="field-after">입력 뒤</button>
  </>;
}
