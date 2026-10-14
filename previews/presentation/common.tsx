import type { ReactNode } from 'react';
import { KjunFormGroup, KjunInput, KjunListSection, KjunListRow, KjunAvatar, KjunBadge, KjunSwitch, KjunSelect, KjunFormActions, KjunTable, KjunPriceCell, KjunSignedValue, type TableColumn } from '@kjun-ui/react';
export const noop = () => {};
export const row = (children: ReactNode) => <div className="presentation-row">{children}</div>;
export const stack = (children: ReactNode) => <div className="presentation-stack">{children}</div>;
export const field = (children: ReactNode, label = '목록 이름') => <KjunFormGroup label={label}>{children}</KjunFormGroup>;
export const input = (size: "sm" | "md" | "lg" = "md") => <KjunInput size={size} value="장기 보유 자산" onValueChange={noop} />;
export const options = [{ value: 'private', label: '나만 보기' }, { value: 'team', label: '팀에 공개' }, { value: 'public', label: '전체 공개' }];
export const rows = [
  { id: 'a', name: '한빛테크', symbol: 'HBT', price: 84200, change: 2.35 },
  { id: 'b', name: '새봄에너지', symbol: 'SBE', price: 36850, change: -1.25 },
  { id: 'c', name: '푸른모빌리티', symbol: 'PRM', price: 51700, change: 0.82 },
];
export const price = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';
export const columns: TableColumn[] = [{ key: 'name', label: '자산', sortable: true }, { key: 'price', label: '현재가', align: 'right', sortable: true }, { key: 'change', label: '등락률', align: 'right', sortable: true }];
export function DataTable() {
  return <KjunTable data={rows} columns={columns} responsive="none" ariaLabel="자산 목록" renderCell={(value, column) => column.key === 'price' ? <KjunPriceCell value={Number(value)} formatter={price} /> : column.key === 'change' ? <KjunSignedValue value={Number(value)} format="percent" isRaw /> : String(value)} />;
}
export function ActivityList() {
  return <KjunListSection title="활동과 알림">
    <KjunListRow title="새 프로젝트 문서" description="김하늘 · 오늘 오전 9:30" leading={<KjunAvatar name="김하늘" size="sm" />} trailing={<KjunBadge variant="success">새 소식</KjunBadge>} />
    <KjunListRow title="검토 요청" description="이서준 · 어제 오후 4:20" leading={<KjunAvatar name="이서준" size="sm" />} trailing={<KjunBadge>검토 중</KjunBadge>} />
    <KjunListRow title="활동 알림" description="프로젝트의 새 소식을 받습니다." actions={<KjunSwitch value ariaLabel="활동 알림 받기" onValueChange={noop} />} />
  </KjunListSection>;
}
export function SettingsForm() {
  return stack(<>
    <KjunFormGroup label="목록 이름" required>{input("lg")}</KjunFormGroup>
    <KjunFormGroup label="공개 범위"><KjunSelect size="lg" value="team" options={options} onValueChange={noop} ariaLabel="공개 범위" /></KjunFormGroup>
    <KjunFormActions confirmText="변경 사항 저장" cancelText="취소" size="lg" />
  </>);
}
