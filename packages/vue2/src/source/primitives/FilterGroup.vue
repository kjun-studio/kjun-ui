<template>
  <div :class="containerClasses" role="group" :aria-label="ariaLabel || undefined" @keydown="handleGroupKeydown">
    <button
      v-for="option in options"
      :key="option.value === null ? '__all__' : option.value"
      type="button"
      :class="chipClasses(option)"
      :style="chipStyle"
      :disabled="disabled"
      :aria-pressed="String(isSelected(option.value))"
      @click="selectOption(option.value)"
    >
      <span :class="surfaceClasses" :style="selectionStyle(isSelected(option.value))">
        <span
          v-if="option.dot"
          class="inline-block w-selection-dot-size h-selection-dot-size rounded-full shrink-0"
          :style="{ backgroundColor: option.dot }"
        ></span>
        <DsIcon v-if="option.icon" :name="option.icon" size="var(--extension-selection-icon-size)" />
        <span class="ds-filter-chip__label">
          <span class="ds-filter-chip__measure" aria-hidden="true" :style="selectionStyle(true)">{{ option.label }}</span>
          <span>{{ option.label }}</span>
        </span>
      </span>
    </button>
  </div>
</template>

<script>
import DsIcon from "../../icon.js";
import { componentMixins } from "../../component-mixins.js";
import { selectionTypeStyle } from '../../typography'
import { tokens } from '@kjun-ui/tokens'
import { SIZES_EXTENDED, CONTROL_HEIGHTS, oneOf } from '../tokens'
import groupKeyboardNav from './_groupKeyboardNav'

// 필터 칩 그룹 — multiple prop으로 다중 선택 지원 (예: 자산 타입 필터, 로그 레벨 필터).
// 단일 선택 세그먼트 컨트롤이 필요하면 DsButtonGroup을 사용한다.
export default {
  components: { DsIcon },
  name: 'DsFilterGroup',
  mixins: [groupKeyboardNav, ...componentMixins],
  props: {
    value: {
      type: [String, Number, Array],
      default: null
    },
    options: {
      type: Array,
      required: true
      // [{ value: null, label: '전체' }, { value: 'signal', label: '신호' }]
    },
    multiple: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'sm',
      validator: oneOf(SIZES_EXTENDED)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // 좁은 폭(모바일 모달 등)에서 칩을 2줄로 흘리지 않고 한 줄 가로 스크롤로 유지한다.
    // 기본값은 wrap — 기존 사용처는 무변경.
    scroll: {
      type: Boolean,
      default: false
    },
    // role="group" 컨테이너의 접근 가능한 이름. 보이는 라벨이 없거나 미연결된 필터 그룹에 권장.
    ariaLabel: {
      type: String,
      default: null
    }
  },
  computed: {
    // 높이와 같은 Button 체계로 모서리를 키워 크기마다 형태 비율을 유지한다.
    chipStyle() { return { borderRadius: tokens.button.radii[this.size] + 'px' } },
    containerClasses() {
      return ['ds-filter-group', this.scroll
        // flex-nowrap + overflow-x-auto로 한 줄 유지. 스크롤바는 숨기고 넘치는 칩의 부분 노출로 스크롤 여지를 알린다.
        ? 'ds-filter-group--scroll flex flex-nowrap gap-2 overflow-x-auto'
        : 'inline-flex flex-wrap gap-2']
    },
    surfaceClasses() {
      const sizes = {
        xs: 'px-2 text-xs',
        sm: 'px-3',
        md: 'px-3 text-sm',
        lg: 'px-3.5 text-sm',
        xl: 'px-4 text-base'
      }
      return ['ds-filter-chip__surface', CONTROL_HEIGHTS[this.size], sizes[this.size]]
    }
  },
  methods: {
    selectionStyle(active) { return selectionTypeStyle(this.size, active) },
    isSelected(optionValue) {
      if (this.multiple) {
        if (optionValue === null) return Array.isArray(this.value) && this.value.length === 0
        return Array.isArray(this.value) && this.value.includes(optionValue)
      }
      return this.value === optionValue
    },

    selectOption(optionValue) {
      if (this.disabled) return

      if (this.multiple) {
        let next
        if (optionValue === null) {
          next = []
        } else {
          const current = Array.isArray(this.value) ? [...this.value] : []
          const idx = current.indexOf(optionValue)
          if (idx >= 0) {
            current.splice(idx, 1)
          } else {
            current.push(optionValue)
          }
          next = current
        }
        this.$emit('input', next)
        this.$emit('change', next)
      } else {
        this.$emit('input', optionValue)
        this.$emit('change', optionValue)
      }
    },

    chipClasses(option) {
      return [
        'ds-filter-chip',
        `ds-filter-chip--${this.size}`,
        { 'ds-filter-chip--selected': this.isSelected(option.value) }
      ]
    }
  }
}
</script>

<style scoped>
.ds-filter-group {
  min-width: 0;
  max-width: 100%;
}

.ds-filter-chip {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: var(--_kjun-geometry-button-radii-md);
  background: transparent;
  cursor: pointer;
  outline: none;
}

.ds-filter-chip__surface {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--_kjun-geometry-dimension-value4);
  width: 100%;
  border-radius: inherit;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  white-space: nowrap;
  transition: background-color var(--motion-control) var(--ease-out), color var(--motion-control) var(--ease-out);
}

.ds-filter-chip--sm .ds-filter-chip__surface {
  font-size: var(--control-label-size);
}

/* 굵기 변경으로 옆 칩과 스크롤 위치가 움직이지 않도록 선택 상태의 글자 폭을 확보한다. */
.ds-filter-chip__label {
  display: inline-grid;
}

.ds-filter-chip__label > span {
  grid-area: 1 / 1;
}

.ds-filter-chip__measure {
  visibility: hidden;
  font-weight: var(--font-semibold);
}

.ds-filter-chip--selected .ds-filter-chip__surface {
  background: var(--text-primary);
  color: var(--text-inverse);
  font-weight: var(--font-semibold);
}

@media (hover: hover) {
  .ds-filter-chip:not(:disabled):not(.ds-filter-chip--selected):hover .ds-filter-chip__surface {
    background: var(--bg-hover);
  }
}

.ds-filter-chip:focus-visible .ds-filter-chip__surface {
  /* 스크롤 컨테이너 가장자리에서도 초점 표시가 잘리지 않도록 안쪽으로 그린다. */
  outline: var(--_kjun-state-focus-width) solid var(--focus-ring);
  outline-offset: var(--_kjun-state-focus-inset-offset);
}

.ds-filter-chip:disabled {
  opacity: var(--_kjun-state-opacity-disabled-strong);
  cursor: not-allowed;
}

@media (width < token(responsive.selection)) {
  .ds-filter-chip {
    min-height: var(--_kjun-geometry-native-minimum-touch-target);
  }

  .ds-filter-chip__surface {
    min-height: var(--extension-selection-minimum-height);
  }
}

/* 가로 스크롤 모드: 스크롤바를 숨겨 칩 행이 깔끔하게 보이도록 한다(넘치는 칩 부분 노출로 스크롤 여지 전달). */
.ds-filter-group--scroll {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.ds-filter-group--scroll::-webkit-scrollbar {
  display: none;
}
</style>
