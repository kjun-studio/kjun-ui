'use client';
import { useRouter } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';
import { useDocsPlatform } from './docs-platform';

// Internal document paths navigate on the client so the shell, React and fonts stay loaded.
// next/link is avoided: Vinext's production bundle loads its navigation module by an export
// name the bundler has minified, so Link clicks throw. useRouter shares the working chunk.
export default function DocLink({ onClick, ...props }: ComponentProps<'a'>) {
  const { href } = useDocsPlatform();
  const router = useRouter();
  // Hash, external and download links keep native anchor behaviour.
  if (!props.href?.startsWith('/') || props.href.startsWith('//') || props.download) return <a {...props} onClick={onClick} />;
  const target = href(props.href);
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (props.target && props.target !== '_self') return;
    const url = new URL(target, location.href);
    // Same-document hash links scroll natively.
    if (url.hash && url.pathname === location.pathname && url.search === location.search) return;
    event.preventDefault();
    router.push(url.pathname + url.search + url.hash);
  };
  return <a {...props} href={target} onClick={follow} />;
}
