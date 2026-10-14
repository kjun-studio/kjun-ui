<template>
  <!-- Like React and Native: a focusable tooltip target, so keyboard and touch reach the fetch time. -->
  <KjunTooltip v-if="stale" :content="title">
    <span tabindex="0" class="kjun-freshness"><KjunBadge variant="warning" size="xs">{{ label }}</KjunBadge></span>
  </KjunTooltip>
</template>

<script>
import KjunBadge from "../primitives/Badge.vue";
import KjunTooltip from "./Tooltip.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { KjunBadge, KjunTooltip },
  name: 'KjunFreshness',
  props: {
    stale: { type: Boolean, default: false },
    source: { type: String, default: null },
    fetchedAt: { type: String, default: null },
  },
  computed: {
    label() {
      return this.source === 'close' ? '종가' : '지연'
    },
    title() {
      const base = this.source === 'close'
        ? '실시간 시세 없음 · 최근 종가 표시'
        : '실시간 시세 지연'
      // fetchedAt이 있으면 상대시각을 덧붙여 "언제 적 값인지"를 툴팁에서 바로 확인 가능하게 한다
      if (!this.fetchedAt) return base
      return `${base} · ${this.kjunFormatRelativeTime(this.fetchedAt)}`
    },
  },
}
</script>
