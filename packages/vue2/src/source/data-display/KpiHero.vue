<template>
  <div class="kjun-kpi-hero" :class="sizeClass" :aria-busy="loading ? 'true' : 'false'">
    <div class="kjun-kpi-hero__layout">
      <div class="kjun-kpi-hero__main">
        <div class="kjun-kpi-hero__label">{{ label }}</div>
        <div class="kjun-kpi-hero__value kjun-type-display-sm"
          ><KjunSkeleton v-if="loading" type="block" height="1lh" width="7ch" /><template v-else><span v-if="prefix" class="kjun-kpi-hero__affix">{{ prefix }}</span
          ><KjunAnimatedNumber class="kjun-kpi-hero__num" :value="value" :decimals="decimals" :animated="animated" :formatter="formatter"
          /><span v-if="suffix" class="kjun-kpi-hero__affix">{{ suffix }}</span
        ></template></div>
        <div v-if="showDelta" class="kjun-kpi-hero__delta-line">
          <KjunSkeleton v-if="loading" type="block" height="1lh" width="var(--_kjun-extension-kpi-hero-delta-skeleton-width)" class="kjun-kpi-hero__delta-abs" />
          <template v-else>
          <span v-if="deltaAbsolute !== null" :class="absoluteColorClass" class="kjun-kpi-hero__delta-abs">
            <template v-if="deltaFormatter">{{ deltaAbsoluteFormatted }}</template><template v-else>{{ deltaSign(deltaAbsolute) }}<span v-if="prefix" class="kjun-number-affix" data-side="prefix">{{ prefix }}</span>{{ deltaAbsoluteFormatted }}</template>
          </span>
          <span v-if="deltaPercent !== null" :class="percentColorClass" class="kjun-kpi-hero__delta-pct">
            <template v-if="deltaFormatter">{{ deltaPercentFormatted }}</template><template v-else>{{ deltaSign(deltaPercent) }}{{ deltaPercentFormatted }}<span class="kjun-number-affix" data-side="suffix">%</span></template>
          </span>
          <span v-if="deltaDescription" class="kjun-kpi-hero__delta-desc">{{ deltaDescription }}</span>
          </template>
        </div>
      </div>
      <!-- 우측 보조 영역(추이 스파크라인 등) — 슬롯이 있을 때만 렌더 (Vue2 슬롯 즉시평가 대비 널가드) -->
      <div v-if="$slots.aside" class="kjun-kpi-hero__aside">
        <slot name="aside" />
      </div>
    </div>
    <div v-if="secondary && secondary.length" class="kjun-kpi-hero__secondary">
      <div v-for="(item, idx) in secondary" :key="idx" class="kjun-kpi-hero__sec-item">
        <div class="kjun-kpi-hero__sec-label">{{ item.label }}</div>
        <div :class="secondaryValueClass(item)" class="kjun-kpi-hero__sec-value"
          ><KjunSkeleton v-if="loading" type="block" height="1lh" width="5ch" /><template v-else><span v-if="item.prefix" class="kjun-kpi-hero__sec-affix">{{ item.prefix }}</span
          ><span class="kjun-kpi-hero__sec-num">{{ formatSecondary(item) }}</span
          ><span v-if="item.suffix" class="kjun-kpi-hero__sec-affix">{{ item.suffix }}</span
        ></template></div>
        <div v-if="item.desc" :class="item.descClass || 'kj-text-text-tertiary'" class="kjun-kpi-hero__sec-desc"><KjunSkeleton v-if="loading" type="block" width="7ch" height="1lh" /><template v-else>{{ item.desc }}</template></div>
      </div>
    </div>
  </div>
</template>

<script>
import KjunAnimatedNumber from "./AnimatedNumber.vue";
import KjunSkeleton from "./Skeleton.vue";
import { componentMixins } from "../../component-mixins.js";
import { domainColorMixin } from "../../domain-colors.js";
import { resolveSemanticColor, resolveSemanticColorForLight } from './_kpiFormat'

export default {
  mixins: [...componentMixins, domainColorMixin(vm => !vm.loading && (Number(vm.deltaAbsolute) !== 0 || Number(vm.deltaPercent) !== 0 ||
    vm.secondary.some(item => item.semantic === 'price' && Number(item.value) !== 0)))],
  components: { KjunAnimatedNumber, KjunSkeleton },
  name: 'KjunKpiHero',
  props: {
    loading: { type: Boolean, default: false },
    formatter: { type: Function, default: null },
    deltaFormatter: { type: Function, default: null },
    label: { type: String, required: true },
    value: { type: [Number, String], required: true },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    decimals: { type: Number, default: 0 },
    deltaAbsolute: { type: Number, default: null },
    deltaPercent: { type: Number, default: null },
    deltaDescription: { type: String, default: '' },
    secondary: { type: Array, default: () => [] },
    animated: { type: Boolean, default: true },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['md', 'sm'].includes(v),
    },
  },
  computed: {
    sizeClass() {
      return this.size === 'sm' ? 'kjun-kpi-hero--sm' : null
    },
    hasDelta() {
      // deltaDescription만 단독으로 넘기는 경우(예: 채권 스프레드 해석)도 노출해야 하므로 포함
      return this.deltaAbsolute !== null || this.deltaPercent !== null || !!this.deltaDescription
    },
    showDelta() {
      // 증감 지표가 없는 KPI에는 로딩 때문에 별도의 행을 추가하지 않는다.
      const supplied = this.$options.propsData || {}
      return this.hasDelta || (this.loading && ['deltaAbsolute', 'deltaPercent', 'deltaDescription'].some(key => Object.prototype.hasOwnProperty.call(supplied, key)))
    },
    deltaAbsoluteFormatted() {
      if (this.deltaAbsolute === null) return ''
      if (this.deltaFormatter) return this.deltaFormatter(this.deltaAbsolute, 'absolute')
      const abs = Math.abs(this.deltaAbsolute)
      return this.$formatNumber(abs, { decimals: this.decimals })
    },
    deltaPercentFormatted() {
      if (this.deltaPercent === null) return ''
      if (this.deltaFormatter) return this.deltaFormatter(this.deltaPercent, 'percent')
      return this.$formatNumber(Math.abs(this.deltaPercent), { decimals: 1 })
    },
    absoluteColorClass() {
      return resolveSemanticColorForLight(this.deltaAbsolute)
    },
    percentColorClass() {
      return resolveSemanticColorForLight(this.deltaPercent)
    },
  },
  methods: {
    deltaSign(value) { return value > 0 ? '+' : value < 0 ? '−' : '' },
    formatSecondary(item) {
      if (item.formatter) return item.formatter(item.value)
      if (typeof item.value === 'string') return item.value
      const decimals = item.decimals != null ? item.decimals : 0
      const abs = Math.abs(item.value)
      if (item.semantic === 'price' && item.value < 0) {
        return '−' + this.$formatNumber(abs, { decimals })
      }
      if (item.showSign && item.value > 0) {
        return '+' + this.$formatNumber(abs, { decimals })
      }
      return this.$formatNumber(item.value, { decimals })
    },
    secondaryValueClass(item) {
      return resolveSemanticColor(item.value, item.semantic)
    },
  },
}
</script>

<style scoped>
.kjun-kpi-hero {
  padding: var(--_kjun-extension-kpi-hero-md-padding-y) var(--_kjun-extension-kpi-hero-md-padding-x);
  background: var(--_kjun-card-bg);
  border-radius: var(--_kjun-extension-kpi-hero-radius);
}
.kjun-kpi-hero__layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--_kjun-extension-kpi-hero-layout-gap);
}
.kjun-kpi-hero__main { min-width: 0; }
.kjun-kpi-hero__aside { flex-shrink: 0; }
.kjun-kpi-hero__label { color: var(--_kjun-text-secondary); margin-bottom: var(--_kjun-extension-kpi-hero-md-label-gap); }
.kjun-kpi-hero__value {
  color: var(--_kjun-text-primary);
  font-family: var(--_kjun-font-numeric);
  font-variant-numeric: tabular-nums;
}
.kjun-kpi-hero__affix { color: var(--_kjun-text-primary); }
/* prefix는 전 소비처가 통화 기호(₩/$)라 숫자에 붙여 읽히는 게 맞다. 4px은 큰 폰트에서
   "$ 8,798.69"처럼 기호가 떨어져 보였다. 보조 지표(sec-affix)와 같은 2px로 맞춘다. */
.kjun-kpi-hero__affix:first-child { margin-right: var(--_kjun-extension-kpi-hero-prefix-gap); }
.kjun-kpi-hero__affix:last-child { margin-left: var(--_kjun-extension-kpi-hero-suffix-gap); }
.kjun-kpi-hero__delta-line {
  margin-top: var(--_kjun-extension-kpi-hero-md-delta-margin);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--_kjun-extension-kpi-hero-md-delta-gap);
  font-family: var(--_kjun-font-numeric);
  font-variant-numeric: tabular-nums;
}
.kjun-kpi-hero__delta-abs { }
.kjun-kpi-hero__delta-pct { opacity: 0.9; }
.kjun-kpi-hero__delta-desc { color: var(--_kjun-text-tertiary); }
.kjun-kpi-hero__secondary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--_kjun-extension-kpi-hero-md-secondary-gap);
  margin-top: var(--_kjun-extension-kpi-hero-md-secondary-margin);
  padding-top: var(--_kjun-extension-kpi-hero-md-secondary-padding);
  border-top: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
}
.kjun-kpi-hero__sec-label {
  color: var(--_kjun-text-tertiary);
  text-transform: uppercase;
  margin-bottom: var(--_kjun-extension-kpi-hero-md-secondary-label-gap);
}
.kjun-kpi-hero__sec-value {
  font-family: var(--_kjun-font-numeric);
  font-variant-numeric: tabular-nums;
}
/* Like the delta percent and Native, a unit takes its value's colour at the caption weight. */
.kjun-kpi-hero__sec-affix { font-weight: var(--_kjun-type-caption-weight); }
.kjun-kpi-hero__sec-affix:first-child { margin-right: var(--_kjun-extension-kpi-hero-secondary-affix-gap); }
.kjun-kpi-hero__sec-affix:last-child { margin-left: var(--_kjun-extension-kpi-hero-secondary-affix-gap); }
.kjun-kpi-hero__sec-desc { margin-top: var(--_kjun-extension-kpi-hero-md-description-gap); }

@media (width <= token(responsive.kpiHero)) {
  /* 페이지 hero는 핵심 금액의 위계는 유지하고, 주변 여백과 보조 지표 영역만 압축한다. */
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) {
    padding: var(--_kjun-extension-kpi-hero-mobile-padding-y) var(--_kjun-extension-kpi-hero-mobile-padding-x);
  }
  /* 좁은 화면에서 aside가 핵심 금액의 폭을 잠식하지 않도록 숨긴다. */
  .kjun-kpi-hero__aside {
    display: none;
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__label {
    margin-bottom: var(--_kjun-extension-kpi-hero-mobile-label-gap);
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__value {
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__delta-line {
    flex-wrap: wrap;
    gap: var(--_kjun-extension-kpi-hero-mobile-delta-gap);
    margin-top: var(--_kjun-extension-kpi-hero-mobile-delta-margin);
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__delta-abs {
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__secondary {
    flex-wrap: nowrap;
    gap: var(--_kjun-extension-kpi-hero-mobile-secondary-gap);
    margin-top: var(--_kjun-extension-kpi-hero-mobile-secondary-margin);
    padding-top: var(--_kjun-extension-kpi-hero-mobile-secondary-padding);
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__sec-item {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 var(--_kjun-extension-kpi-hero-item-padding);
    border-left: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__sec-item:first-child {
    padding-left: 0;
    border-left: none;
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__sec-item:last-child {
    padding-right: 0;
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__sec-label {
    margin-bottom: var(--_kjun-extension-kpi-hero-mobile-secondary-label-gap);
    overflow: visible;
    text-transform: none;
    white-space: normal;
  }
  .kjun-kpi-hero:not(.kjun-kpi-hero--sm) .kjun-kpi-hero__sec-value {
  }
}

/* size=sm — 모달, 컴팩트 카드 내부용 */
.kjun-kpi-hero--sm { padding: var(--_kjun-extension-kpi-hero-sm-padding-y) var(--_kjun-extension-kpi-hero-sm-padding-x); }
.kjun-kpi-hero--sm .kjun-kpi-hero__label { margin-bottom: var(--_kjun-extension-kpi-hero-sm-label-gap); }
.kjun-kpi-hero--sm .kjun-kpi-hero__value { }
.kjun-kpi-hero--sm .kjun-kpi-hero__delta-line { margin-top: var(--_kjun-extension-kpi-hero-sm-delta-margin); gap: var(--_kjun-extension-kpi-hero-sm-delta-gap); }
.kjun-kpi-hero--sm .kjun-kpi-hero__delta-abs { }
.kjun-kpi-hero--sm .kjun-kpi-hero__delta-pct { }
.kjun-kpi-hero--sm .kjun-kpi-hero__delta-desc { }
.kjun-kpi-hero--sm .kjun-kpi-hero__secondary {
  gap: var(--_kjun-extension-kpi-hero-sm-secondary-gap);
  margin-top: var(--_kjun-extension-kpi-hero-sm-secondary-margin);
  padding-top: var(--_kjun-extension-kpi-hero-sm-secondary-padding);
}
.kjun-kpi-hero--sm .kjun-kpi-hero__sec-label { margin-bottom: var(--_kjun-extension-kpi-hero-sm-secondary-label-gap); }
.kjun-kpi-hero--sm .kjun-kpi-hero__sec-value { }
.kjun-kpi-hero--sm .kjun-kpi-hero__sec-desc { margin-top: var(--_kjun-extension-kpi-hero-sm-description-gap); }

@media (width <= token(responsive.kpiHero)) {
  .kjun-kpi-hero--sm .kjun-kpi-hero__secondary { gap: var(--_kjun-extension-kpi-hero-small-mobile-gap); }
  .kjun-kpi-hero--sm .kjun-kpi-hero__value { }
}
</style>
