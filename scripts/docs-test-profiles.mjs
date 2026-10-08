const files = (...names) => names.map(name => `tests/browser/docs/${name}.spec.ts`);
export const smokeFiles = files('docs-kjun', 'preview-scroll');

// 파일 전체를 선택하므로 동일 컴포넌트의 플랫폼/화면 크기 사례가 제목 필터로 빠지지 않는다.
export const relatedGroups = {
  alert: files('alert-examples', 'alert-runner', 'example-runner'),
  'data-state': files('data-state-examples', 'examples', 'example-runner'),
  card: files('card-examples', 'component-detail'),
  table: files('table-examples', 'examples'),
  select: files('input-docs', 'docs-platform', 'examples', 'example-runner'),
  input: files('input-docs', 'examples', 'docs-http'),
  button: files('component-detail', 'preview-scroll', 'docs-kjun', 'docs-http'),
  icons: files('icons-docs', 'icons-docs-layout', 'icons-docs-lifecycle', 'icons-docs-ux', 'icons-full-catalog'),
  navigation: files('document-navigation', 'discovery', 'docs-kjun', 'docs-layout-controls'),
  accessibility: files('accessibility', 'accessibility-docs', 'accessibility-docs-layout'),
  docs: files('docs-kjun', 'docs-layout', 'docs-spacing', 'docs-http', 'discovery'),
  overview: files('site', 'presentation', 'visual-zoom', 'discovery'),
  catalog: files('catalog', 'coverage', 'verification-navigation'),
  foundations: files('foundations', 'tokens-docs', 'layout-document', 'elevation-docs', 'interaction-docs',
    'interaction-docs-layout', 'motion-docs', 'motion-docs-layout', 'motion-docs-reading', 'motion-docs-transitions'),
  guides: files('usage-examples', 'usage-layout', 'visual-guides', 'design-cases', 'implementation-examples', 'getting-started-setup'),
  exports: files('export-renders', 'extensions', 'extension-races'),
};
// shell: 문서 전역 CSS·셸·내비게이션처럼 모든 페이지에 닿는 변경.
export const fullScopes = ['all', 'tokens', 'runtime', 'layers', 'layout', 'motion', 'shell'];

// 이전 실행이 남긴 서버가 포트를 쥐고 있으면 새 빌드 대신 오래된 빌드를 검사하게 된다.
export async function assertDocsPortFree(url, timeout = 2000) {
  const occupied = await fetch(url + '/', { signal: AbortSignal.timeout(timeout) }).then(() => true, () => false);
  if (occupied) throw Error(`${url}에 이미 응답하는 서버가 있습니다. 이전 문서 검사 서버를 종료한 뒤 다시 실행하세요.`);
}

export function planDocsTests(argv) {
  let profile = 'full';
  const args = [...argv];
  if (args[0] === '--profile') {
    args.shift();
    profile = args.shift();
  }
  if (!['full', 'smoke', 'related'].includes(profile)) throw Error(`알 수 없는 검사 모드: ${profile}`);
  let selected = [];
  let description = '전체 문서 검사';
  if (profile === 'smoke') {
    selected = smokeFiles;
    description = '문서 셸·검색·모바일 탐색·세 플랫폼 미리보기 빠른 검사';
  }
  if (profile === 'related') {
    const scopes = (args.shift() || '').split(',').map(scope => scope.trim());
    const unknown = scopes.filter(scope => !Object.hasOwn(relatedGroups, scope) && !fullScopes.includes(scope));
    if (unknown.length) throw Error(`관련 검사 범위를 지정하세요: ${[...Object.keys(relatedGroups), ...fullScopes].join(', ')}. 여러 범위는 쉼표로 연결합니다.`);
    if (scopes.some(scope => fullScopes.includes(scope))) {
      profile = 'full';
      description = `공통 변경(${scopes.join(', ')}) → 전체 문서 검사`;
    } else {
      selected = [...new Set(scopes.flatMap(scope => relatedGroups[scope]))];
      description = `관련 문서 검사: ${scopes.join(', ')}`;
    }
  }
  if (args[0] === '--') args.shift();
  if (args.some(arg => arg === '-c' || arg === '--config' || arg.startsWith('--config='))) {
    throw Error('문서 검사 설정은 고정입니다. 다른 설정은 npm run test:browser를 사용하세요.');
  }
  return {
    profile, description,
    listOnly: args.includes('--list') || args.includes('--help') || args.includes('-h'),
    args: ['test', '-c', 'playwright.docs.config.ts', ...selected, ...args],
  };
}
