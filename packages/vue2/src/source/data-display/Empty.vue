<template>
  <div :class="wrapperClasses">
    <DsIcon
      v-if="icon"
      :name="icon"
      :size="iconSize"
      aria-hidden="true"
    />
    <p>{{ text }}</p>
    <small v-if="description">{{ description }}</small>
    <div v-if="$slots.default">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { tokens } from '@kjun-ui/tokens';
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { DsIcon },
  name: 'DsEmpty',
  props: {
    text: {
      type: String,
      default: '데이터가 없습니다'
    },
    description: {
      type: String,
      default: ''
    },
    // 선택적 빈 상태 아이콘(짧은 이름). 미지정 시 기존 동작과 동일하게 아이콘 없음.
    icon: {
      type: String,
      default: ''
    }
  },
  computed: {
    iconSize() { return tokens.extensions.empty.iconSize; },
    wrapperClasses() {
      return 'kjun-empty'
    }
  }
}
</script>
