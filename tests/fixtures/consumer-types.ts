import * as R from '@kjun-ui/react';
import * as N from '@kjun-ui/native';
import * as V from '@kjun-ui/vue3';
import { tokens, type KjunColors, type InputSize } from '@kjun-ui/tokens';
import { icons, type IconNode } from '@kjun-ui/tokens/icons';

const size: InputSize = 'md';
const icon: IconNode[] = icons.check;
const height: number = tokens.input[size].height;
declare const colors: KjunColors;
const color: string = colors.brand;
const item = { value: 0, label: 'Zero', amount: 7 };
R.KjunSelect({ value: 0, options: [item], renderOption: option => {
  const amount: number = option.amount;
  // @ts-expect-error Inference must retain the number field, never any.
  const invalid: string = option.amount;
  // @ts-expect-error Unknown fields must not be accepted by inferred options.
  return option.missing;
} });
N.KjunSelect({ value: 0, options: [item], renderOption: option => {
  const amount: number = option.amount;
  // @ts-expect-error Inference must retain the number field, never any.
  const invalid: string = option.amount;
  // @ts-expect-error Unknown fields must not be accepted by inferred options.
  return option.missing;
} });
R.KjunTable({ data: [item], columns: [], onSelectionChange: rows => {
  const amount: number = rows[0].amount;
  // @ts-expect-error Row inference must survive every declaration hop.
  const invalid: string = rows[0].amount;
} });
N.KjunTable({ data: [item], columns: [], onSelectionChange: rows => {
  const amount: number = rows[0].amount;
  // @ts-expect-error Row inference must survive every declaration hop.
  const invalid: string = rows[0].amount;
} });
const reactProps: R.KjunSelectProps<typeof item> = { value: 0, options: [item] };
const nativeProps: N.KjunTabsProps = { value: '', items: [] };
const vueProps: V.KjunSelectProps = { modelValue: 0, open: undefined };
// Template refs expose native elements (Vue unwraps the refs) and preserve component contracts.
declare const inputRef: InstanceType<typeof V.KjunInput>;
declare const textareaRef: InstanceType<typeof V.KjunTextarea>;
inputRef.focus();
textareaRef.focus();
const inputElement: HTMLInputElement | null = inputRef.el;
const textareaElement: HTMLTextAreaElement | null = textareaRef.el;
const inputProps: typeof inputRef.$props = { modelValue: 0, size: 'sm', 'onUpdate:modelValue': value => { const text: string = value; } };
const textareaProps: typeof textareaRef.$props = { modelValue: '', rows: 4, resize: 'vertical' };
inputRef.$emit('update:modelValue', 'typed');
textareaRef.$emit('update:modelValue', 'typed');
// @ts-expect-error The exposed input element must not become any or a Ref.
const wrongInputElement: HTMLTextAreaElement | null = inputRef.el;
// @ts-expect-error The exposed textarea element retains its native type.
const wrongTextareaElement: HTMLInputElement | null = textareaRef.el;
// @ts-expect-error Instance props must retain their size union.
const wrongInputProps: typeof inputRef.$props = { size: 'xl' };
// @ts-expect-error Instance events must retain their payload type.
textareaRef.$emit('update:modelValue', 123);
// @ts-expect-error Public interfaces must not degrade to any.
const invalidReact: R.KjunSelectProps = { value: 0, open: 'yes' };
// @ts-expect-error Public interfaces must not degrade to any.
const invalidNative: N.KjunAccordionProps = { multiple: 'yes', children: null };
// @ts-expect-error Public interfaces must not degrade to any.
const invalidVue: V.KjunSelectProps = { open: 'yes' };
// @ts-expect-error Token unions must not degrade to any.
const invalidSize: InputSize = 'unknown';

const elevationR: R.CardElevation = 'raised';
const elevationN: N.ElevationRole = 'floating';
const elevationV: V.KjunCardProps['elevation'] = 'flat';
const cardR: R.KjunCardProps = { elevation: elevationR };
const cardN: N.KjunCardProps = { elevation: 'flat' };
const cardV: V.KjunCardProps = { elevation: elevationV };
// @ts-expect-error Cards cannot float as popups.
const floatingCard: R.KjunCardProps = { elevation: 'floating' };
// @ts-expect-error Removed shadow prop has no compatibility alias.
const oldCard: R.KjunCardProps = { shadow: 'card' };
// @ts-expect-error Removed hover prop has no compatibility alias.
const oldNativeCard: N.KjunCardProps = { hover: true };
// @ts-expect-error Removed Vue shadow prop has no compatibility alias.
const oldVueCard: V.KjunCardProps = { shadow: 'sm' };

import rocket from '@kjun-ui/icons/icons/rocket';
import { tablerVersion, type KjunIconRegistry } from '@kjun-ui/icons';
import { defaultIcons } from '@kjun-ui/icons/defaults';
import { iconMetadata } from '@kjun-ui/icons/metadata';
import { allIcons } from '@kjun-ui/icons/all';
const projectIcons: KjunIconRegistry = { rocket };
const iconsReact: R.KjunProviderProps = { icons: projectIcons, children: null };
const iconsNative: N.KjunProviderProps = { icons: projectIcons, colors, children: null };
const iconsVue: InstanceType<typeof V.KjunProvider>['$props'] = { icons: projectIcons };
// @ts-expect-error A registry value must contain an outline definition.
const invalidIcon: KjunIconRegistry = { rocket: [] };
const pinnedTabler: '3.48.0' = tablerVersion;

// @ts-expect-error Unknown official paths must fail during type checking too.
import nonexistentIcon from '@kjun-ui/icons/icons/not-a-tabler-icon';
