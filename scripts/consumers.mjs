import { writeFile, readFile, copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { assertCurrentPacked, verifyInstalledPackages } from "./package-state.mjs";
import { verifyConsumerTypes } from "./consumer-types.mjs";
import { withConsumerWorkspace } from "./consumer-workspace.mjs";
const root = resolve(import.meta.dirname, "..");
const directory = await withConsumerWorkspace(verifyConsumer);
console.log("Packed package consumer verified: " + directory);

async function verifyConsumer(dir) {
  const packed = await assertCurrentPacked();
  const dependencies = {
    react: "19.2.6",
    "react-dom": "19.2.6",
    vue: "3.5.43",
    "react-native": "0.86.3",
    "react-native-web": "0.21.0",
    "react-native-svg": "15.15.5",
    "@types/react": "19.2.14",
  };
  const catalog = JSON.parse(
    await readFile(resolve(root, "shared/component-catalog.json"), "utf8"),
  );
  const publicNames = [
    ...catalog.filter((item) => item.kind !== "internal").map((item) => item.name),
    "KjunProvider",
    "KjunFeedbackProvider",
  ];
  const manifest = JSON.parse(await readFile(resolve(root, "artifacts/manifest.json"), "utf8"));
  for (const item of manifest) dependencies[item.name] = "file:" + resolve(root, "artifacts", item.file);
  await writeFile(
    dir + "/package.json",
    JSON.stringify(
      {
        name: "kjun-packed-consumer",
        private: true,
        type: "module",
        dependencies,
      },
      null,
      2,
    ),
  );
  execFileSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: dir,
    stdio: "inherit",
  });
  execFileSync("node", ["--input-type=module", "-e",
    "import {createSSRApp,h} from 'vue';import {renderToString} from 'vue/server-renderer';import Kjun,{KjunProvider,KjunButton} from '@kjun-ui/vue3';import plugin from '@kjun-ui/vue3/plugin';const app=createSSRApp({render:()=>h(KjunProvider,null,{default:()=>h(KjunButton,null,{default:()=>'Save'})})});app.use(Kjun);const html=await renderToString(app);if(plugin!==Kjun||!html.includes('kjun-scope')||!html.includes('kjun-button'))throw Error('Vue 3 consumer failed: '+html);"],
    { cwd: dir, stdio: "inherit" });
  execFileSync("node", ["--input-type=commonjs", "-e",
    "const ui=require('@kjun-ui/vue3');const plugin=require('@kjun-ui/vue3/plugin');if(plugin!==ui.default||typeof plugin.install!=='function')throw Error('Vue 3 CommonJS consumer failed');"],
    { cwd: dir, stdio: "inherit" });
  await writeFile(
    dir + "/consumer.tsx",
    `import React from 'react';import {KjunButton,KjunInput,KjunModal,KjunProvider} from '@kjun-ui/react';import {KjunButton as NativeButton,KjunInput as NativeInput,KjunModal as NativeModal,KjunProvider as NativeProvider} from '@kjun-ui/native';import {tokens, type KjunColors} from '@kjun-ui/tokens';
const sharedLength: 48 = tokens.dimension.value48;
// @ts-expect-error Pre-release spacing names were removed without aliases.
const retiredSpacing = tokens.spacing;
import * as VueComponents from '@kjun-ui/vue3';
const vueButtonProps: VueComponents.KjunButtonProps={size:'xl',variant:'danger-ghost'};
const vueInputProps: VueComponents.KjunInputProps={size:'md',modelValue:'',errorMessage:''};
// @ts-expect-error Vue's declared sizes follow the shared button sizes.
const invalidVueSize: VueComponents.KjunButtonProps={size:'xxl'};
// @ts-expect-error Input has the three-step source size contract.
const invalidVueInput: VueComponents.KjunInputProps={size:'xl'};
import * as ReactComponents from '@kjun-ui/react';
import * as NativeComponents from '@kjun-ui/native';
${["VueComponents", "ReactComponents", "NativeComponents"]
  .map(
    (namespace) =>
      `const ${namespace}Exports = [${publicNames
        .map((name) => namespace + "." + name)
        .join(",")}];`,
  )
  .join("\n")}
const search=<ReactComponents.KjunSearchInput value="" loadOptions={async(query,{signal})=>{signal.throwIfAborted();return [{name:query}]}}/>;
const nativeSearch=<NativeComponents.KjunSearchInput value="" loadOptions={async(query,{signal})=>{signal.throwIfAborted();return [{name:query}]}}/>;
const filled=<ReactComponents.KjunIcon name="star" filled/>;
// @ts-expect-error Native device clipboard must be supplied by the project.
const missingClipboard=<NativeComponents.KjunCopyButton value="copy"/>;
// @ts-expect-error Product palettes are not a native provider API.
const oldNative=<NativeComponents.KjunProvider theme="product" colors={appColors}>Body</NativeComponents.KjunProvider>;
const web=<KjunProvider><KjunButton size="xl" variant="danger-ghost">Delete</KjunButton><KjunInput value="value" onChange={()=>{}}/><KjunModal open={false} onOpenChange={()=>{}}>Body</KjunModal></KjunProvider>;
declare const appColors: KjunColors;
declare const coreColors: import('@kjun-ui/tokens').KjunCoreColors<import('react-native').ColorValue>;
const minimalNative=<NativeProvider colors={coreColors}><NativeButton>Core colors</NativeButton></NativeProvider>;
import {resolveKjunColors, type ResolvedKjunColors} from '@kjun-ui/tokens';
const resolvedColors: ResolvedKjunColors=resolveKjunColors(appColors);
const optionalRoleAfterResolution: string=resolvedColors.inputBorderFocus;
${["VueComponents", "ReactComponents", "NativeComponents"]
  .map(
    (namespace) => `
const ${namespace}AccentCard: ${namespace}.KjunCardProps={surface:'accent',padding:'sm',bodyPadding:'none',radius:'lg',border:false};
const ${namespace}SubtleCard: ${namespace}.KjunCardProps={surface:'subtle'};
// @ts-expect-error Color names are no longer card options.
const ${namespace}OldBlueCard: ${namespace}.KjunCardProps={gradient:'blue'};
// @ts-expect-error Color names are no longer card options.
const ${namespace}OldIndigoCard: ${namespace}.KjunCardProps={gradient:'indigo'};
`,
  )
  .join("\n")}
const cardColors: KjunColors={...appColors,cardAccentStart:'app-accent',cardAccentEnd:'app-accent-end',cardSubtleStart:'app-subtle',cardSubtleEnd:'app-subtle-end',cardSubtleBorder:'app-outline'};
${["cardBlueStart", "cardBlueEnd", "cardIndigoStart", "cardIndigoEnd", "cardIndigoBorder"]
  .map(
    (role) => `
// @ts-expect-error Retired color names must not remain in the public role contract.
const retired${role}: import('@kjun-ui/tokens').ColorRole='${role}';
`,
  )
  .join("\n")}
const native=<NativeProvider colors={appColors}><NativeButton size="sm" onPress={()=>{}}>Save</NativeButton><NativeInput value="value" onChangeText={()=>{}}/><NativeModal open={false} onOpenChange={()=>{}}>Body</NativeModal></NativeProvider>;
${["VueComponents", "ReactComponents", "NativeComponents"]
  .map(
    (namespace) => `
const ${namespace}Sort: ${namespace}.TableSort = {key:"amount",order:"desc"};
const ${namespace}ServerTable: ${namespace}.KjunTableProps = {columns:[{key:"amount",label:"Amount",sortable:true}],sort:${namespace}Sort,sortMode:"server"};
const ${namespace}ClearedTable: ${namespace}.KjunTableProps = {columns:[],sort:null};
// @ts-expect-error Only supported sorting locations belong to the contract.
const ${namespace}InvalidSortMode: ${namespace}.KjunTableProps = {columns:[],sortMode:"remote"};
// @ts-expect-error Sort order is a direction, not a free-form string.
const ${namespace}InvalidSort: ${namespace}.KjunTableProps = {columns:[],sort:{key:"amount",order:"descending"}};
`,
  )
  .join("\n")}
// @ts-expect-error Product names are not a styling API.
const oldWeb=<KjunProvider theme="product">Body</KjunProvider>;
// @ts-expect-error Native requires project-owned colors.
const missingColors=<NativeProvider>Body</NativeProvider>;
// @ts-expect-error Every core color role is required.
const partialColors=<NativeProvider colors={{brand: "red"}}>Body</NativeProvider>;
if(tokens.button.heights.md!==40)throw new Error('Invalid token output');
`,
  );
  await copyFile(resolve(root, "tests/fixtures/runtime-types.tsx"), dir + "/runtime-types.tsx");
  await verifyConsumerTypes(root, dir);
  execFileSync(
    resolve(root, "node_modules/.bin/tsc"),
    [
      "consumer.tsx",
      "runtime-types.tsx",
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--jsx",
      "react-jsx",
      "--moduleResolution",
      "Bundler",
      "--module",
      "ESNext",
      "--target",
      "ES2018",
      "--esModuleInterop",
    ],
    { cwd: dir, stdio: "inherit" },
  );
  await verifyInstalledPackages(dir, packed);
  // Do not certify a consumer if files changed while npm was installing.
  const currentPacked = await assertCurrentPacked();
  if (
    currentPacked.source !== packed.source ||
    JSON.stringify(currentPacked.manifest) !== JSON.stringify(packed.manifest)
  )
    throw Error("Packages changed during consumer verification. Run verify:consumers again.");
  return {
    source: packed.source,
    manifest: packed.manifest,
    verified: [
      "Vue 3.5 runtime (SSR render and CommonJS plugin)",
      "React 19 types",
      "React Native 0.86 types",
      "Bundler, Node16, NodeNext ESM and CommonJS types with inference and negative cases",
    ],
    packages: dependencies,
  };
}
