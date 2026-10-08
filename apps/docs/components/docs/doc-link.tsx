'use client';
import type { ComponentProps } from 'react';
import { useDocsPlatform } from './docs-platform';

// Keep document navigation independent of Vinext's production Link/prefetch runtime.
export default function DocLink(props: ComponentProps<'a'>) {
  const { href } = useDocsPlatform();
  return <a {...props} href={props.href && !props.download ? href(props.href) : props.href} />;
}
