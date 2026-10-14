import * as K from '@kjun-ui/react';
import { row, stack } from './common';
const choices = [{ value: 'day', label: '일간' }, { value: 'week', label: '주간' }, { value: 'month', label: '월간' }];
export function actions(name: string) {
  switch (name) {
    case 'KjunButton': return row(<><K.KjunButton>계속하기</K.KjunButton><K.KjunButton variant="secondary">취소</K.KjunButton><K.KjunButton disabled>계속하기</K.KjunButton></>);
    case 'KjunIcon': return row(<>{['search', 'heart', 'star', 'settings'].map(icon => <K.KjunIcon key={icon} name={icon} size={28} />)}</>);
    case 'KjunButtonGroup': return <K.KjunButtonGroup value="week" options={choices} size="md" ariaLabel="조회 기간" />;
    case 'KjunFilterGroup': return <K.KjunFilterGroup value="all" options={[{ value: 'all', label: '전체' }, { value: 'up', label: '상승' }, { value: 'down', label: '하락' }]} ariaLabel="등락 필터" />;
    case 'KjunIconToggle': return row(<><K.KjunIconToggle active activeIcon="star" activeColor="var(--kjun-favorite)" ariaLabel="즐겨찾기 해제" /><K.KjunIconToggle active activeIcon="heart" activeColor="var(--kjun-interest)" ariaLabel="관심 해제" /><K.KjunIconToggle active={false} activeIcon="heart" ariaLabel="관심 등록" /></>);
    case 'KjunCopyButton': return row(<><K.KjunCopyButton value="HBT" text="종목 코드 복사" /><K.KjunCopyButton value="HBT" ariaLabel="복사" /></>);
    case 'KjunRefreshButton': return row(<><K.KjunRefreshButton targetName="자산 목록" mode="text" /><K.KjunRefreshButton targetName="자산 목록" /></>);
    case 'KjunExternalLink': return row(<><K.KjunExternalLink href="https://example.com/docs" mode="text">프로젝트 문서</K.KjunExternalLink><K.KjunExternalLink href="https://example.com/docs" mode="icon" label="외부 문서" /></>);
    case 'KjunScrollFade': return <K.KjunScrollFade><div className="presentation-scroll-content">{['전체', '관심 자산', '국내 주식', '해외 주식', 'ETF', '채권', '펀드'].map(label => <K.KjunChip key={label} label={label} />)}</div></K.KjunScrollFade>;
    case 'KjunBadge': return row(<><K.KjunBadge size="lg" dot variant="success">진행 중</K.KjunBadge><K.KjunBadge size="lg" variant="warning">검토 대기</K.KjunBadge><K.KjunBadge size="lg">완료</K.KjunBadge></>);
    case 'KjunChip': return row(<><K.KjunChip label="프로젝트" /><K.KjunChip label="팀 공유" removable /><K.KjunChip label="보관됨" disabled /></>);
    case 'KjunBreadcrumb': return <K.KjunBreadcrumb items={[{ label: '홈', to: '#' }, { label: '프로젝트', to: '#' }, { label: '목록 설정' }]} />;
    case 'KjunPagination': return <K.KjunPagination currentPage={2} totalPages={5} showFirstLast={false} />;
    case 'KjunTopNavigation': return <K.KjunTopNavigation title="프로젝트" leading={<K.KjunButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel="뒤로 가기" />} actions={<K.KjunButton variant="ghost" size="sm">편집</K.KjunButton>} />;
    case 'KjunBottomNavigation': return <K.KjunBottomNavigation value="home" items={[{ key: 'home', label: '홈', icon: 'home', href: '#' }, { key: 'activity', label: '활동', icon: 'list', href: '#' }, { key: 'settings', label: '설정', icon: 'settings', href: '#' }]} />;
    case 'KjunBottomActionBar': return <K.KjunBottomActionBar description="변경 사항을 저장하세요."><K.KjunButton size="lg">변경 사항 저장</K.KjunButton></K.KjunBottomActionBar>;
  }
}
