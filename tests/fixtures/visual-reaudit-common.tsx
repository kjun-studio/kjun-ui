import { createElement, useState } from 'react';
import { initial, renderAudit } from './visual-reaudit-cases';
export function AuditCases({ K, native = false }: { K: any; native?: boolean }) {
  const [state, setState] = useState(initial);
  const h = (name: string, props: any, children?: any, slots?: any): any => {
    if (name === 'Section') return <section key={props.id} data-testid={props.id} style={{ marginBottom: 24, minWidth: 0 }}>{children}</section>;
    if (name === 'Output') return <output data-testid="state" style={{ display: "block", overflowWrap: "anywhere" }}>{children}</output>;
    const adapted = native && props.onClick ? { ...props, onPress: props.onClick, onClick: undefined } : props;
    return createElement(K[name], { ...adapted, ...slots }, children);
  };
  return <main style={{ padding: 16, minWidth: 0 }}>{renderAudit(h, state, (key, value) => setState(old => ({ ...old, [key]: value })))}</main>;
}
