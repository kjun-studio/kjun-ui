<template>
  <div  :aria-busy="loading || items.some(item => item.loading) ? 'true' : 'false'" class="ds-kpi-row" :class="[sizeClass, { 'ds-kpi-row--hero-first': heroFirst, 'ds-kpi-row--mobile-summary': mobileSummary && size !== 'sm' }]">
    <div
      v-for="(item, idx) in items"
      :key="idx"
      class="ds-kpi-row__item"
      :class="{
        'ds-kpi-row__item--clickable': item.clickable,
        'ds-kpi-row__item--full': item.mobileFull,
        'ds-kpi-row__item--summary-full': mobileSummary && idx === mobileTrailingFullIndex,
        'ds-kpi-row__item--secondary': mobileSecondaryFlags[idx],
        'ds-kpi-row__item--labeled-segments': hasSegmentLabels(item),
      }"
      :role="item.clickable ? 'button' : null"
      :tabindex="item.clickable && !loading && !item.loading ? 0 : null"
      @click="!loading && !item.loading && item.clickable && $emit('item-click', item, idx)"
      @keyup.enter="!loading && !item.loading && item.clickable && $emit('item-click', item, idx)"
    >
      <div class="ds-kpi-row__label-row">
        <div class="ds-kpi-row__label"><DsSkeleton v-if="(loading || item.loading) && !item.label" type="block" width="var(--extension-kpi-row-label-skeleton-width)" height="var(--extension-kpi-row-label-skeleton-height)" /><template v-else>{{ item.label }}</template></div>
        <span
          v-if="!loading && !item.loading && item.badge && item.badgePlacement !== 'value'"
          :class="badgeClass(item.badge.variant)"
          class="ds-kpi-row__badge"
        >
          <span v-if="badgeShowDot(item.badge.variant)" :class="badgeDotClass(item.badge.variant)" class="ds-kpi-row__badge-dot"></span>
          {{ item.badge.text }}
        </span>
      </div>
      <div class="ds-kpi-row__value-row">
        <div
          :class="[valueColorClass(item), { 'ds-kpi-row__value--text': item.valueKind === 'text', 'ds-kpi-row__value--mobile-neutral': item.mobileNeutral }]"
          :title="item.valueKind === 'text' && typeof item.value === 'string' ? item.value : null"
          class="ds-kpi-row__value"
        >
          <DsSkeleton v-if="(loading || item.loading) && !item.valueSegments" type="block" height="1lh" width="5ch" />
          <template v-else-if="item.valueSegments">
            <span
              v-for="(seg, i) in item.valueSegments"
              :key="i"
              :class="[seg.class, { 'ds-kpi-row__segment--labeled': seg.label, 'ds-kpi-row__segment--separator': seg.separator }]"
            ><span v-if="seg.label" class="ds-kpi-row__segment-label">{{ seg.label }}</span><DsSkeleton v-if="(loading || item.loading) && !seg.separator" type="block" height="1lh" width="3ch" /><template v-else>{{ seg.text }}</template></span>
          </template>
          <!-- animated에서도 prefix/suffix는 affix 스타일을 유지하고, 커스텀 formatter가 없으면
               비-animated 분기(formatValue)와 동일한 숫자 포맷을 쓴다 (표시 문자열 회귀 방지) -->
          <template v-else-if="item.animated && typeof item.value === 'number'">
            <span v-if="item.prefix" class="ds-kpi-row__affix">{{ item.prefix }}</span
            ><DsAnimatedNumber
              from-previous
              :value="item.value"
              :formatter="item.formatter || ((v) => formatNumericValue(item, v))"
            /><span v-if="item.suffix" class="ds-kpi-row__affix">{{ item.suffix }}</span>
          </template>
          <template v-else>
            <span v-if="item.prefix" class="ds-kpi-row__affix">{{ item.prefix }}</span>
            {{ formatValue(item) }}<span v-if="item.suffix" class="ds-kpi-row__affix">{{ item.suffix }}</span>
          </template>
        </div>
        <!-- badgePlacement:'value' — 배지가 값의 속성(예: 지표명 옆 변동률)일 때 라벨 행 대신 값 옆에 붙인다 -->
        <span
          v-if="!loading && !item.loading && item.badge && item.badgePlacement === 'value'"
          :class="badgeClass(item.badge.variant)"
          class="ds-kpi-row__badge"
        >
          <span v-if="badgeShowDot(item.badge.variant)" :class="badgeDotClass(item.badge.variant)" class="ds-kpi-row__badge-dot"></span>
          {{ item.badge.text }}
        </span>
      </div>
      <div v-if="item.desc" :class="descColorClass(item)" class="ds-kpi-row__desc"><DsSkeleton v-if="loading || item.loading" type="block" height="1lh" width="7ch" /><template v-else>{{ item.desc }}</template></div>
    </div>
  </div>
</template>

<script>
import DsAnimatedNumber from "./AnimatedNumber.vue";
import DsSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import { resolveSemanticColor } from './_kpiFormat'

const MOBILE_PRIMARY_ITEM_COUNT = 2

export default {
  mixins: [...componentMixins, domainColorMixin(vm => !vm.loading && vm.items.some(item => !item.loading && (
    item.semantic === 'price' && Number(item.value) !== 0 || item.badge?.variant?.startsWith('price-'))))],
  components: { DsAnimatedNumber, DsSkeleton },
  name: 'KpiRow',
  props: {
    loading: { type: Boolean, default: false },
    items: { type: Array, required: true },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['md', 'sm'].includes(v),
    },
    mobileSummary: { type: Boolean, default: true },
  },
  computed: {
    sizeClass() {
      return this.size === 'sm' ? 'ds-kpi-row--sm' : null
    },
    // 모바일에서 첫 항목을 전폭 헤드라인으로 올리는 경우(1+2 레이아웃). 홀수 개수가 반폭 그리드에서
    // 마지막 항목이 고아로 남는 문제를 피하고, 요약 지표를 강조한다.
    heroFirst() {
      return this.items.length > 0 && this.items[0].mobileFull === true
    },
    mobileSecondaryFlags() {
      const hasExplicitPriority = this.items.some(item => typeof item.mobileSecondary === 'boolean')
      const hasFullItem = this.items.some(item => item.mobileFull)
      return this.items.map((item, index) => {
        if (hasExplicitPriority) return item.mobileSecondary === true
        if (hasFullItem) return !item.mobileFull
        return index >= MOBILE_PRIMARY_ITEM_COUNT
      })
    },
    // 보조 정보와 명시적 전폭 항목을 제외한 주요 지표가 홀수면 마지막 지표로 행을 채운다.
    mobileTrailingFullIndex() {
      const indices = this.items.reduce((result, item, index) => {
        if (!this.mobileSecondaryFlags[index] && !item.mobileFull) result.push(index)
        return result
      }, [])
      return indices.length % 2 === 1 ? indices[indices.length - 1] : -1
    },
  },
  methods: {
    hasSegmentLabels(item) {
      return !!item.valueSegments?.some((segment) => segment.label)
    },
    formatValue(item) {
      if (item.formatter) return item.formatter(item.value)
      if (typeof item.value === 'string') return item.value
      return this.formatNumericValue(item, item.value)
    },
    // 숫자 부분만 포맷 (animated 분기의 tween 중간값에도 동일 규칙 적용)
    formatNumericValue(item, value) {
      const decimals = item.decimals != null ? item.decimals : 0
      if (item.semantic === 'price' && value < 0) {
        return '−' + this.$formatNumber(Math.abs(value), { decimals })
      }
      // showSign: 등락률처럼 방향이 의미인 값에 양수 부호를 명시 (opt-in)
      if (item.showSign && value > 0) {
        return '+' + this.$formatNumber(value, { decimals })
      }
      return this.$formatNumber(value, { decimals })
    },
    valueColorClass(item) {
      // 값 부호로 색을 정할 수 없는 경우(예: 항상 양수인 상승/하락 카운트) 명시적 색을 우선한다
      if (item.valueClass) return item.valueClass
      return resolveSemanticColor(item.value, item.semantic)
    },
    badgeClass(variant) {
      // success/danger는 상태 시맨틱(정상=초록/이상=빨강, DsBadge와 동일 계약).
      // 시세 방향 배지(변동률·상승/하락 카운트)는 price-up/price-down을 사용한다 — 혼용 금지
      const map = {
        warning: 'bg-warning-bg text-warning',
        success: 'bg-success-bg text-success',
        danger: 'bg-danger-bg text-danger',
        'price-up': 'bg-price-up-bg text-price-up',
        'price-down': 'bg-price-down-bg text-price-down',
        info: 'bg-info-bg text-info',
        neutral: 'bg-bg-secondary text-text-secondary',
      }
      return map[variant] || map.neutral
    },
    badgeShowDot(variant) {
      return ['warning', 'success', 'danger', 'price-up', 'price-down'].includes(variant)
    },
    badgeDotClass(variant) {
      const map = {
        warning: 'bg-warning',
        success: 'bg-success',
        danger: 'bg-danger',
        'price-up': 'bg-price-up',
        'price-down': 'bg-price-down',
      }
      return map[variant] || ''
    },
    descColorClass(item) {
      // desc는 value와 다른 의미(예: 금리 수준 value + 변동 bp desc)일 수 있어 명시 색을 우선한다
      if (item.descClass) return item.descClass
      if (item.semantic !== 'price') return 'text-text-secondary'
      if (item.value > 0) return 'text-price-up'
      if (item.value < 0) return 'text-price-down'
      return 'text-text-secondary'
    },
  },
}
</script>

<style scoped>
.ds-kpi-row {
  display: flex;
  padding: var(--extension-kpi-row-md-padding-y) var(--extension-kpi-row-md-padding-x);
  background: var(--card-bg);
  border-radius: var(--extension-kpi-row-radius);
}
.ds-kpi-row__item {
  flex: 1;
  padding: var(--extension-kpi-row-md-item-padding-y) var(--extension-kpi-row-md-item-padding-x);
  border-left: var(--_kjun-border-default-width) solid var(--border-primary);
  min-width: 0;
}
.ds-kpi-row__item:first-child {
  border-left: none;
}
.ds-kpi-row__item--clickable {
  cursor: pointer;
  border-radius: var(--extension-kpi-row-item-radius);
  transition: background-color var(--motion-control) var(--ease-out);
}
.ds-kpi-row__item--clickable:hover {
  background: var(--bg-hover);
}
.ds-kpi-row__item--clickable:focus-visible {
  outline: var(--_kjun-state-focus-width) solid var(--focus-ring);
  outline-offset: var(--_kjun-state-focus-inset-offset);
}
.ds-kpi-row__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--extension-kpi-row-md-label-gap);
  margin-bottom: var(--extension-kpi-row-md-label-margin);
}
.ds-kpi-row__label {
  color: var(--text-secondary);
  margin-bottom: 0; /* moved to label-row */
}
.ds-kpi-row__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--extension-kpi-row-badge-gap);
  padding: var(--extension-kpi-row-badge-padding-y) var(--extension-kpi-row-badge-padding-x);
  border-radius: var(--extension-kpi-row-badge-radius);
  white-space: normal;
  overflow-wrap: anywhere;
  max-width: 100%;
  min-width: 0;
  flex-shrink: 1;
}
.ds-kpi-row__badge-dot {
  display: inline-block;
  width: var(--extension-kpi-row-dot-size);
  height: var(--extension-kpi-row-dot-size);
  border-radius: 50%;
}
/* 값과 배지를 같은 행에 배치하고 긴 콘텐츠는 가용 폭 안에서 줄바꿈한다. */
.ds-kpi-row__value-row {
  display: flex;
  align-items: center;
  gap: var(--extension-kpi-row-value-gap);
  min-width: 0;
}
.ds-kpi-row__value {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
}
/* 텍스트형 값(예: 최대 증가/감소 지표명) — 큰 숫자 글자 크기는 긴 한글명이 모바일 반폭 칸에서 여러 줄로
   터지므로, 텍스트에 맞는 크기 + 한글 단어 보존(keep-all)으로 행 높이를 안정화한다. */
.ds-kpi-row__value--text {
  font-family: var(--kjun-font);
  font-variant-numeric: normal;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: keep-all;
}
/* Units inherit their value's colour, like KpiHero and Native. */
.ds-kpi-row__desc {
  margin-top: var(--extension-kpi-row-md-description-gap);
}
.ds-kpi-row__segment-label {
  display: none;
}

@media (width <= token(responsive.kpiRow)) {
  /* 페이지 KPI는 긴 한국어 라벨을 한눈에 비교할 수 있도록 스크롤 대신 조밀한 2열 그리드를 쓴다. */
  .ds-kpi-row:not(.ds-kpi-row--sm) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: var(--extension-kpi-row-mobile-padding-y) var(--extension-kpi-row-mobile-padding-x);
    overflow: hidden;
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__item {
    padding: var(--extension-kpi-row-mobile-item-padding-y) var(--extension-kpi-row-mobile-item-padding-x);
    border-left: none;
    border-top: none;
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__item:nth-child(even) {
    border-left: var(--_kjun-border-default-width) solid var(--border-primary);
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__item:nth-child(n + 3) {
    border-top: var(--_kjun-border-default-width) solid var(--border-primary);
  }
  /* 홀수 개수의 마지막 항목은 전폭으로 마감해 빈 반쪽 셀을 남기지 않는다. */
  .ds-kpi-row:not(.ds-kpi-row--sm):not(.ds-kpi-row--hero-first) .ds-kpi-row__item:last-child:nth-child(odd) {
    grid-column: 1 / -1;
    border-left: none;
  }
  /* hero-first는 전폭 헤드라인 아래에 나머지 항목을 2열로 배치한다. */
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__item--full {
    grid-column: 1 / -1;
  }
  .ds-kpi-row:not(.ds-kpi-row--sm).ds-kpi-row--hero-first .ds-kpi-row__item:nth-child(2) {
    border-left: none;
    border-top: var(--_kjun-border-default-width) solid var(--border-primary);
  }
  .ds-kpi-row:not(.ds-kpi-row--sm).ds-kpi-row--hero-first .ds-kpi-row__item:nth-child(3) {
    border-left: var(--_kjun-border-default-width) solid var(--border-primary);
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__label-row {
    gap: var(--extension-kpi-row-mobile-label-gap);
    margin-bottom: var(--extension-kpi-row-mobile-label-margin);
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__value {
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__value--text {
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__desc {
    margin-top: var(--extension-kpi-row-mobile-description-gap);
  }
  .ds-kpi-row:not(.ds-kpi-row--sm) .ds-kpi-row__badge {
    padding: var(--extension-kpi-row-badge-padding-y) var(--extension-kpi-row-badge-padding-x);
  }
}

@media (width <= token(responsive.kpiRow)) {
  /* 시장 요약은 주요 지수를 먼저 읽고, 보조 지표는 내용 너비에 따라 한 줄 또는 여러 줄로 흐르게 한다. */
  .ds-kpi-row.ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--extension-kpi-row-summary-gap-y) var(--extension-kpi-row-summary-gap-x);
    padding: var(--extension-kpi-row-summary-padding-y) var(--extension-kpi-row-summary-padding-x);
    overflow: visible;
  }
  .ds-kpi-row.ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__item:nth-child(n) {
    flex: 0 0 calc((100% - var(--extension-kpi-row-summary-gap-x)) / 2);
    padding: 0;
    border: 0;
  }
  .ds-kpi-row.ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__item--full:nth-child(n),
  .ds-kpi-row.ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__item--summary-full:nth-child(n) {
    flex-basis: 100%;
  }
  .ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__value {
  }
  .ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__value--text {
  }
  .ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__value--mobile-neutral {
    color: var(--text-primary);
  }
  .ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__desc {
  }
  .ds-kpi-row.ds-kpi-row--mobile-summary:not(.ds-kpi-row--sm) .ds-kpi-row__item--secondary:nth-child(n) {
    display: flex;
    flex: 0 1 auto;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--extension-kpi-row-segment-gap);
    max-width: 100%;
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary:last-child {
    margin-left: auto;
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__label-row {
    margin: 0;
    max-width: 100%;
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__value-row {
    flex-wrap: wrap;
    max-width: 100%;
    gap: var(--extension-kpi-row-summary-secondary-gap);
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__label,
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__value {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__value {
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__desc {
    margin: 0;
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary.ds-kpi-row__item--labeled-segments .ds-kpi-row__label-row,
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__segment--separator {
    display: none;
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__segment-label {
    display: inline;
    margin-right: var(--_kjun-geometry-dimension-value4);
    color: var(--text-secondary);
  }
  .ds-kpi-row--mobile-summary .ds-kpi-row__item--secondary .ds-kpi-row__segment--labeled ~ .ds-kpi-row__segment--labeled::before {
    content: '·';
    margin: 0 var(--extension-kpi-row-separator-gap);
    color: var(--text-tertiary);
  }
}

/* size=sm — 모달, 컴팩트 카드 내부용 */
.ds-kpi-row--sm { padding: var(--extension-kpi-row-sm-padding-y) var(--extension-kpi-row-sm-padding-x); }
.ds-kpi-row--sm .ds-kpi-row__item { padding: var(--extension-kpi-row-sm-item-padding-y) var(--extension-kpi-row-sm-item-padding-x); }
.ds-kpi-row--sm .ds-kpi-row__label-row { margin-bottom: var(--extension-kpi-row-sm-label-margin); gap: var(--extension-kpi-row-sm-label-gap); }
.ds-kpi-row--sm .ds-kpi-row__label { }
.ds-kpi-row--sm .ds-kpi-row__value { }
.ds-kpi-row--sm .ds-kpi-row__value--text { }
.ds-kpi-row--sm .ds-kpi-row__desc { margin-top: var(--extension-kpi-row-sm-description-gap); }
.ds-kpi-row--sm .ds-kpi-row__badge { padding: var(--extension-kpi-row-badge-padding-y) var(--extension-kpi-row-badge-padding-x); }

@media (width <= token(responsive.kpiRow)) {
  .ds-kpi-row--sm {
    flex-wrap: wrap;
  }
  .ds-kpi-row--sm .ds-kpi-row__item {
    flex: 1 1 50%;
    padding: var(--extension-kpi-row-small-mobile-item-padding-y) var(--extension-kpi-row-small-mobile-item-padding-x);
    border-left: none;
    border-top: var(--_kjun-border-default-width) solid var(--border-primary);
  }
  .ds-kpi-row--sm:not(.ds-kpi-row--hero-first) .ds-kpi-row__item:first-child,
  .ds-kpi-row--sm:not(.ds-kpi-row--hero-first) .ds-kpi-row__item:nth-child(2) {
    border-top: none;
  }
  .ds-kpi-row--sm .ds-kpi-row__item--full {
    flex-basis: 100%;
  }
  .ds-kpi-row--sm.ds-kpi-row--hero-first .ds-kpi-row__item:first-child {
    border-top: none;
  }
  .ds-kpi-row--sm .ds-kpi-row__value { }
}
</style>
