import { expr, literal } from './builder';
import type { RecipeBuilder } from './recipe-builder';
import { columns, defaultRows, sampleImage } from '../../previews/catalog/example-tools';

export function lists(b: RecipeBuilder): string | undefined {
  switch (b.input.name) {
    case 'GuideSearchToolbar': {
      b.data('rows', defaultRows);
      b.state('chosen', '');
      const query = b.state('search', ''), filter = b.state('filter', 'all');
      const results = 'rows.filter(row => (!state.search || row.name.includes(state.search) || row.symbol.includes(state.search.toUpperCase())) && (state.filter !== "up" || row.change > 0))';
      const load = b.handler('loadOptions', 'query, { signal }', 'if (signal.aborted) throw new Error("검색이 취소되었습니다.");\n// 원격 검색에서는 fetch에 signal을 전달합니다.\nreturn rows.filter(row => row.name.includes(query) || row.symbol.includes(query.toUpperCase()));', true);
      return b.stack([
        b.node('DsFormGroup', { label: '자산 검색', hint: '이름이나 종목 코드를 입력하세요.' },
          b.node('DsSearchInput', { value: query, onValueChange: b.update('search'), minChars: 1, clearable: true, size: 'sm', labelField: 'name', ariaLabel: '자산 검색', loadOptions: expr(load.code), onSelect: b.handler('choose', 'row', b.set('chosen', 'row.name')) })),
        b.row([b.node('DsFilterGroup', { value: filter, onValueChange: b.update('filter'), size: 'sm', ariaLabel: '목록 필터', options: [{ value: 'all', label: '전체' }, { value: 'up', label: '상승 자산' }] }),
          b.button('필터 초기화', b.handler('resetFilters', '', b.set('search', '""') + '\n' + b.set('filter', '"all"') + '\n' + b.set('chosen', '""')), { variant: 'secondary', size: 'sm' })]),
        b.paragraph(expr(`state.chosen ? "선택한 자산: " + state.chosen : (${results}).length + "개 결과"`)),
        b.each(results, 'row', 'row.id', b.text(expr('row.name + " · " + row.symbol'))),
      ]);
    }
    case 'GuideAssetList': {
      b.domainColors = true;
      const status = b.state('status', '정상');
      b.declare('formatPrice', 'function formatPrice(value) {\n  return new Intl.NumberFormat("ko-KR").format(Number(value)) + "원";\n}');
      const price = b.node('DsPriceCell', { value: expr('row.price'), formatter: expr('formatPrice') });
      const delta = b.node('DsSignedValue', { value: expr('row.change'), format: 'percent', isRaw: true });
      const table = b.node('DsTable', {
        data: b.data('rows', defaultRows), columns: b.data('columns', columns), ariaLabel: '자산 목록', responsive: 'card', cardTitle: 'name', sortable: true,
        renderCell: b.vue ? undefined : expr(`(value, column, row) => column.key === "price" ? (${price}) : column.key === "change" ? (${delta}) : value`),
      }, b.vue ? `<template #cell-price="{ row }">${price}</template>\n<template #cell-change="{ row }">${delta}</template>` : '');
      return b.stack([
        b.node('DsSelect', { value: status, onValueChange: b.update('status'), ariaLabel: '목록 상태', options: ['정상', '최초 로딩', '빈 결과', '실패'].map(value => ({ value, label: value })) }),
        b.node('DsDataState', { queryKey: 'assets', resultKey: expr('["최초 로딩", "실패"].includes(state.status) ? null : "assets"'), hasLoadedOnce: expr('!["최초 로딩", "실패"].includes(state.status)'), loading: expr('state.status === "최초 로딩"'), error: expr('state.status === "실패" ? "자산 목록을 불러오지 못했습니다." : null'), skeleton: true, onRetry: b.handler('retryAssets', '', b.set('status', '"정상"')) },
          b.when('state.status === "빈 결과"', b.node('DsEmpty', { text: '조건에 맞는 자산이 없습니다', description: '필터를 초기화해 전체 목록을 확인하세요.', icon: 'search' },
            b.button('필터 초기화', b.handler('showAssets', '', b.set('status', '"정상"')), { variant: 'secondary' })), table)),
      ]);
    }
    case 'GuideGenericLists':
      return b.node('DsListSection', { title: '활동과 알림', description: '이동, 공유, 선택은 각각 다른 행동입니다.' }, [
        b.node('DsListRow', { title: '김하늘 님이 문서를 추가했습니다', description: '오늘 오전 9:30 · 프로젝트 활동', [b.native ? 'onPress' : 'onClick']: b.message('viewActivity', '활동 상세 열기') }, '', {
          leading: b.node('DsAvatar', { name: '김하늘', size: 'sm' }), trailing: b.node('DsBadge', {}, b.text('새 소식')),
          actions: b.button('공유', b.message('shareActivity', '활동 공유'), { variant: 'ghost', size: 'sm' }),
        }),
        b.node('DsListRow', { title: '프로젝트 알림 받기', description: '새로운 활동을 알려드립니다.' }, '', { actions: b.node('DsSwitch', { value: b.state('notify', true), onValueChange: b.update('notify'), ariaLabel: '프로젝트 알림 받기' }) }),
        b.node('DsListRow', { title: '검토할 항목', description: '선택 여부는 체크박스가 관리합니다.' }, '', { actions: b.node('DsCheckbox', { value: b.state('checked', false), onValueChange: b.update('checked'), ariaLabel: '검토할 항목 선택' }) }),
      ].join('\n'));
    case 'GuideThumbnail':
      return b.node('DsListSection', { title: '프로젝트 자료' }, b.node('DsListRow', { title: '프로젝트 표지', description: '이미지를 목록 앞 영역에 배치합니다.' }, '', {
        leading: b.node(b.native ? 'View' : 'div', { style: { width: 72 } }, b.node('DsImage', { src: sampleImage(0), alt: '산과 하늘 표지', aspectRatio: 4 / 3 })),
      }));
    case 'GuideSegmentedSelection':
      return b.stack([
        b.node('DsButtonGroup', { value: b.state('period', 'week'), onValueChange: b.update('period'), ariaLabel: '조회 기간', fullWidth: true, options: [{ value: 'day', label: '일' }, { value: 'week', label: '주' }, { value: 'month', label: '월' }] }),
        b.paragraph(expr('"선택한 조회 단위: " + state.period')),
      ]);
    case 'GuideRefreshContext': {
      b.state('phase', 'refreshing');
      const retry = b.handler('refresh', '', b.set('phase', '"refreshing"'));
      return b.stack([
        b.row([b.node('DsRefreshButton', { loading: expr('state.phase === "refreshing"'), [b.native ? 'onPress' : 'onClick']: retry }),
          b.button('갱신 완료', b.handler('complete', '', b.set('phase', '"ready"')), { variant: 'secondary' }),
          b.button('갱신 실패', b.handler('fail', '', b.set('phase', '"failed"')), { variant: 'secondary' })]),
        b.node('DsDataState', { queryKey: 'documents', resultKey: 'documents', hasLoadedOnce: true, loading: expr('state.phase === "refreshing"'), error: expr('state.phase === "failed" ? "목록을 갱신하지 못했습니다." : null'), onRetry: retry },
          b.node('DsListSection', { title: '프로젝트 문서' }, [
            b.node('DsListRow', { title: '프로젝트 계획', description: '선택한 항목은 갱신 중에도 유지됩니다.' }, '', { actions: b.node('DsCheckbox', { value: b.state('selected', true), onValueChange: b.update('selected'), ariaLabel: '프로젝트 계획 선택' }) }),
            b.node('DsListRow', { title: '회의 기록', description: '기존 결과를 유지합니다.' }),
          ].join('\n'))),
      ]);
    }
    case 'GuideEmptyVsError': {
      b.state('filterReset', false); b.state('retried', false);
      const description = '연결 상태를 확인한 뒤 다시 시도해 주세요.';
      const error = b.node('DsAlert', { type: 'danger', title: '문서를 불러오지 못했습니다' },
        b.native ? `{${literal(description)}}` : b.text(description),
        { actions: b.button('조회 재시도', b.handler('retryDocuments', '', b.set('retried', 'true')), { variant: 'secondary' }) });
      return b.stack([
        b.paragraph('정상 응답 · 빈 결과'),
        b.when('state.filterReset', b.node('DsListRow', { title: '프로젝트 계획', description: '필터를 초기화해 전체 목록을 표시합니다.' }),
          b.node('DsEmpty', { text: '검색 조건에 맞는 문서가 없습니다', description: '필터를 초기화해 전체 목록을 확인하세요.' }, b.button('필터 초기화', b.handler('resetFilter', '', b.set('filterReset', 'true')), { variant: 'secondary' }))),
        b.paragraph('요청 실패'),
        b.node('DsDataState', { queryKey: 'documents', resultKey: expr('state.retried ? "documents" : null'), hasLoadedOnce: expr('state.retried'), error: expr('state.retried ? null : "목록을 불러오지 못했습니다."') },
          b.node('DsListRow', { title: '프로젝트 계획', description: '재시도 후 불러온 문서입니다.' }), { [b.vue ? 'error' : 'errorContent']: error }),
      ]);
    }
  }
}
