import * as R from '@kjun/react';
import * as N from '@kjun/native';
import * as V from '@kjun/vue2';
import { tokens, type KjunColors, type InputSize } from '@kjun/tokens';
import { icons, type IconNode } from '@kjun/tokens/icons';

const size: InputSize = 'md';
const icon: IconNode[] = icons.check;
const height: number = tokens.input[size].height;
declare const colors: KjunColors;
const color: string = colors.brand;
const item = { value: 0, label: 'Zero', amount: 7 };
R.DsSelect({ value: 0, options: [item], renderOption: option => {
  const amount: number = option.amount;
  // @ts-expect-error Inference must retain the number field, never any.
  const invalid: string = option.amount;
  // @ts-expect-error Unknown fields must not be accepted by inferred options.
  return option.missing;
} });
N.DsSelect({ value: 0, options: [item], renderOption: option => {
  const amount: number = option.amount;
  // @ts-expect-error Inference must retain the number field, never any.
  const invalid: string = option.amount;
  // @ts-expect-error Unknown fields must not be accepted by inferred options.
  return option.missing;
} });
R.DsTable({ data: [item], columns: [], onSelectionChange: rows => {
  const amount: number = rows[0].amount;
  // @ts-expect-error Row inference must survive every declaration hop.
  const invalid: string = rows[0].amount;
} });
N.DsTable({ data: [item], columns: [], onSelectionChange: rows => {
  const amount: number = rows[0].amount;
  // @ts-expect-error Row inference must survive every declaration hop.
  const invalid: string = rows[0].amount;
} });
const reactProps: R.DsSelectProps<typeof item> = { value: 0, options: [item] };
const nativeProps: N.DsTabsProps = { value: '', items: [] };
const vueProps: V.DsSelectProps = { value: 0, open: undefined };
// @ts-expect-error Public interfaces must not degrade to any.
const invalidReact: R.DsSelectProps = { value: 0, open: 'yes' };
// @ts-expect-error Public interfaces must not degrade to any.
const invalidNative: N.DsAccordionProps = { multiple: 'yes', children: null };
// @ts-expect-error Public interfaces must not degrade to any.
const invalidVue: V.DsSelectProps = { open: 'yes' };
// @ts-expect-error Token unions must not degrade to any.
const invalidSize: InputSize = 'unknown';

const elevationR: R.CardElevation = 'raised';
const elevationN: N.ElevationRole = 'floating';
const elevationV: V.CardElevation = 'flat';
const shadowLayer: V.ShadowLayer = tokens.shadowScale.ambient[0];
const cardR: R.DsCardProps = { elevation: elevationR };
const cardN: N.DsCardProps = { elevation: 'flat' };
const cardV: V.DsCardProps = { elevation: elevationV };
// @ts-expect-error Cards cannot float as popups.
const floatingCard: R.DsCardProps = { elevation: 'floating' };
// @ts-expect-error Removed shadow prop has no compatibility alias.
const oldCard: R.DsCardProps = { shadow: 'card' };
// @ts-expect-error Removed hover prop has no compatibility alias.
const oldNativeCard: N.DsCardProps = { hover: true };
// @ts-expect-error Removed Vue shadow prop has no compatibility alias.
const oldVueCard: V.DsCardProps = { shadow: 'sm' };

import rocket from '@kjun/icons/icons/rocket';
import { tablerVersion, type KjunIconRegistry } from '@kjun/icons';
import { defaultIcons } from '@kjun/icons/defaults';
import { iconMetadata } from '@kjun/icons/metadata';
import { allIcons } from '@kjun/icons/all';
const projectIcons: KjunIconRegistry = { rocket };
const iconsReact: R.KjunProviderProps = { icons: projectIcons, children: null };
const iconsNative: N.KjunProviderProps = { icons: projectIcons, colors, children: null };
const iconsVue: V.KjunProviderProps = { icons: projectIcons };
// @ts-expect-error A registry value must contain an outline definition.
const invalidIcon: KjunIconRegistry = { rocket: [] };
const pinnedTabler: '3.48.0' = tablerVersion;

// @ts-expect-error Unknown official paths must fail during type checking too.
import nonexistentIcon from '@kjun/icons/icons/not-a-tabler-icon';
