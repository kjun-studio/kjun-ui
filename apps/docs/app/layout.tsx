import type { Metadata } from 'next';
import { DocsPlatformProvider } from '@/components/docs/docs-platform';
import { DocsKjunProvider } from '@/components/docs/kjun-provider';
import './globals.css';
import '@kjun-ui/react/styles.css';
import './kjun.css';
import './docs.css';
import './docs-content.css';
import './discovery.css';
import './coverage.css';
import './accessibility.css';
import './examples.css';
import './platform.css';
import './document-navigation.css';
import './component-detail.css';
import './foundations.css';
import './layout-document.css';
import './motion.css';
import './motion-document.css';
import './icons.css';
import './tokens.css';
import './principles.css';
import './reading-document.css';
import './fonts.generated.css';
export const metadata: Metadata = {
  title: 'KJUN UI — Design System',
  description:
    '공통 구조와 동작을 제공하는 KJUN 디자인 시스템. Vue 2·React·React Native의 컴포넌트와 사용 가이드를 제공합니다.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body><DocsKjunProvider><DocsPlatformProvider>{children}</DocsPlatformProvider></DocsKjunProvider></body>
    </html>
  );
}
