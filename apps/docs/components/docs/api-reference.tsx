'use client';
import Link from './doc-link';
import { PlatformLoading, useDocsPlatform } from './docs-platform';
import { DsTable } from '@kjun/react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './disclosure';
import reference from '@/lib/generated/api-reference.json';
import { apiAnchor } from '../../../../shared/accessibility-guides/selection';
import {
  platformNames,
  type PlatformName,
} from '../../../../shared/demo-config';

type Member = {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  summary: string;
  details?: { label: string; text: string }[];
  example?: string;
};
type Contract = {
  props: Member[];
  events: Member[];
  slots: Member[];
  ownership: string[];
  types: { name: string; summary: string; fields: Member[] }[];
};
type Service = { ownership: string[]; methods: Member[]; options: Member[] };
const components = reference.components as Record<
  string,
  Record<PlatformName, Contract>
>;
const services = reference.feedback as Record<PlatformName, Service>;

function MemberDetails({ member }: { member: Member }) {
  return (
    <div className="api-member-details">
      <dl>
        {member.details?.map((detail) => (
          <div key={detail.label}>
            <dt>{detail.label}</dt>
            <dd>{detail.text}</dd>
          </div>
        ))}
      </dl>
      {member.example && <Link href={member.example}>관련 실행 예제</Link>}
    </div>
  );
}
// Long member names wrap after a dot or around " / ", never inside an identifier.
const breakableName = (name: string) =>
  name.split(/(?<=\.)|(?= \/ )/).flatMap((part, index) => (index ? [<wbr key={index} />, part] : [part]));
export function ContractTable({
  members,
  label,
  props = false,
  anchor,
}: {
  members: Member[];
  label: string;
  props?: boolean;
  anchor?: { platform: string; group: string };
}) {
  if (!members.length) return <p className="body-copy">공개 {label} 없음</p>;
  return <div className="api-reference-table"><DsTable<Member> responsive="none" hoverable={false} rowKey="name" ariaLabel={label}
    columns={[
      { key: 'name', label: label === '속성' ? '속성' : '항목', render: (_, member) => <code className="api-member-anchor" id={anchor ? apiAnchor(anchor.platform, anchor.group, member.name) : undefined}>{breakableName(member.name)}</code> },
      { key: 'type', label: '타입 / 데이터', className: 'api-member-type', render: (_, member) => <code>{member.type}</code> },
      ...(props ? [
        { key: 'required', label: '필수', render: (_: unknown, member: Member) => member.required ? '필수' : '선택' },
        { key: 'default', label: '기본값', render: (_: unknown, member: Member) => <code>{member.default ?? '—'}</code> },
      ] : []),
      { key: 'summary', label: '설명', render: (_, member) => <>
        <p>{member.summary}</p>
        {!!member.details?.length && <Collapsible>
          <CollapsibleTrigger className="api-detail-toggle" aria-label={`${member.name} 사용 계약`} prefixIcon="chevron-down">사용 계약</CollapsibleTrigger>
          <CollapsibleContent><MemberDetails member={member} /></CollapsibleContent>
        </Collapsible>}
      </> },
    ]} data={members} />
  </div>;
}

function Ownership({ items }: { items: string[] }) {
  return items.length ? (
    <div className="api-ownership">
      <h3>상태 소유권</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  ) : null;
}
export function ApiContract({ name }: { name: string }) {
  const { platform } = useDocsPlatform();
  const contract = platform ? components[name][platform] : null;
  return (
    <section id="api" className="api-reference">
      <h2>API</h2>
      {!platform || !contract ? (
        <PlatformLoading />
      ) : (
        <div key={platform}>
          <p className="body-copy">
            기본값은 속성을 생략했을 때의 값입니다.
            —는 기본값을 따로 표시하지 않은 항목입니다. 표준 요소의 추가 속성은 플랫폼
            타입 선언을 참고하세요.
          </p>
          <p className="api-platform">
            {platformNames[platform]} · @kjun/{platform}
          </p>
          <Ownership items={contract.ownership} />
          <ContractTable members={contract.props} label="속성" props anchor={{ platform, group: 'props' }} />
          {platform === 'vue2' && (
            <>
              <h3>이벤트 · 슬롯</h3>
              <h4>이벤트</h4>
              <ContractTable members={contract.events} label="이벤트" />
              <h4>슬롯</h4>
              <ContractTable members={contract.slots} label="슬롯" />
            </>
          )}
          {!!contract.types.length && (
            <>
              <h3>중첩 옵션과 렌더 데이터</h3>
              {contract.types.map((type) => (
                <div key={type.name}>
                  <h4>{type.name}</h4>
                  <p className="body-copy">{type.summary}</p>
                  <ContractTable members={type.fields} label={type.name} />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
export function FeedbackReference() {
  const { platform } = useDocsPlatform();
  if (!platform) return <PlatformLoading />;
  const contract = services[platform];
  return (
    // The service code block above already names the platform package.
    <div key={platform} className="api-reference">
      <Ownership items={contract.ownership} />
      <h3>메서드</h3>
      <ContractTable members={contract.methods} label="메서드" anchor={{ platform, group: 'methods' }} />
      <h3>서비스 옵션</h3>
      <ContractTable members={contract.options} label="서비스 옵션" props />
    </div>
  );
}
