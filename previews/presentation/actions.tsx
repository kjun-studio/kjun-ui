import * as K from '@kjun/react';
import { row, stack } from './common';
const choices = [{ value: 'day', label: '일간' }, { value: 'week', label: '주간' }, { value: 'month', label: '월간' }];
export function actions(name: string) {
  switch (name) {
    case 'DsButton': return row(<><K.DsButton>계속하기</K.DsButton><K.DsButton variant="secondary">취소</K.DsButton><K.DsButton disabled>계속하기</K.DsButton></>);
    case 'DsIcon': return row(<>{['search', 'heart', 'star', 'settings'].map(icon => <K.DsIcon key={icon} name={icon} size={28} />)}</>);
    case 'DsButtonGroup': return <K.DsButtonGroup value="week" options={choices} size="md" ariaLabel="조회 기간" />;
    case 'DsFilterGroup': return <K.DsFilterGroup value="all" options={[{ value: 'all', label: '전체' }, { value: 'up', label: '상승' }, { value: 'down', label: '하락' }]} ariaLabel="등락 필터" />;
    case 'DsIconToggle': return row(<><K.DsIconToggle active activeIcon="star" activeColor="var(--kjun-favorite)" ariaLabel="즐겨찾기 해제" /><K.DsIconToggle active activeIcon="heart" activeColor="var(--kjun-interest)" ariaLabel="관심 해제" /><K.DsIconToggle active={false} activeIcon="heart" ariaLabel="관심 등록" /></>);
    case 'DsCopyButton': return row(<><K.DsCopyButton value="HBT" text="종목 코드 복사" /><K.DsCopyButton value="HBT" ariaLabel="복사" /></>);
    case 'DsRefreshButton': return row(<><K.DsRefreshButton targetName="자산 목록" mode="text" /><K.DsRefreshButton targetName="자산 목록" /></>);
    case 'DsExternalLink': return row(<><K.DsExternalLink href="https://example.com/docs" mode="text">프로젝트 문서</K.DsExternalLink><K.DsExternalLink href="https://example.com/docs" mode="icon" label="외부 문서" /></>);
    case 'DsScrollFade': return <K.DsScrollFade><div className="presentation-scroll-content">{['전체', '관심 자산', '국내 주식', '해외 주식', 'ETF', '채권', '펀드'].map(label => <K.DsChip key={label} label={label} />)}</div></K.DsScrollFade>;
    case 'DsBadge': return row(<><K.DsBadge size="lg" dot variant="success">진행 중</K.DsBadge><K.DsBadge size="lg" variant="warning">검토 대기</K.DsBadge><K.DsBadge size="lg">완료</K.DsBadge></>);
    case 'DsChip': return row(<><K.DsChip label="프로젝트" /><K.DsChip label="팀 공유" removable /><K.DsChip label="보관됨" disabled /></>);
    case 'DsBreadcrumb': return <K.DsBreadcrumb items={[{ label: '홈', to: '#' }, { label: '프로젝트', to: '#' }, { label: '목록 설정' }]} />;
    case 'DsPagination': return <K.DsPagination currentPage={2} totalPages={5} showFirstLast={false} />;
    case 'DsTopNavigation': return <K.DsTopNavigation title="프로젝트" leading={<K.DsButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel="뒤로 가기" />} actions={<K.DsButton variant="ghost" size="sm">편집</K.DsButton>} />;
    case 'DsBottomNavigation': return <K.DsBottomNavigation value="home" items={[{ key: 'home', label: '홈', icon: 'home', href: '#' }, { key: 'activity', label: '활동', icon: 'list', href: '#' }, { key: 'settings', label: '설정', icon: 'settings', href: '#' }]} />;
    case 'DsBottomActionBar': return <K.DsBottomActionBar description="변경 사항을 저장하세요."><K.DsButton size="lg">변경 사항 저장</K.DsButton></K.DsBottomActionBar>;
  }
}
