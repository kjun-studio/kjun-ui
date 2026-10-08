import { notFound, redirect } from 'next/navigation';
import { routes } from '@/lib/catalog';
import { DocsShell } from '@/components/docs/shell';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = routes.find((x) => x.path === '/' + slug.join('/'));
  return {
    title: page
      ? page.title + ' — KJUN UI'
      : '페이지를 찾을 수 없습니다 — KJUN UI',
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  if (slug.join('/') === 'themes') {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
    }
    redirect('/styling' + (query.size ? '?' + query : ''));
  }
  const page = routes.find((x) => x.path === '/' + slug.join('/'));
  if (!page) notFound();
  return <DocsShell id={page.id} />;
}
