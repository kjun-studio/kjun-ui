import type { ReactNode } from 'react';
import { DsFormGroup, DsInput, DsListSection, DsListRow, DsAvatar, DsBadge, DsSwitch, DsSelect, DsFormActions, DsTable, DsPriceCell, DsSignedValue, type TableColumn } from '@kjun/react';
export const noop = () => {};
export const row = (children: ReactNode) => <div className="presentation-row">{children}</div>;
export const stack = (children: ReactNode) => <div className="presentation-stack">{children}</div>;
export const field = (children: ReactNode, label = '목록 이름') => <DsFormGroup label={label}>{children}</DsFormGroup>;
export const input = (size: "sm" | "md" | "lg" = "md") => <DsInput size={size} value="장기 보유 자산" onValueChange={noop} />;
export const options = [{ value: 'private', label: '나만 보기' }, { value: 'team', label: '팀에 공개' }, { value: 'public', label: '전체 공개' }];
export const rows = [
  { id: 'a', name: '한빛테크', symbol: 'HBT', price: 84200, change: 2.35 },
  { id: 'b', name: '새봄에너지', symbol: 'SBE', price: 36850, change: -1.25 },
  { id: 'c', name: '푸른모빌리티', symbol: 'PRM', price: 51700, change: 0.82 },
];
export const price = (value: number) => new Intl.NumberFormat('ko-KR').format(value) + '원';
export const columns: TableColumn[] = [{ key: 'name', label: '자산', sortable: true }, { key: 'price', label: '현재가', align: 'right', sortable: true }, { key: 'change', label: '등락률', align: 'right', sortable: true }];
export function DataTable() {
  return <DsTable data={rows} columns={columns} responsive="none" ariaLabel="자산 목록" renderCell={(value, column) => column.key === 'price' ? <DsPriceCell value={Number(value)} formatter={price} /> : column.key === 'change' ? <DsSignedValue value={Number(value)} format="percent" isRaw /> : String(value)} />;
}
export function ActivityList() {
  return <DsListSection title="활동과 알림">
    <DsListRow title="새 프로젝트 문서" description="김하늘 · 오늘 오전 9:30" leading={<DsAvatar name="김하늘" size="sm" />} trailing={<DsBadge variant="success">새 소식</DsBadge>} />
    <DsListRow title="검토 요청" description="이서준 · 어제 오후 4:20" leading={<DsAvatar name="이서준" size="sm" />} trailing={<DsBadge>검토 중</DsBadge>} />
    <DsListRow title="활동 알림" description="프로젝트의 새 소식을 받습니다." actions={<DsSwitch value ariaLabel="활동 알림 받기" onValueChange={noop} />} />
  </DsListSection>;
}
export function SettingsForm() {
  return stack(<>
    <DsFormGroup label="목록 이름" required>{input("lg")}</DsFormGroup>
    <DsFormGroup label="공개 범위"><DsSelect size="lg" value="team" options={options} onValueChange={noop} ariaLabel="공개 범위" /></DsFormGroup>
    <DsFormActions confirmText="변경 사항 저장" cancelText="취소" size="lg" />
  </>);
}
