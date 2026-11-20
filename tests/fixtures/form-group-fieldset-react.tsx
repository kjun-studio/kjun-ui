import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// FormGroup as="fieldset": three weekday boxes with a hint and a save that reports an error and focuses the group by id,
// a FilterGroup whose first option is disabled under a label with labelEnd, and a plain field for comparison.
function App() {
  const [days, setDays] = useState<string[]>([]), [error, setError] = useState(''), [rooms, setRooms] = useState<string[]>([]);
  return <K.KjunProvider><div style={{ padding: 16, width: 360 }}>
    <K.KjunFormGroup as="fieldset" id="weekdays" label="반복 요일" hint="하나 이상 고르세요" error={error}>
      {['월', '화', '수'].map(day => <K.KjunCheckbox key={day} label={day} val={day} value={days}
        onValueChange={next => { setDays(next as string[]); setError(''); }} />)}
    </K.KjunFormGroup>
    <K.KjunFormGroup as="fieldset" id="rooms" label="기기" labelEnd="0/2">
      <K.KjunFilterGroup multiple value={rooms} onValueChange={next => setRooms(next as string[])}
        options={[{ value: 'light', label: '조명', disabled: true }, { value: 'plug', label: '플러그' }]} />
    </K.KjunFormGroup>
    <K.KjunFormGroup id="name" label="이름"><K.KjunInput value="" /></K.KjunFormGroup>
    <K.KjunButton onClick={() => { if (!days.length) { setError('요일을 하나 이상 고르세요'); document.getElementById('weekdays')?.focus(); } }}>저장</K.KjunButton>
  </div></K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
