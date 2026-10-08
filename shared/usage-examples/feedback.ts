import { UsageBuilder, literal, type UsageInput } from './builder';

export function generate(input: UsageInput) {
  const b = new UsageBuilder(input), s = input.settings;
  b.feedback = true;
  const feedback = b.vue ? 'this.kjunFeedback' : 'feedback';
  const buttons: string[] = [];
  if (['전체', 'Toast'].includes(String(s.service))) buttons.push(b.button('Toast 표시', b.handler('showToast', '',
    `${feedback}.toast.${s.tone === 'danger' ? 'error' : s.tone}(${literal(s.message)}, ${literal({ title: s.title, duration: s.duration, closable: s.closable })});`)));
  const options = (kind: 'confirm' | 'prompt') => Object.entries({ title: s[kind + 'Title'], message: s[kind + 'Message'], confirmText: s.confirmText, cancelText: s.cancelText, type: s.tone })
    .map(([key, value]) => `    ${key}: ${literal(value)},`).join('\n');
  if (['전체', 'Confirm'].includes(String(s.service))) buttons.push(b.button('Confirm 요청', b.handler('requestConfirm', '',
    `try {\n  const confirmed = await ${feedback}.confirm({\n${options('confirm')}\n    onConfirm: async () => {\n${s.confirmAction !== '즉시 완료' ? '      await new Promise(resolve => setTimeout(resolve, 600));\n' : ''}${s.confirmAction === '비동기 실패' ? '      throw Error("저장에 실패했습니다");\n' : '      // 저장 요청을 연결하는 위치입니다.\n'}    },\n  });\n  ${b.result('String(confirmed)')}\n} catch (error) {\n  ${b.result('String(error)')}\n}`, true)));
  if (['전체', 'Prompt'].includes(String(s.service))) buttons.push(b.button('Prompt 요청', b.handler('requestPrompt', '',
    `const result = await ${feedback}.prompt({\n${options('prompt')}\n    initialValue: ${literal(s.initialValue)},\n    validator: ${s.validate ? 'value => value.trim().length > 1 || "두 글자 이상 입력하세요."' : 'undefined'},\n});\n${b.result('String(result)')}`, true)));
  return b.finish(b.group(buttons));
}
