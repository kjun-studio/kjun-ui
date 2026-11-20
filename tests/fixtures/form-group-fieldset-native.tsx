import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { View } from 'react-native';
import * as K from '@kjun-ui/native';
import { demoFont, demoPalettes } from '../../shared/demo-colors';
// Native names the group view; it has no element ids, so the id is not handed to a choice.
function App() {
  const [days, setDays] = useState<string[]>([]), [error, setError] = useState('');
  return <K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><View style={{ padding: 16, width: 360 }}>
    <K.KjunFormGroup as="fieldset" id="weekdays" label="반복 요일" hint="하나 이상 고르세요" error={error}>
      {['월', '화', '수'].map(day => <K.KjunCheckbox key={day} label={day} val={day} value={days} onValueChange={next => setDays(next as string[])} />)}
    </K.KjunFormGroup>
    <K.KjunFormGroup id="name" label="이름"><K.KjunInput value="" /></K.KjunFormGroup>
    <K.KjunButton onPress={() => { if (!days.length) setError('요일을 하나 이상 고르세요'); }}>저장</K.KjunButton>
  </View></K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
