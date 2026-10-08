"use client";
import type { PlatformName } from '../../../../shared/demo-config';
import { usageSetup, usageSetupAdditions } from '../../../../shared/usage-examples/setup';
import { CodeBlock } from './code-block';
import Link from './doc-link';

// Color files are long value lists; show the start and let copy take the whole file.
const colorPreviewLines = 8;

export function GettingStartedSetup({ platform }: { platform: PlatformName }) {
  const files = usageSetup(platform, 'default', { feedback: false, domainColors: false });
  const app = platform === 'vue2' ? 'App.vue' : 'App.jsx';
  const example = platform === 'vue2' ? 'Example.vue' : 'Example.jsx';
  return (
    <section id="connect">
      <h2>2. 공통 앱 설정</h2>
      <p className="body-copy">컴포넌트의 기본 사용 코드를 <code>{example}</code>로 저장하고 아래 파일을 같은 폴더에 둡니다.
        기존 앱에 KjunProvider와 스타일이 연결되어 있다면 중복으로 추가하지 않습니다.</p>
      <p className="body-copy">색상·서체 값은 문서 실행용 예시이며 패키지에 포함된 제품 팔레트가 아닙니다.
        실제 프로젝트에서는 <Link href={'/styling#' + (platform === 'native' ? 'native' : 'web')}>색상·서체 연결 가이드</Link>에 따라 기존 토큰을 연결합니다.</p>
      {files.map(file => <CodeBlock key={file.name} code={file.code} label={file.name} copyLabel={`${file.name} 공통 설정 복사`}
        previewLines={file.name === app ? undefined : colorPreviewLines} />)}
      {platform !== 'native' && <p className="body-copy">예시 서체는 프로젝트에서 로드하며, 설치하지 않은 서체는 시스템 글꼴로 대체됩니다.</p>}
      {platform === 'native' && <p className="body-copy">Native는 CSS를 가져오지 않습니다.
        Expo 프로젝트에서는 <code>npx expo install react-native-svg</code>로 아이콘 의존성을 설치합니다.
        기본 설정은 시스템 글꼴을 사용합니다. 사용자 정의 폰트는 먼저 로드한 뒤 <code>appFont</code>에 해당 이름을 지정합니다.</p>}
    </section>
  );
}

/** Optional additions, grouped after the required steps. */
export function GettingStartedExtras({ platform }: { platform: PlatformName }) {
  const { feedback, domainColors } = usageSetupAdditions(platform, 'default');
  const app = platform === 'vue2' ? 'App.vue' : 'App.jsx';
  return <section id="extras">
    <h2>필요할 때 추가</h2>
    <p className="body-copy">아래 설정은 해당 기능을 쓰는 예제에만 적용합니다. 필수 단계를 마친 뒤 필요한 항목만 추가하세요.</p>
    <section id="feedback-setup" className="setup-extra">
      <h3>피드백 Provider</h3>
      <p className="body-copy">Toast·Confirm·Prompt를 호출하는 예제에 적용합니다. <code>{app}</code>의 기존 import에 아래 import를 추가합니다.</p>
      <CodeBlock code={feedback.imports} label={`${app} import에 추가`} copyLabel="피드백 import 복사" />
      {platform === 'vue2' && <>
        <p className="body-copy">기존 <code>components</code> 객체에 등록 항목을 추가합니다. KjunProvider와 Example 등록은 유지합니다.</p>
        <CodeBlock code={feedback.registration} label="components 객체에 추가" copyLabel="피드백 등록 코드 복사" />
      </>}
      <p className="body-copy">KjunProvider 내부의 <code>{'<Example />'}</code>를 아래 내용으로 감쌉니다.
        이미 피드백 Provider가 있는 영역에서는 다시 감싸지 않습니다.</p>
      <CodeBlock code={feedback.content} label="KjunProvider 내부" copyLabel="피드백 Provider 코드 복사" />
      <p className="body-copy">색상 설정과 KjunProvider의 기존 속성은 그대로 유지합니다.
        요청 처리와 반환값은 <Link href="/feedback">피드백 서비스</Link>에서 확인할 수 있습니다.</p>
    </section>
    <section id="domain-colors" className="setup-extra">
      <h3>금융·즐겨찾기 색상</h3>
      <p className="body-copy">금융 수치나 즐겨찾기·관심 상태의 색상 역할을 사용하는 예제에 적용합니다.
        아래 문서용 샘플 값을 기존 <code>{domainColors.file.name}</code> 파일 끝에 추가합니다.
        이미 연결된 역할은 중복으로 추가하지 않고 프로젝트 값을 유지합니다.</p>
      <CodeBlock code={domainColors.file.code} label={`${domainColors.file.name} 끝에 추가`} copyLabel="추가 색상 코드 복사" previewLines={colorPreviewLines} />
      {platform === 'native' && <>
        <p className="body-copy"><code>{app}</code>의 기존 import에 아래 항목을 추가합니다.</p>
        <CodeBlock code={domainColors.imports} label={`${app} import에 추가`} copyLabel="추가 색상 import 복사" />
        <p className="body-copy">KjunProvider의 여는 태그에 속성 하나를 추가합니다.
          기존 colors·fontFamily 속성과 내부의 피드백 Provider는 그대로 둡니다.</p>
        <CodeBlock code={domainColors.prop} label="KjunProvider 속성에 추가" copyLabel="추가 색상 속성 복사" />
      </>}
      <p className="body-copy">웹에서는 추가한 CSS 변수가 적용되며 Provider를 변경할 필요가 없습니다.
        역할의 의미와 숫자 서체는 <Link href="/styling#domain">금융 역할 연결 가이드</Link>에서 확인할 수 있습니다.</p>
    </section>
    <section id="icon-setup" className="setup-extra">
      <h3>추가 아이콘 등록</h3>
      <p className="body-copy">세 플랫폼 모두 기본 선형 153개와 heart·star 채움형을 바로 사용할 수 있습니다. 추가 아이콘은 필요한 이름만 import한 뒤 KjunProvider의 <code>icons</code>에 등록합니다. <Link href="/icons">전체 아이콘 목록</Link>에서 선택한 플랫폼의 등록 예제를 복사하세요.</p>
      <CodeBlock label="개별 아이콘 import" code={"import rocket from '@kjun-ui/icons/icons/rocket';\nconst projectIcons = { rocket };"} />
      <CodeBlock label="Provider 등록" code={platform === 'vue2'
        ? '<KjunProvider :icons="projectIcons">\n  <DsButton prefix-icon="rocket">시작</DsButton>\n</KjunProvider>'
        : `<KjunProvider ${platform === 'native' ? 'colors={appColors} ' : ''}icons={projectIcons}>\n  <DsButton prefixIcon="rocket">시작</DsButton>\n</KjunProvider>`} />
    </section>
  </section>;
}
