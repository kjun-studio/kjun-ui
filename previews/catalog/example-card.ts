import { cardMediaSource, cardTableColumns, cardTableRows, type ExampleTools } from './example-tools';
export function renderCardExample(name: string, tools: ExampleTools): any {
  const { h, settings, get, set, button, message } = tools;
  switch (name) {
    case 'DsCard': {
      const design = settings.design || '정보';
      const props = { surface: settings.surface, padding: settings.padding, bodyPadding: settings.bodyPadding === 'inherit' ? undefined : settings.bodyPadding,
        radius: settings.radius, elevation: settings.elevation, border: settings.border, dividers: settings.dividers };
      const view = () => message('프로젝트 상세를 확인했습니다.');
      if (design === '통계') return h(name, props, h('Stack', {}, [
        h('Text', {}, '이번 달 완료 작업'), h('DsAnimatedNumber', { value: 128, animated: false }), h('Text', {}, '목표 160건 중 80%'), h('DsProgressCell', { value: 80 }),
      ]));
      if (design === '테이블') return h(name, { ...props, title: '팀 문서', subtitle: '최근 수정한 문서 3개' },
        h('DsTable', { data: cardTableRows, columns: cardTableColumns, rowKey: 'id', compact: true, responsive: 'none' }),
        { footer: button('전체 문서 보기', () => message('전체 문서를 확인했습니다.')) });
      if (design === '입력 폼') return h(name, { ...props, title: '프로젝트 설정', subtitle: '팀에 표시할 이름을 입력하세요.' },
        h('DsFormGroup', { label: '프로젝트 이름', required: true }, h('DsInput', { value: get('projectName', '브랜드 웹사이트'), onValueChange: (value: string) => set('projectName', value), ariaLabel: '프로젝트 이름' })),
        { footer: button('변경 사항 저장', () => message(get('projectName', '브랜드 웹사이트') + ' 저장했습니다.')) });
      if (design === '액션만') return h(name, props, '팀의 문서와 활동을 확인하세요.', { headerActions: button('상세 보기', view) });
      if (design === '사용자 헤더') return h(name, props, '검토가 끝나면 팀원에게 공유하세요.', {
        header: h('DsBadge', { variant: 'success' }, '검토 완료'), headerActions: button('상세 보기', view),
      });
      if (design === '이미지') return h(name, { ...props, title: '작업 공간 가이드', subtitle: '팀의 첫 프로젝트를 시작하는 방법' }, '자료를 정리하고 함께 작업할 공간을 만들어 보세요.', {
        media: h('DsImage', { aspectRatio: 2.5, src: cardMediaSource, alt: '정리된 문서와 작업 보드를 그린 일러스트' }), footer: button('가이드 보기', view),
      });
      return h(name, { ...props, title: '카드 제목', subtitle: '프로젝트의 문서와 활동' }, '본문과 헤더·푸터 간격을 확인하세요.', {
        headerActions: h('DsBadge', { variant: 'success' }, '진행 중'), footer: button('프로젝트 보기', view),
      });
    }
  }
}
