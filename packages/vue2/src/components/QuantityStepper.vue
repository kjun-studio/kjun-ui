<template>
  <div class="kjun-quantity" :data-size="size" :data-block="String(block)" :data-error="String(fieldInvalid)">
    <KjunButton :size="size" :style="buttonStyle" variant="ghost" aria-label="수량 줄이기" :disabled="blocked || value <= min" @mousedown.native.prevent @click="move(-1)" prefix-icon="minus" />
    <input class="kjun-input" :id="id || fieldId" type="text" :inputmode="precision ? 'decimal' : 'numeric'" role="spinbutton" :aria-label="ariaLabel || (fieldLabelledby ? undefined : '수량')" :aria-labelledby="ariaLabel ? undefined : fieldLabelledby" :aria-describedby="fieldDescribedby" :aria-required="kjunFormGroup && kjunFormGroup.required ? 'true' : undefined" :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="value" :aria-invalid="fieldInvalid ? 'true' : undefined" :value="draft" :disabled="blocked" @input="edit" @blur="commit" @compositionstart="composing = true" @compositionend="composing = false; edit($event)" @keydown="key" />
    <KjunButton :size="size" :style="buttonStyle" variant="ghost" aria-label="수량 늘리기" :disabled="blocked || (max !== undefined && value >= max)" @mousedown.native.prevent @click="move(1)" prefix-icon="plus" />
  </div>
</template>
<script>
import KjunButton from "../source/primitives/Button.vue";
import quantity from "./quantity.js";
import { defaultIcons, withFallbackIcons } from "../../../../shared/package-runtime/icon-registry";
import { componentIcons } from "../../../../shared/package-runtime/component-icons";
export default {
  name: "KjunQuantityStepper", inheritAttrs: false, components: { KjunButton }, mixins: [quantity],
  inject: { kjunParentIcons: { from: "kjunIcons", default: null } },
  provide() { return { kjunIcons: () => this.stepperIcons }; },
  computed: { stepperIcons() { return withFallbackIcons(this.kjunParentIcons?.() || defaultIcons, componentIcons); } },
};
</script>
