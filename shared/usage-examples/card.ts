import { UsageBuilder, literal, type UsageInput } from './builder';
import { cardMediaSource, cardTableColumns, cardTableRows } from '../../previews/catalog/example-tools';
export function generateCard(input: UsageInput) {
  const b = new UsageBuilder(input), s = input.settings, design = s.design || '정보';
  const props = { ...b.props('surface','padding','radius','elevation','border','dividers'), bodyPadding: s.bodyPadding === 'inherit' ? undefined : s.bodyPadding };
  // Raw card copy receives the surface foreground through the Native contract.
  const copy = (value: string) => b.native ? `{${literal(value)}}` : b.text(value);
  const view = b.handler('viewProject', '', b.result('"프로젝트 상세를 확인했습니다."'));
  let content: string;
  if (design === '통계') content = b.node('DsCard', props, b.group([
    b.node(b.native ? 'Text' : 'p', {}, b.text('이번 달 완료 작업')),
    b.node('DsAnimatedNumber', { value: 128, animated: false }),
    b.node(b.native ? 'Text' : 'p', {}, b.text('목표 160건 중 80%')), b.node('DsProgressCell', { value: 80 }),
  ]));
  else if (design === '테이블') content = b.node('DsCard', { ...props, title: '팀 문서', subtitle: '최근 수정한 문서 3개' },
    b.node('DsTable', { data: b.data('rows', cardTableRows), columns: b.data('columns', cardTableColumns), rowKey: 'id', compact: true, responsive: 'none' }),
    { footer: b.button('전체 문서 보기', b.handler('viewDocuments', '', b.result('"전체 문서를 확인했습니다."'))) });
  else if (design === '입력 폼') content = b.node('DsCard', { ...props, title: '프로젝트 설정', subtitle: '팀에 표시할 이름을 입력하세요.' },
    b.node('DsFormGroup', { label: '프로젝트 이름', required: true }, b.node('DsInput', { value: b.state('projectName', '브랜드 웹사이트'), onValueChange: b.update('projectName'), ariaLabel: '프로젝트 이름' })),
    { footer: b.button('변경 사항 저장', b.handler('saveProject', '', b.result(b.read('projectName') + ' + " 저장했습니다."'))) });
  else if (design === '액션만') content = b.node('DsCard', props, copy('팀의 문서와 활동을 확인하세요.'), { headerActions: b.button('상세 보기', view) });
  else if (design === '사용자 헤더') content = b.node('DsCard', props, copy('검토가 끝나면 팀원에게 공유하세요.'), {
    header: b.node('DsBadge', { variant: 'success' }, b.text('검토 완료')), headerActions: b.button('상세 보기', view),
  });
  else if (design === '이미지') content = b.node('DsCard', { ...props, title: '작업 공간 가이드', subtitle: '팀의 첫 프로젝트를 시작하는 방법' }, copy('자료를 정리하고 함께 작업할 공간을 만들어 보세요.'), {
    media: b.node('DsImage', { src: cardMediaSource, alt: '정리된 문서와 작업 보드를 그린 일러스트', aspectRatio: 2.5 }), footer: b.button('가이드 보기', view),
  });
  else content = b.node('DsCard', { ...props, title: '카드 제목', subtitle: '프로젝트의 문서와 활동' }, copy('본문과 헤더·푸터 간격을 확인하세요.'), {
    headerActions: b.node('DsBadge', { variant: 'success' }, b.text('진행 중')), footer: b.button('프로젝트 보기', view),
  });
  return b.finish(content);
}
