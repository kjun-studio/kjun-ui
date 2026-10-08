import { extensions } from "./extensions.ts";
import { extensionLayouts } from "./extension-usage.ts";
import { actions } from "./actions.ts";
import { inputs } from "./inputs.ts";
import { navigation } from "./navigation.ts";
import { layout } from "./layout.ts";
import { feedback } from "./feedback.ts";
import { dataDisplay } from "./data-display.ts";
import { finance } from "./finance.ts";
import { visual, defaultFigureDescription, type GuideCase, type VisualGuide, type GuideAuthor } from "./types.ts";
import { exampleDefinition, validateSettings } from "../example-registry.ts";
import type { PlatformName } from "../demo-config.ts";
export const authors: Record<string, GuideAuthor> = {
  ...extensions,
  ...actions,
  ...inputs,
  ...navigation,
  ...layout,
  ...feedback,
  ...dataDisplay,
  ...finance,
};
export const guideAnchors = [
  ...extensionLayouts.map(entry => entry.id),
  "selection",
  "layers",
  "feedback",
  "loading",
  "form",
  "toolbar",
  "assets",
  "writing",
];
const selection: Record<string, Record<string, any>> = {
  DsCheckbox: { checked: true },
  DsSwitch: { switch: true },
  DsRadio: { radio: "c" },
  DsRadioGroup: { radio: "c" },
  DsSelect: { select: "a" },
  DsCombobox: { combo: "a" },
  DsButtonGroup: { group: "c" },
  DsFilterGroup: { filters: ["a", "c"] },
  DsTabs: { tab: "two" },
  DsTabPane: { tab: "two" },
  DsIconToggle: { active: true },
  DsTable: {
    selected: [
      { id: "a", name: "긴 한국어 자산 이름", symbol: "AAA", price: 1234567, change: 2.35 },
    ],
    expanded: ["a"],
  },
};
export function buildVisualGuides(
  api: any,
  catalog: any[],
  descriptions: Record<string, any>,
): Record<string, VisualGuide> {
  const entries = [
    ...catalog.filter((c) => c.kind !== "internal"),
    { name: "KjunFeedbackProvider", docs: "/feedback" },
  ];
  if (Object.keys(authors).length !== entries.length || entries.some(entry => !authors[entry.name]))
    throw Error("Visual guide coverage must match public components plus feedback.");
  return Object.fromEntries(
    entries.map((entry) => {
      const name = entry.name,
        author = authors[name];
      if (!author || !author.parts.length || !guideAnchors.includes(author.related!))
        throw Error("Incomplete visual guide: " + name);
      const platforms = Object.fromEntries(
        (["vue2", "react", "native"] as PlatformName[]).map((platform) => {
          const props: any[] = api.components[name]?.[platform]?.props || [];
          const has = (key: string) => props.some((p) => p.name === key);
          const make = (
            id: string,
            label: string,
            description: string,
            prop: string,
            value: unknown,
          ): GuideCase => ({ id, label, description, settings: visual(name, { [prop]: value }) });
          const states: GuideCase[] = [
            {
              id: "default",
              label: "기본 예제",
              description: "사용 예제의 초기 설정입니다. 패키지 기본값은 API 표에서 확인하세요.",
            },
          ];
          for (const [prop, label, value, description] of [
            ["disabled", "비활성", true, "이 컴포넌트의 입력 또는 행동을 비활성화합니다."],
            ["loading", "로딩", true, "공개 loading 속성으로 진행 중 상태를 표시합니다."],
            [
              "error",
              "오류",
              "목록을 불러오지 못했습니다.",
              "공개 error 속성이 담당하는 오류 상태입니다.",
            ],
            [
              "stale",
              "오래된 값",
              true,
              "값의 신선도 표현입니다. 요청 실패나 입력 오류와 구분합니다.",
            ],
          ] as const) {
            if (
              !has(prop) ||
              name === "DsDataState" ||
              (name === "DsFormGroup" && prop === "error")
            )
              continue;
            const literal =
              prop === "error" && props.find((p) => p.name === prop).type.includes("boolean")
                ? true
                : value;
            const state = make(prop, label, description, prop, literal);
            // A boolean field error only colors the control; the wrapping FormGroup carries the text,
            // so the comparison never shows an error by color alone. Examples without a FormGroup ignore it.
            if (prop === "error" && literal === true)
              state.settings = { visual: JSON.stringify({ ...JSON.parse(String(state.settings!.visual)), DsFormGroup: { props: { error: "입력 내용을 확인해 주세요." } } }) };
            states.push(state);
          }
          if (selection[name])
            states.push({
              id: "selected",
              label: name === "DsTable" ? "선택·확장" : "선택 상태",
              description: "소비자가 관리하는 값을 예제의 초기 상태로 제공합니다.",
              values: selection[name],
            });
          if (name === "DsFormGroup")
            states.push(
              {
                id: "error",
                label: "필드 오류",
                description: "FormGroup의 안내와 자식 Input의 오류 표현을 연결합니다.",
                // Matches the FormGroup example's "내용" label and its error preset.
                settings: { errorMessage: "내용을 입력해 주세요." },
              },
              {
                id: "child-disabled",
                label: "자식 입력 비활성",
                description: "FormGroup에는 disabled가 없습니다. 자식 Input에 적용합니다.",
                settings: { childDisabled: true },
              },
            );
          if (has("confirmDisabled"))
            states.push(
              make(
                "confirm-disabled",
                "확인 비활성",
                "푸터 확인 행동에만 적용됩니다.",
                "confirmDisabled",
                true,
              ),
            );
          if (author.action)
            states.push({
              id: "open",
              label: "열림·내용 확인",
              description:
                "실행 비교를 연 뒤 트리거로 내용을 확인합니다. 닫기와 키보드 동작도 함께 확인하세요.",
              action: author.action,
            });
          if (["DsDataState", "DsSelect", "DsSearchInput"].includes(name)) {
            for (const preset of exampleDefinition(name).presets.filter(
              (p) => p.id !== "default" && !states.some((s) => s.id === p.id),
            ))
              states.push({
                ...preset,
                description: "기존 예제 프리셋으로 상태 전이를 확인합니다.",
              });
          }
          if (name === "KjunFeedbackProvider") {
            states.splice(
              0,
              states.length,
              ...["Toast", "Confirm", "Prompt"].map((service) => ({
                id: service.toLowerCase(),
                label: service,
                description:
                  service === "Toast"
                    ? "작업 결과를 짧게 통지합니다."
                    : service === "Confirm"
                      ? "결정을 요청하고 true 또는 false를 반환합니다."
                      : "입력을 검증하고 문자열 또는 null을 반환합니다.",
                settings: { service, duration: 0 },
                action: service === "Toast" ? "Toast 표시" : service + " 요청",
              })),
            );
          }
          if (name === "DsCollectionMark")
            states.push(
              make(
                "inactive",
                "미등록",
                "수집 표시의 비활성 값입니다. 클릭 비활성과 다릅니다.",
                "active",
                false,
              ),
            );
          states.push(...(author.states || []).filter(item => !states.some(state => state.id === item.id)));
          const size = props.find((p) => p.name === "size");
          const sizeNames: Array<string | number> = !size
            ? []
            : name === "DsIcon"
              ? [16, 24, 32]
              : size.type.includes("DisplaySize")
                ? ["xs", "sm", "md", "lg", "xl"]
                : [...size.type.matchAll(/"([^"\n]+)"/g)].map((m: any) => m[1]);
          const sizes = sizeNames.map((value) => ({
            ...make(
              "size-" + value,
              String(value),
              "공개 size 속성의 비교 설정입니다.",
              "size",
              value,
            ),
            ...(author.action ? { action: author.action } : {}),
            ...(name === "DsDataState"
              ? { settings: { ...visual(name, { size: value }), empty: true } }
              : {}),
          }));
          const figures = [
            {
              id: "default",
              label: name === "KjunFeedbackProvider" ? "Toast" : "구성 영역",
              description: author.description ?? defaultFigureDescription,
              parts: author.parts,
              settings: author.settings,
              values: author.values,
              action: author.action,
              ...(author.captureParts ? { captureParts: true } : {}),
            },
            ...(author.figures || []),
          ];
          for (const item of [...figures, ...states, ...sizes]) {
            validateSettings(name, item.settings || {});
            const spec = JSON.parse(item.settings?.visual || "{}");
            for (const [target, raw] of Object.entries(spec)) {
              const targetProps = api.components[target]?.[platform]?.props;
              if (!targetProps) throw Error(`Unknown visual target: ${name}/${platform}/${target}`);
              for (const key of Object.keys((raw as any).props || {}))
                if (!targetProps.some((p: any) => p.name === key))
                  throw Error(`Unknown visual prop: ${name}/${platform}/${target}.${key}`);
            }
          }
          for (const items of [figures, states, sizes])
            if (new Set(items.map((c) => c.id)).size !== items.length)
              throw Error("Duplicate visual case: " + name);
          return [
            platform,
            {
              figures,
              states,
              sizes,
              sizeDefault: size?.default || "—",
              note:
                descriptions[name]?.states || "서비스 종류에 맞는 메시지와 반환값을 사용하세요.",
            },
          ];
        }),
      ) as VisualGuide["platforms"];
      return [
        name,
        {
          name,
          path: entry.docs,
          related: author.related!,
          description: descriptions[name]?.description || "영역별 Toast·Confirm·Prompt",
          platforms,
        },
      ];
    }),
  );
}
