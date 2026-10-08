import Link from '@/components/docs/doc-link';
export default function NotFound() {
  return (
    <main style={{ padding: '80px 24px', maxWidth: 720, margin: 'auto' }}>
      <p>404</p>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <p style={{ margin: '24px 0' }}>
        주소를 확인하거나 디자인 시스템 소개로 돌아가세요.
      </p>
      <Link href="/" style={{ textDecoration: 'underline' }}>
        KJUN UI 소개로 돌아가기
      </Link>
    </main>
  );
}
