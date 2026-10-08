'use client';
import { DsSelect } from '@kjun-ui/react';
export function Choice({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange(value: string): void }) {
  return <div className="choice"><span className="control-label">{label}</span>
    <DsSelect size="sm" ariaLabel={label} value={value} options={options}
      onValueChange={value => { if (typeof value === 'string') onChange(value); }} />
  </div>;
}
