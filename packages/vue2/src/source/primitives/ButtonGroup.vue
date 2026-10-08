<template>
  <div :class="containerClasses" :style="containerStyle" role="group" :aria-label="ariaLabel || undefined" @keydown="handleGroupKeydown">
    <span ref="indicator" class="kjun-button-group-indicator" :style="indicatorStyle" aria-hidden="true" hidden />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="buttonClasses(option)"
      :style="[buttonStyle, selectionStyle(value === option.value)]"
      :disabled="disabled"
      :aria-pressed="String(value === option.value)"
      @click.stop="selectOption(option.value)"
    >
      <DsIcon v-if="option.icon" size="var(--extension-selection-icon-size)" :name="option.icon" :class="option.label ? 'mr-1.5' : ''" />
      <span class="kjun-button-group-label"><span aria-hidden="true" :style="selectionStyle(true)">{{ option.label }}</span><span>{{ option.label }}</span></span>
    </button>
  </div>
</template>

<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { tokens } from '@kjun/tokens'
import { selectionTypeStyle } from '../../typography'
import { SIZES_EXTENDED, oneOf } from '../tokens'
import groupKeyboardNav from './_groupKeyboardNav'
import { selectionIndicator } from '@kjun-adapter/selection-indicator.js'

// 단일 선택 세그먼트 컨트롤 (예: 통화 ₩/$ 토글, 기간 선택).
// 다중 선택 필터 칩이 필요하면 DsFilterGroup을 사용한다.
export default {
  components: { DsIcon },
  name: 'DsButtonGroup',
  mixins: [groupKeyboardNav, ...componentMixins],
  mounted() { this._indicator = selectionIndicator(this.$el, this.$refs.indicator) },
  updated() { this._indicator?.update() },
  beforeDestroy() { this._indicator?.destroy() },
  props: {
    value: {
      type: [String, Number],
      default: null
    },
    options: {
      type: Array,
      required: true,
      // [{ value: 'KRW', label: '₩' }, { value: 'USD', label: '$' }]
    },
    size: {
      type: String,
      default: 'md',
      validator: oneOf(SIZES_EXTENDED)
    },
    variant: {
      type: String,
      default: 'primary',
      validator: oneOf(['primary', 'secondary', 'ghost'])
    },
    disabled: {
      type: Boolean,
      default: false
    },
    fullWidth: {
      type: Boolean,
      default: false
    },
    // role="group" 컨테이너의 접근 가능한 이름. 보이는 라벨이 없는 세그먼트 컨트롤에 필수.
    ariaLabel: {
      type: String,
      default: null
    }
  },
  computed: {
    containerStyle() {
      return {
        height: tokens.buttonGroup.heights[this.size] + 'px',
        padding: tokens.buttonGroup.padding[this.size] + 'px',
        borderRadius: tokens.buttonGroup.radii[this.size] + 'px',
      }
    },
    indicatorStyle() { return { borderRadius: tokens.buttonGroup.itemRadii[this.size] + 'px' } },
    buttonStyle() {
      return { ...this.indicatorStyle, paddingInline: tokens.buttonGroup.itemPaddingX[this.size] + 'px' }
    },
    containerClasses() {
      // 모든 화면에서 외곽 높이는 ButtonGroup 토큰을 따른다.
      // w-fit: fullWidth가 아닐 때 폭을 fit-content로 고정한다. flex-column 부모의 기본값
      // align-items:stretch는 cross-size가 auto일 때만 늘리므로, 명시 폭을 주면 모바일 세로
      // 헤더에서 회색 트랙만 전폭으로 늘어나던 stretch 사고를 컴포넌트 차원에서 차단한다.
      return [
        'ds-button-group inline-flex',
        this.fullWidth ? 'w-full' : 'w-fit'
      ]
    }
  },
  methods: {
    selectionStyle(active) { return selectionTypeStyle(this.size, active) },
    selectOption(value) {
      if (this.disabled) return
      this.$emit('input', value)
      this.$emit('change', value)
    },
    buttonClasses(option) {
      const isActive = this.value === option.value

      const base = [
        'ds-button-group__button inline-flex items-center justify-center font-medium whitespace-nowrap',
        this.fullWidth ? 'flex-1' : ''
      ]

      // 높이는 컨테이너가 결정(stretch) — 여기선 가로 패딩과 폰트만.
      const sizeClasses = {
        xs: 'text-xs',
        sm: 'text-[length:var(--control-label-size)]',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-base'
      }

      const stateClasses = isActive
        ? 'bg-card-bg text-text-primary font-semibold'
        : 'bg-transparent text-text-secondary'

      const disabledClasses = this.disabled
        ? 'opacity-disabled cursor-not-allowed'
        : 'cursor-pointer'

      return [...base, sizeClasses[this.size], stateClasses, disabledClasses]
    }
  }
}
</script>

<style scoped>
.ds-button-group {
  position: relative;
  isolation: isolate;
  min-width: 0;
  max-width: 100%;
  background: var(--bg-secondary);
}

.ds-button-group__button {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  outline: none;
  transition: color var(--motion-control) var(--ease-out);
}
.ds-button-group[data-indicator] .ds-button-group__button[aria-pressed="true"] { background: transparent; }
.ds-button-group .kjun-button-group-indicator { background: var(--card-bg); }
@media (prefers-reduced-motion: reduce) {
  .ds-button-group__button { transition: none; }
}

@media (hover: hover) {
  .ds-button-group__button:not(:disabled)[aria-pressed="false"]:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}

.ds-button-group__button:focus-visible {
  /* 가로 스크롤 가장자리에서도 키보드 초점이 잘리지 않도록 안쪽에 표시한다. */
  outline: var(--_kjun-state-focus-width) solid var(--focus-ring);
  outline-offset: var(--_kjun-state-focus-inset-offset);
}

@media (width < token(responsive.selection)), (pointer: coarse) {
  .ds-button-group {
    overflow-x: auto;
    scrollbar-width: none;
  }

  .ds-button-group::-webkit-scrollbar {
    display: none;
  }

  .ds-button-group__button {
    min-width: var(--_kjun-geometry-native-minimum-touch-target);
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
}
</style>
