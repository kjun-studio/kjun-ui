import * as K from '@kjun/react';
import { row, stack, field, input, ActivityList, noop } from './common';
function Menu({ name }: { name: string }) {
  const items = <><K.DsDropdownItem icon="pencil" selected={name === 'DsDropdownItem'}>이름 변경</K.DsDropdownItem><K.DsDropdownItem icon="copy">복제</K.DsDropdownItem><K.DsDropdownDivider /><K.DsDropdownItem variant="danger" icon="trash">삭제</K.DsDropdownItem></>;
  return <div className="presentation-menu-anchor">{name === 'DsMenuButton' ? <K.DsMenuButton label="목록 관리" size="md" variant="secondary" compact>{items}</K.DsMenuButton> : <K.DsDropdown trigger={<K.DsButton variant="secondary" suffixIcon="chevron-down">목록 관리</K.DsButton>}>{items}</K.DsDropdown>}</div>;
}
export function layout(name: string) {
  switch (name) {
    case 'DsDropdown': case 'DsDropdownItem': case 'DsDropdownDivider': case 'DsMenuButton': return <Menu name={name} />;
    case 'DsModal': return <K.DsModal open onOpenChange={noop} title="목록 이름 변경" size="sm" showFooter confirmText="변경 사항 저장">{field(input())}</K.DsModal>;
    case 'DsDrawer': return <K.DsDrawer open onOpenChange={noop} title="목록 설정" width={360} footer={<K.DsFormActions confirmText="저장" />}>{stack(<>{field(input())}<K.DsSwitch value label="활동 알림 받기" /></>)}</K.DsDrawer>;
    case 'DsPopover': return <div className="presentation-menu-anchor"><K.DsPopover open placement="bottom" ariaLabel="공개 범위 안내" trigger={<K.DsButton variant="secondary">공개 범위</K.DsButton>}><div className="presentation-note"><strong>팀에 공개</strong><p>프로젝트에 참여한 팀원이<br />목록을 함께 볼 수 있습니다.</p></div></K.DsPopover></div>;
    case 'DsTooltip': return <K.DsTooltip content="관심 목록에 추가"><K.DsButton prefixIcon="star" variant="secondary" ariaLabel="관심 목록" /></K.DsTooltip>;
    case 'DsCard': return <K.DsCard title="팀 프로젝트" subtitle="함께 만드는 새로운 시작" headerActions={<K.DsBadge variant="success">진행 중</K.DsBadge>} footer={<K.DsButton variant="secondary" size="sm">프로젝트 보기</K.DsButton>}><p>문서와 활동을 한곳에서 관리합니다.</p></K.DsCard>;
    case 'DsAccordion': case 'DsAccordionItem': return <K.DsAccordion><K.DsAccordionItem title="누가 목록을 볼 수 있나요?" defaultOpen>공개 범위를 팀으로 설정하면 팀원이 함께 볼 수 있습니다.</K.DsAccordionItem>{name === 'DsAccordion' && <K.DsAccordionItem title="알림은 어떻게 설정하나요?">목록 설정에서 변경할 수 있습니다.</K.DsAccordionItem>}</K.DsAccordion>;
    case 'DsTabs': case 'DsTabPane': return <K.DsTabs value="activity" ariaLabel="프로젝트"><K.DsTabPane name="activity" label="활동" badge={3}><div className="presentation-tab-content"><K.DsListRow title="새 프로젝트 문서" description="김하늘 · 오늘 오전 9:30" leading={<K.DsAvatar name="김하늘" size="sm" />} /></div></K.DsTabPane><K.DsTabPane name="files" label="파일" /><K.DsTabPane name="settings" label="설정" /></K.DsTabs>;
    case 'DsListRow': return <K.DsListRow title="새 프로젝트 문서" description="김하늘 · 오늘 오전 9:30" leading={<K.DsAvatar name="김하늘" />} trailing={<K.DsBadge variant="success">새 소식</K.DsBadge>} />;
    case 'DsListSection': return <ActivityList />;
    case 'DsAvatar': return row(<><K.DsAvatar name="김하늘" size="lg" /><K.DsAvatar name="이서준" size="lg" /><K.DsAvatar name="박지우" size="lg" shape="square" /></>);
    case 'DsImage': return <div className="presentation-image"><K.DsImage src="/brand/kjun-symbol.svg" alt="KJUN 심볼" aspectRatio={16 / 9} fit="contain" lazy={false} /></div>;
  }
}
