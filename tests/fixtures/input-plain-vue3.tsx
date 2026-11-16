import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const Page = defineComponent({ setup() {
  const title = ref('3분기 여행 계획'), empty = ref(''), note = ref('아침에 다녀옴.'), draft = ref('보낼 글');
  const bind = (target: { value: string }) => ({ modelValue: target.value, 'onUpdate:modelValue': (next: string) => { target.value = next; } });
  return () => <main style={{ padding: '24px', width: '480px' }}>
    <p data-testid="guide" style={{ margin: 0 }}>작업 공간 / 여행</p>
    <K.KjunInput variant="plain" ariaLabel="제목" {...bind(title)} />
    <K.KjunInput variant="plain" ariaLabel="빈 제목" {...bind(empty)} errorMessage="제목을 입력해 주세요." />
    <K.KjunInput variant="plain" ariaLabel="잠긴 제목" modelValue="잠긴 제목" disabled />
    <K.KjunInput variant="plain" ariaLabel="검색" prefixIcon="search" clearable {...bind(title)} />
    <K.KjunTextarea variant="plain" ariaLabel="본문" {...bind(note)} />
    <K.KjunTextarea variant="plain" ariaLabel="보낼 글" {...bind(draft)} showCount maxLength={100} submitLabel="보내기" onSubmit={() => {}} />
    <K.KjunInput ariaLabel="기본" {...bind(title)} />
  </main>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
