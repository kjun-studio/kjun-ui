'use client';
import Link from './doc-link';
import { useDocsPlatform } from './docs-platform';

export function NativePreviewNotice() {
  const { platform } = useDocsPlatform();
  if (platform !== 'native') return null;
  return <p className="aside-note platform-notice">
    React Native 예제는 브라우저 미리보기입니다. iOS·Android 기기 검증은 수행하지 않았습니다.{' '}
    <Link href="/catalog#verification">지원 범위 확인</Link>
  </p>;
}
