/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- 가로 스크롤 코드에 키보드 접근을 제공한다. */
"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DsButton as Button, DsCard as Card } from "@kjun-ui/react";
import { copyCode } from "./copy-code";
export function CodeBlock({
  code,
  label = "사용 코드",
  disabled = false,
  copyLabel = "코드 복사",
  requestKey,
  previewLines,
  copySuccess = "코드를 복사했습니다",
  copyFailure = "복사하지 못했습니다. 코드를 직접 선택해 주세요.",
  children,
}: {
  code: string;
  label?: string;
  disabled?: boolean;
  copyLabel?: string;
  requestKey?: string;
  /** Shows only the first lines until expanded; copying always takes the full code. */
  previewLines?: number;
  copySuccess?: string;
  copyFailure?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false),
    [error, setError] = useState(false);
  const generation = useRef(0);
  useLayoutEffect(() => { generation.current++; return () => { generation.current++; }; }, [requestKey ?? code, disabled]);
  useEffect(() => { setCopied(false); setError(false); }, [code, requestKey]);
  const [expanded, setExpanded] = useState(false);
  const lineCount = code.split("\n").length;
  const collapsible = !!previewLines && lineCount > previewLines + 2;
  const collapsed = collapsible && !expanded;
  const body = <>
    <pre tabIndex={0} className={collapsed ? "is-collapsed" : undefined}
      style={collapsed ? { maxHeight: `calc(${previewLines} * var(--code-line-height) + var(--code-padding) * 2)` } : undefined}>
      <code>{code}</code>
    </pre>
    {collapsible && <div className="code-expand">
      <Button variant="ghost" size="sm" suffixIcon={expanded ? "chevron-up" : "chevron-down"} aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}>
        {expanded ? "접기" : `전체 ${lineCount}줄 보기`}
      </Button>
    </div>}
    {children}
  </>;
  const content = <>
      <div className="code-header">
        <span>{label}</span>
        <Button
          variant="ghost"
          size="sm"
          prefixIcon={copied ? "check" : "copy"}
          aria-label={copyLabel}
          title={copyLabel}
          disabled={disabled}
          onClick={async () => {
            const request = generation.current;
            try {
              const text = code;
              if (request !== generation.current) return;
              await copyCode(text);
              if (request !== generation.current) return;
              setCopied(true);
              setError(false);
            } catch {
              if (request === generation.current) setError(true);
            }
          }}
        />
      </div>
      {body}
      <output className="sr-only">
        {copied
          ? copySuccess
          : error
          ? copyFailure
          : ""}
      </output>
    </>;
  return <Card className="code-block" padding="none" surface="muted">{content}</Card>;
}
