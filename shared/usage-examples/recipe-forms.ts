import { expr } from './builder';
import type { RecipeBuilder } from './recipe-builder';

export function forms(b: RecipeBuilder): string | undefined {
  switch (b.input.name) {
    case 'GuideSettingsForm': {
      b.feedback = true;
      const invalid = b.state('invalid', false);
      const save = b.handler('save', '', `if (!${b.read('formName')}.trim()) {\n  ${b.set('invalid', 'true')}\n  return;\n}\n${b.set('invalid', 'false')}\n// 실제 저장 요청이 성공한 뒤 안내합니다.\n${b.vue ? 'this.kjunFeedback' : 'feedback'}.toast.success("변경 사항을 저장했습니다.");`);
      return b.stack([
        b.node('DsFormGroup', { id: 'settings-name', label: '목록 이름', required: true, hint: '동료가 구분할 수 있는 이름을 입력하세요.', error: expr('state.invalid ? "목록 이름을 입력해 주세요." : ""') },
          b.field('formName', '', '목록 이름', { id: 'settings-name', size: 'lg', error: invalid, placeholder: '예: 장기 보유 자산' })),
        b.node('DsFormGroup', { label: '공개 범위', hint: '선택한 범위의 사용자만 목록을 볼 수 있습니다.' },
          b.node('DsSelect', { value: b.state('visibility', 'private'), onValueChange: b.update('visibility'), ariaLabel: '공개 범위', size: 'lg', options: [{ value: 'private', label: '나만 보기' }, { value: 'team', label: '팀에 공개' }] })),
        b.node('DsFormActions', { size: 'lg', confirmText: '변경 사항 저장', cancelText: '입력 초기화', onConfirm: save,
          onCancel: b.handler('reset', '', b.set('formName', '""') + '\n' + b.set('visibility', '"private"') + '\n' + b.set('invalid', 'false')) }),
      ], 20);
    }
    case 'GuideFieldErrors': {
      const invalid = b.state('invalid', true);
      return b.stack([
        b.node('DsFormGroup', { id: 'email', label: '알림 이메일', hint: '프로젝트 변경 소식을 받을 주소입니다.', error: expr('state.invalid ? "@ 뒤에 도메인을 입력해 주세요. 예: team@example.com" : ""') },
          b.field('email', 'team@', '알림 이메일', { id: 'email', error: invalid })),
        b.button('이메일 저장', b.handler('saveEmail', '', `// 문서용 형식 검사입니다. 실제 검증 규칙을 연결하세요.\nconst valid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(${b.read('email')});\n${b.set('invalid', '!valid')}\n${b.result('valid ? "알림 이메일을 저장했습니다." : "이메일을 수정한 뒤 다시 저장해 주세요."')}`)),
      ]);
    }
    case 'GuideInputSettings': {
      b.state('removedTags', []);
      const tags = b.data('tags', ['개인', '팀']);
      const remove = b.handler('removeTag', 'tag', b.set('removedTags', '[...' + b.read('removedTags') + ', tag]'));
      const chip = b.node('DsChip', { label: expr('tag'), removable: true, onRemove: b.call(remove, 'tag') });
      return b.stack([
        b.node('DsFormGroup', { label: '알림 시각', hint: '초 단위까지 선택합니다.' }, b.node('DsTimePicker', { value: b.state('time', '09:30:00'), precision: 'second', ariaLabel: '알림 시각', onValueChange: b.update('time') })),
        b.node('DsFormGroup', { label: '요청 수량', hint: '확정된 숫자 값을 상태에 연결합니다.' }, b.node('DsQuantityStepper', { value: b.state('quantity', 1.25), min: 0, max: 10, step: .1, precision: 2, ariaLabel: '요청 수량', onValueChange: b.update('quantity') })),
        b.node('DsRangeSlider', { label: '알림 범위', value: b.state('range', [20, 80]), onValueChange: b.update('range') }),
        b.row([b.each(tags.code, 'tag', 'tag', b.when('!state.removedTags.includes(tag)', chip))]),
        b.button('분류 초기화', b.handler('restoreTags', '', b.set('removedTags', '[]'))),
      ]);
    }
    case 'GuideBottomSheet': {
      const open = b.state('open', false);
      return b.stack([
        b.button('하단 패널 열기', b.handler('openPanel', '', b.set('open', 'true'))),
        b.node('DsDrawer', { open, onOpenChange: b.update('open'), position: 'bottom', title: '알림 설정' },
          b.node('DsSwitch', { value: b.state('notify', true), onValueChange: b.update('notify'), label: '활동 알림 받기' }),
          { footer: b.button('설정 완료', b.handler('closePanel', '', b.set('open', 'false'))) }),
      ]);
    }
    case 'GuideDeleteConfirmation': {
      b.state('deleted', false);
      return b.stack([
        b.when('state.deleted', b.node('DsEmpty', { text: '문서를 삭제했습니다', description: '이 예제의 항목만 제거했습니다.' }),
          b.node('DsListSection', {}, b.node('DsListRow', { title: '프로젝트 계획', description: '이번 주 목표와 담당자' }))),
        b.button('문서 복원 후 삭제 확인', b.handler('openDelete', '', b.set('deleted', 'false') + '\n' + b.set('open', 'true')), { variant: 'secondary' }),
        b.node('DsModal', { open: b.state('open', true), onOpenChange: b.update('open'), size: 'sm', title: '‘프로젝트 계획’을 삭제할까요?', showFooter: true,
          cancelText: '취소', confirmText: '문서 삭제', confirmVariant: 'danger',
          onCancel: b.handler('cancelDelete', '', b.set('open', 'false') + '\n' + b.result('"삭제를 취소했습니다. 문서를 유지합니다."')),
          onConfirm: b.handler('deleteDocument', '', '// 실제 서비스에서는 삭제 요청이 성공한 뒤 상태를 갱신합니다.\n' + b.set('deleted', 'true') + '\n' + b.set('open', 'false')),
        }, b.text('‘프로젝트 계획’ 문서가 삭제되며 복구할 수 없습니다. 계속하려면 문서 삭제를 선택하세요.')),
      ]);
    }
  }
}
