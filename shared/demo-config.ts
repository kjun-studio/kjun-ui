export const platformNames = { vue2: "Vue 2", react: "React", native: "React Native" } as const;
export type PlatformName = keyof typeof platformNames;
export const paletteLabels = { default: "문서 기본", violet: "보라색 예제", dark: "어두운 배경 예제" } as const;
export type PaletteName = keyof typeof paletteLabels;
export type ComponentName = "button" | "input" | "modal";
export interface DemoConfig {
  component: ComponentName;
  palette: PaletteName;
  size: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  variant: "primary" | "secondary" | "ghost" | "danger" | "danger-ghost" | "success" | "warning";
  loading: boolean;
  disabled: boolean;
  error: boolean;
  readOnly: boolean;
  iconOnly: boolean;
  block: boolean;
}
export const defaultConfig: DemoConfig = {
  component: "button",
  palette: "default",
  size: "md",
  variant: "primary",
  loading: false,
  disabled: false,
  error: false,
  readOnly: false,
  iconOnly: false,
  block: false,
};
export function parseConfig(input: unknown): DemoConfig {
  if (!input || typeof input !== "object") throw Error("예제 설정은 객체여야 합니다.");
  const data = input as Record<string, unknown>;
  const enums = {
    component: ["button", "input", "modal"],
    palette: Object.keys(paletteLabels),
    size: ["xs", "sm", "md", "lg", "xl", "full"],
    variant: ["primary", "secondary", "ghost", "danger", "danger-ghost", "success", "warning"],
  };
  for (const [key, values] of Object.entries(enums))
    if (!values.includes(data[key] as string)) throw Error("지원하지 않는 " + key);
  for (const key of ["loading", "disabled", "error", "readOnly", "iconOnly", "block"])
    if (typeof data[key] !== "boolean") throw Error(key + "는 boolean이어야 합니다.");
  if (Object.keys(data).some((k) => !(k in defaultConfig))) throw Error("알 수 없는 설정입니다.");
  if (data.component === "input" && !["sm", "md", "lg"].includes(data.size as string))
    throw Error("입력 크기는 sm/md/lg입니다.");
  if (data.component === "button" && data.size === "full")
    throw Error("버튼에 full 크기는 없습니다.");
  if (data.component === "modal" && data.size === "xs") throw Error("모달에 xs 크기는 없습니다.");
  return { ...data } as unknown as DemoConfig;
}
export const labelFor = (c: DemoConfig) => (c.iconOnly ? undefined : "계속하기");
export function componentProps(c: DemoConfig) {
  if (c.component === "button")
    return {
      size: c.size,
      variant: c.variant,
      loading: c.loading,
      disabled: c.disabled,
      block: c.block,
      ...(c.iconOnly ? { prefixIcon: "plus", ariaLabel: "항목 추가" } : {}),
    };
  if (c.component === "input")
    return {
      size: c.size,
      disabled: c.disabled,
      readOnly: c.readOnly,
      error: c.error,
      errorMessage: c.error ? "내용을 입력해 주세요." : "",
      clearable: true,
      placeholder: "내용을 입력하세요",
    };
  return {
    size: c.size,
    title: "변경 사항 저장",
    showFooter: true,
    confirmText: "저장",
    loading: c.loading,
    confirmDisabled: c.disabled,
    footerSize: "lg",
  };
}
const kebab = (s: string) => s.replace(/[A-Z]/g, (x) => "-" + x.toLowerCase());
export function exampleCode(platform: PlatformName, c: DemoConfig) {
  const name =
    c.component === "button" ? "DsButton" : c.component === "input" ? "DsInput" : "DsModal";
  const props = componentProps(c);
  const jsx = Object.entries(props)
    .filter(([, v]) => v !== false && v !== "" && v !== undefined)
    .map(([k, v]) =>
      typeof v === "boolean"
        ? k
        : k + "=" + (typeof v === "string" ? JSON.stringify(v) : "{" + v + "}"),
    )
    .join(" ");
  if (platform === "vue2") {
    const attrs = Object.entries(props)
      .filter(([, v]) => v !== false && v !== "" && v !== undefined)
      .map(([k, v]) =>
        typeof v === "boolean"
          ? ":" + kebab(k === "readOnly" ? "readonly" : k) + '="true"'
          : kebab(k) + "=" + JSON.stringify(v),
      )
      .join(" ");
    const body =
      c.component === "button"
        ? "<DsButton " + attrs + ' @click="onAction">' + (labelFor(c) || "") + "</DsButton>"
        : c.component === "input"
          ? '<DsFormGroup label="내용"><DsInput v-model="value" ' + attrs + " /></DsFormGroup>"
          : '<DsButton @click="open = true">모달 열기</DsButton>\n  <DsModal v-model="open" ' +
            attrs +
            ' @confirm="save">입력한 내용을 저장할까요?</DsModal>';
    return (
      '<template>\n  <KjunProvider>\n    ' +
      body +
      '\n  </KjunProvider>\n</template>\n<script>\nimport { KjunProvider, DsButton, DsInput, DsModal, DsFormGroup } from "@kjun-ui/vue2";\nimport "@kjun-ui/vue2/styles.css";\nimport "./design-system/kjun.css";\nexport default {\n  components: { KjunProvider, DsButton, DsInput, DsModal, DsFormGroup },\n  data: () => ({ value: "", open: false }),\n  methods: { onAction() {}, save() { this.open = false; } }\n};\n</script>'
    );
  }
  const native = platform === "native";
  const click = native ? "onPress" : "onClick";
  const body =
    c.component === "button"
      ? "<DsButton " +
        jsx +
        " " +
        click +
        "={() => setCount(count + 1)}" +
        (c.iconOnly ? " />" : ">계속하기</DsButton>")
      : c.component === "input"
        ? '<DsFormGroup label="내용">\n      <DsInput value={value} ' +
          (native
            ? "onChangeText={setValue}"
            : "onChange={event => setValue(event.target.value)}") +
          " " +
          jsx +
          " />\n    </DsFormGroup>"
        : "<DsButton " +
          click +
          "={() => setOpen(true)}>모달 열기</DsButton>\n    <DsModal open={open} onOpenChange={setOpen} " +
          jsx +
          " onConfirm={() => setOpen(false)}>" +
          (native ? "<Text>입력한 내용을 저장할까요?</Text>" : "입력한 내용을 저장할까요?") +
          "</DsModal>";
  return (
    'import { useState } from "react";\n' +
    (native ? 'import { Text } from "react-native";\n' : "") +
    'import { KjunProvider, DsButton, DsInput, DsModal, DsFormGroup } from "@kjun-ui/' +
    platform +
    '";\n' +
    (native ? 'import { appColors, appFont } from "./design-system/kjun";\n' : 'import "@kjun-ui/react/styles.css";\nimport "./design-system/kjun.css";\n') +
    '\nexport function Example() {\n  const [count, setCount] = useState(0);\n  const [value, setValue] = useState("");\n  const [open, setOpen] = useState(false);\n  return <KjunProvider' +
    (native ? ' colors={appColors} fontFamily={appFont}' : '') +
    '>\n    ' +
    body +
    "\n  </KjunProvider>;\n}"
  );
}
