"use client";
import { useDocsPlatform, PlatformLoading } from "./docs-platform";
import packages from "@/lib/generated/packages.json";
import Link from "@/components/docs/doc-link";
import { DsAlert, DsButtonGroup, DsIcon as Icon } from "@kjun/react";
import { platformNames } from "../../../../shared/demo-config";
import { isPlatform } from "../../../../shared/docs-platform";
import { ActionLink } from "./action-link";
import { CodeBlock } from "./code-block";
import { DataTable } from "./data-table";
import { GettingStartedExtras, GettingStartedSetup } from "./getting-started-setup";

const steps = [
  ["패키지 설치", "플랫폼 패키지와 공통 토큰·아이콘 데이터를 설치합니다."],
  ["공통 앱 설정", "KjunProvider와 스타일, 색상·서체 값을 연결합니다."],
  ["데이터와 업무 연결", "검색·조회·이동 같은 업무 처리를 프로젝트에서 연결합니다."],
] as const;

export function GettingStarted() {
  const { platform, selectPlatform } = useDocsPlatform();
  if (!platform) return <PlatformLoading />;
  const selected = packages.filter(
    (item) => item.name === "@kjun/icons" || item.name === "@kjun/tokens" || item.name === "@kjun/" + platform
  );
  const command = ["npm install", ...selected.map((item) => "  ./" + item.file)].join(" \\\n");
  return (
    <div className="reading-document getting-started">
      <ol className="step-summary" aria-label="시작 단계">
        {steps.map(([title, body], index) => (
          <li key={title}>
            <span className="section-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </li>
        ))}
      </ol>
      <section id="install">
        <h2>1. 패키지 설치</h2>
        <p className="body-copy">
          사용하는 플랫폼의 패키지와 공통 토큰인 <code>@kjun/tokens</code>, 아이콘 데이터인{" "}
          <code>@kjun/icons</code>를 함께 설치합니다.
        </p>
        <div className="install-platform">
          <DsButtonGroup
            ariaLabel="설치할 플랫폼"
            value={platform}
            options={Object.entries(platformNames).map(([value, label]) => ({ value, label }))}
            onValueChange={(value) => { if (isPlatform(value)) selectPlatform(value); }}
          />
        </div>
        <DsAlert type="info" size="sm">
          아직 배포 전입니다. 아래 파일은 로컬 설치·검증용입니다.
        </DsAlert>
        <div className="download-row">
          {selected.map((item) => (
            <ActionLink key={item.name} variant="secondary" size="md" href={"/downloads/" + item.file} download>
              <Icon name="download" size={16} aria-hidden="true" />
              {item.name}
              <span>{item.version}</span>
            </ActionLink>
          ))}
        </div>
        <p className="body-copy">내려받은 파일을 프로젝트 루트에 두고 설치합니다.</p>
        <CodeBlock code={command} label="프로젝트에 로컬 패키지 설치" />
      </section>
      <GettingStartedSetup platform={platform} />
      <section id="project">
        <h2>3. 데이터와 업무 연결</h2>
        <p className="body-copy">
          데이터 요청과 업무 처리는 프로젝트에서 연결합니다. 각 컴포넌트의 API와
          실행 예제에서 입력값·콜백·슬롯을 확인하세요.
        </p>
        <DataTable
          presentation="prose"
          headings={["기능", "프로젝트에서 연결할 입력"]}
          rows={[
            ["검색", <><code>SearchInput</code>의 <code>loadOptions(query, {"{ signal }"})</code></>],
            ["숫자·가격 표시", <><code>formatter</code> · <code>formatValue</code> · <code>formatMetric</code>, Vue <code>KjunProvider.formatters</code></>],
            ["자산 식별", <><code>renderIdentity</code> 또는 이름·자산 슬롯</>],
            ["조회 상태", <><code>DataState</code>의 <code>queryKey</code> · <code>resultKey</code> · <code>loading</code> · <code>error</code></>],
            ["Toast·Confirm·Prompt", <>영역별 <code>KjunFeedbackProvider</code></>],
            ["기기 기능", <>Native <code>copyText(value)</code> · <code>openUrl(url)</code> 콜백</>],
            ["페이지 이동", <>Vue <code>to</code> + <code>navigate</code> 이벤트, React <code>renderLink</code>, Native <code>onNavigate</code></>],
          ]}
        />
        <p className="body-copy">
          <Link href="/components/search-input">SearchInput</Link>은 검색 지연과
          취소·늦은 응답 무시를 처리합니다. <Link href="/components/data-state">DataState</Link>는
          조회 상태를 표현하며 데이터 요청과 결과 반영은 프로젝트에서 처리합니다.
          피드백의 반환값과 요청 순서는 <Link href="/feedback">피드백 서비스</Link>를 확인하세요.
        </p>
      </section>
      <GettingStartedExtras platform={platform} />
      <section id="compatibility">
        <h2>참고: 플랫폼별 계약</h2>
        <p className="body-copy">
          같은 기능을 플랫폼마다 어떤 이름으로 연결하는지 비교합니다. 좁은 화면에서는 선택한 플랫폼만 표시합니다.
        </p>
        <div className="compatibility-table" data-platform={platform}>
          <DataTable
            presentation="prose"
            headings={["기능", "Vue 2", "React", "React Native"]}
            rows={[
              ["버튼 실행", <code>@click</code>, <code>onClick</code>, <code>onPress</code>],
              ["입력 값 변경", <code>v-model</code>, <><code>value</code> · <code>onChange</code></>, <><code>value</code> · <code>onChangeText</code></>],
              ["모달 열림", <code>v-model</code>, <><code>open</code> · <code>onOpenChange</code></>, <><code>open</code> · <code>onOpenChange</code></>],
              ["사용자 정의 영역", <code>slot</code>, <code>ReactNode</code>, <code>ReactNode</code>],
              ["모달 높이", "CSS 길이", "CSS 길이", "숫자(dp)"],
            ]}
          />
        </div>
        <p className="body-copy">
          Vue는 Ds 명칭과 v-model 계약을 사용합니다. 웹 패키지는 컴파일된
          JavaScript와 CSS를 제공하므로 별도의 Tailwind 설정이나 Vue SFC 빌드
          설정이 필요하지 않습니다. Vue 2의 기본 스타일과 포커스·그림자 초기값은
          KjunProvider 내부에 적용됩니다.
        </p>
      </section>
    </div>
  );
}
