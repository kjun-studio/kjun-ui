import * as K from '@kjun-ui/react';
import { row, stack, field, input, ActivityList, noop } from './common';
function Menu({ name }: { name: string }) {
  const items = <><K.KjunDropdownItem icon="pencil" selected={name === 'KjunDropdownItem'}>이름 변경</K.KjunDropdownItem><K.KjunDropdownItem icon="copy">복제</K.KjunDropdownItem><K.KjunDropdownDivider /><K.KjunDropdownItem variant="danger" icon="trash">삭제</K.KjunDropdownItem></>;
  return <div className="presentation-menu-anchor">{name === 'KjunMenuButton' ? <K.KjunMenuButton label="목록 관리" size="md" variant="secondary" compact>{items}</K.KjunMenuButton> : <K.KjunDropdown trigger={<K.KjunButton variant="secondary" suffixIcon="chevron-down">목록 관리</K.KjunButton>}>{items}</K.KjunDropdown>}</div>;
}
export function layout(name: string) {
  switch (name) {
    case 'KjunText': return stack(<><K.KjunText variant="sectionTitle">알림 설정</K.KjunText><K.KjunText tone="secondary">받을 알림을 고르세요.</K.KjunText></>);
    case 'KjunStack': return <K.KjunStack gap="md"><K.KjunText variant="cardTitle">알림 설정</K.KjunText><K.KjunText tone="secondary">받을 알림을 고르세요.</K.KjunText><K.KjunButton>저장</K.KjunButton></K.KjunStack>;
    case 'KjunInline': return <K.KjunInline gap="sm" justify="end"><K.KjunButton variant="secondary">취소</K.KjunButton><K.KjunButton>저장</K.KjunButton></K.KjunInline>;
    case 'KjunDropdown': case 'KjunDropdownItem': case 'KjunDropdownDivider': case 'KjunMenuButton': return <Menu name={name} />;
    case 'KjunModal': return <K.KjunModal open onOpenChange={noop} title="목록 이름 변경" size="sm" showFooter confirmText="변경 사항 저장">{field(input())}</K.KjunModal>;
    case 'KjunDrawer': return <K.KjunDrawer open onOpenChange={noop} title="목록 설정" width={360} footer={<K.KjunFormActions confirmText="저장" />}>{stack(<>{field(input())}<K.KjunSwitch value label="활동 알림 받기" /></>)}</K.KjunDrawer>;
    case 'KjunPopover': return <div className="presentation-menu-anchor"><K.KjunPopover open placement="bottom" ariaLabel="공개 범위 안내" trigger={<K.KjunButton variant="secondary">공개 범위</K.KjunButton>}><div className="presentation-note"><strong>팀에 공개</strong><p>프로젝트에 참여한 팀원이<br />목록을 함께 볼 수 있습니다.</p></div></K.KjunPopover></div>;
    case 'KjunTooltip': return <K.KjunTooltip content="관심 목록에 추가"><K.KjunButton prefixIcon="star" variant="secondary" ariaLabel="관심 목록" /></K.KjunTooltip>;
    case 'KjunCard': return <K.KjunCard title="팀 프로젝트" subtitle="함께 만드는 새로운 시작" headerActions={<K.KjunBadge variant="success">진행 중</K.KjunBadge>} footer={<K.KjunButton variant="secondary" size="sm">프로젝트 보기</K.KjunButton>}><p>문서와 활동을 한곳에서 관리합니다.</p></K.KjunCard>;
    case 'KjunAccordion': case 'KjunAccordionItem': return <K.KjunAccordion><K.KjunAccordionItem title="누가 목록을 볼 수 있나요?" defaultOpen>공개 범위를 팀으로 설정하면 팀원이 함께 볼 수 있습니다.</K.KjunAccordionItem>{name === 'KjunAccordion' && <K.KjunAccordionItem title="알림은 어떻게 설정하나요?">목록 설정에서 변경할 수 있습니다.</K.KjunAccordionItem>}</K.KjunAccordion>;
    case 'KjunTabs': case 'KjunTabPane': return <K.KjunTabs value="activity" ariaLabel="프로젝트"><K.KjunTabPane name="activity" label="활동" badge={3}><div className="presentation-tab-content"><K.KjunListRow title="새 프로젝트 문서" description="김하늘 · 오늘 오전 9:30" leading={<K.KjunAvatar name="김하늘" size="sm" />} /></div></K.KjunTabPane><K.KjunTabPane name="files" label="파일" /><K.KjunTabPane name="settings" label="설정" /></K.KjunTabs>;
    case 'KjunListRow': return <K.KjunListRow title="새 프로젝트 문서" description="김하늘 · 오늘 오전 9:30" leading={<K.KjunAvatar name="김하늘" />} trailing={<K.KjunBadge variant="success">새 소식</K.KjunBadge>} />;
    case 'KjunListSection': return <ActivityList />;
    case 'KjunListItem': return <K.KjunListSection title="화면"><K.KjunListItem><K.KjunText tone="secondary">화면 테마는 기기 설정을 따릅니다.</K.KjunText></K.KjunListItem><K.KjunListRow title="글자 크기" chevron /></K.KjunListSection>;
    case 'KjunAvatar': return row(<><K.KjunAvatar name="김하늘" size="lg" /><K.KjunAvatar name="이서준" size="lg" /><K.KjunAvatar name="박지우" size="lg" shape="square" /></>);
    case 'KjunImage': return <div className="presentation-image"><K.KjunImage src="/brand/kjun-symbol.svg" alt="KJUN 심볼" aspectRatio={16 / 9} fit="contain" lazy={false} /></div>;
  }
}
