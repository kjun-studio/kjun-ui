<template>
  <div :class="skeletonClasses" :style="wrapperStyle" aria-hidden="true">
    <!-- Text type -->
    <template v-if="type === 'text'">
      <div
        v-for="i in rows"
        :key="i"
        class="ds-skeleton-line"
        :style="getLineStyle(i)"
      ></div>
    </template>

    <!-- Avatar type -->
    <template v-else-if="type === 'avatar'">
      <div class="ds-skeleton-avatar" :style="avatarStyle"></div>
    </template>

    <!-- Card type -->
    <template v-else-if="type === 'card'">
      <div class="ds-skeleton-card">
        <div class="ds-skeleton-card-header">
          <div class="ds-skeleton-avatar ds-skeleton-avatar-sm"></div>
          <div class="ds-skeleton-card-header-text">
            <div class="ds-skeleton-line" style="width: 60%"></div>
            <div class="ds-skeleton-line ds-skeleton-line-sm" style="width: 40%"></div>
          </div>
        </div>
        <div class="ds-skeleton-card-body">
          <div class="ds-skeleton-line" style="width: 100%"></div>
          <div class="ds-skeleton-line" style="width: 80%"></div>
          <div class="ds-skeleton-line" style="width: 60%"></div>
        </div>
      </div>
    </template>

    <!-- Table type -->
    <template v-else-if="type === 'table'">
      <div class="ds-skeleton-table">
        <div class="ds-skeleton-table-header">
          <div
            v-for="col in columns"
            :key="`header-${col}`"
            class="ds-skeleton-table-cell"
          >
            <div class="ds-skeleton-line" style="width: 70%"></div>
          </div>
        </div>
        <div
          v-for="row in rows"
          :key="`row-${row}`"
          class="ds-skeleton-table-row"
        >
          <div
            v-for="col in columns"
            :key="`cell-${row}-${col}`"
            class="ds-skeleton-table-cell"
          >
            <div class="ds-skeleton-line" :style="{ width: getCellWidth(row, col) }"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Chart type -->
    <template v-else-if="type === 'chart'">
      <div class="ds-skeleton-chart" :style="chartStyle">
        <div class="ds-skeleton-chart-bars">
          <div
            v-for="i in 7"
            :key="i"
            class="ds-skeleton-chart-bar"
            :style="{ height: getBarHeight(i) }"
          ></div>
        </div>
        <div class="ds-skeleton-chart-axis"></div>
      </div>
    </template>

    <!-- Stat Card type -->
    <template v-else-if="type === 'stat'">
      <div class="ds-skeleton-stat">
        <div class="ds-skeleton-stat-content">
          <div class="ds-skeleton-line ds-skeleton-line-sm" style="width: 40%"></div>
          <div class="ds-skeleton-line ds-skeleton-line-lg" style="width: 60%"></div>
          <div class="ds-skeleton-line ds-skeleton-line-sm" style="width: 30%"></div>
        </div>
        <div class="ds-skeleton-stat-chart">
          <div class="ds-skeleton-sparkline"></div>
        </div>
      </div>
    </template>

    <!-- Custom/Block type -->
    <template v-else>
      <div class="ds-skeleton-block" :style="blockStyle"></div>
    </template>
  </div>
</template>

<script>
import { tokens } from "@kjun/tokens";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  name: 'DsSkeleton',
  props: {
    // 스켈레톤 타입
    type: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'avatar', 'card', 'table', 'chart', 'stat', 'block'].includes(value)
    },
    // 행 수 (text, table용)
    rows: {
      type: Number,
      default: 3
    },
    // 열 수 (table용)
    columns: {
      type: Number,
      default: 4
    },
    // 커스텀 높이
    height: {
      type: String,
      default: null
    },
    // 커스텀 너비
    width: {
      type: String,
      default: null
    },
    // 애니메이션 활성화
    animated: {
      type: Boolean,
      default: true
    },
    // 둥근 모서리 (avatar용)
    rounded: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    // 래퍼 폭은 width prop으로만 좁힌다. 아래 .ds-skeleton { width: 100% }는 scoped 속성이
    // 붙어 Tailwind의 크기 유틸리티 같은 유틸리티 클래스를 specificity로 눌러버리므로, 호출부가
    // 클래스로 고정폭을 주면 shrink-to-fit 부모(예: flex-shrink-0 가격 셀) 안에서
    // "부모 폭=자식 내용, 자식 폭=부모의 100%" 순환이 생겨 0px로 붕괴한다.
    wrapperStyle() {
      return this.width ? { width: this.width } : {}
    },
    skeletonClasses() {
      return [
        'ds-skeleton',
        this.animated ? 'ds-skeleton-animated' : ''
      ].filter(Boolean).join(' ')
    },
    avatarStyle() {
      return {
        width: this.width || tokens.extensions.skeleton.avatarSize + 'px',
        height: this.height || tokens.extensions.skeleton.avatarSize + 'px',
        borderRadius: this.rounded ? '50%' : 'var(--extension-skeleton-block-radius)'
      }
    },
    chartStyle() {
      return {
        height: this.height || tokens.extensions.skeleton.chartHeight + 'px'
      }
    },
    blockStyle() {
      return {
        width: this.width || '100%',
        height: this.height || tokens.extensions.skeleton.blockHeight + 'px'
      }
    }
  },
  methods: {
    getLineStyle(index) {
      // 마지막 줄은 짧게
      const widths = ['100%', '90%', '80%', '70%', '60%']
      const width = index === this.rows ? '60%' : widths[index % widths.length]
      return { width }
    },
    getCellWidth(row, column) {
      const widths = ['45%', '55%', '65%', '75%', '85%']
      return widths[(row + column) % widths.length]
    },
    getBarHeight(index) {
      const heights = ['40%', '65%', '50%', '80%', '60%', '90%', '75%']
      return heights[(index - 1) % heights.length]
    }
  }
}
</script>

<style scoped>
.ds-skeleton {
  width: 100%;
  /* 방어선: block 타입 내부 요소는 height prop 미지정 시 인라인 100px로 렌더된다.
     호출부가 클래스(크기 유틸리티 등)로만 래퍼 높이를 제한한 경우 내부가 행 밖으로 흘러넘쳐
     이웃 행을 덮는 사고가 재발했으므로, 래퍼 밖으로는 절대 넘치지 않게 클립한다. */
  overflow: hidden;
}

/* Base line */
.ds-skeleton-line {
  height: var(--extension-skeleton-line-heights-md);
  background: var(--skeleton);
  border-radius: var(--extension-skeleton-line-radius);
  margin-bottom: var(--extension-skeleton-gap);
}

.ds-skeleton-line:last-child {
  margin-bottom: 0;
}

.ds-skeleton-line-sm {
  height: var(--extension-skeleton-line-heights-sm);
}

.ds-skeleton-line-lg {
  height: var(--extension-skeleton-line-heights-lg);
}

/* Avatar */
.ds-skeleton-avatar {
  background: var(--skeleton);
  flex-shrink: 0;
}

.ds-skeleton-avatar-sm {
  width: var(--extension-skeleton-card-avatar-size);
  height: var(--extension-skeleton-card-avatar-size);
  border-radius: 50%;
}

/* Card */
.ds-skeleton-card {
  padding: var(--extension-skeleton-padding);
  border: var(--_kjun-border-default-width) solid var(--border-primary);
  border-radius: var(--extension-skeleton-radius);
  background: var(--bg-primary);
}

.ds-skeleton-card-header {
  display: flex;
  align-items: center;
  gap: var(--extension-skeleton-gap);
  margin-bottom: var(--extension-skeleton-form-gap);
}

.ds-skeleton-card-header-text {
  flex: 1;
}

.ds-skeleton-card-header-text .ds-skeleton-line {
  margin-bottom: var(--extension-skeleton-field-gap);
}

.ds-skeleton-card-body .ds-skeleton-line {
  margin-bottom: var(--_kjun-geometry-dimension-value10);
}

/* Table */
.ds-skeleton-table {
  border: var(--_kjun-border-default-width) solid var(--border-primary);
  border-radius: var(--extension-skeleton-block-radius);
  overflow: hidden;
}

.ds-skeleton-table-header {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: var(--_kjun-border-default-width) solid var(--border-primary);
}

.ds-skeleton-table-row {
  display: flex;
  border-bottom: var(--_kjun-border-default-width) solid var(--border-primary);
}

.ds-skeleton-table-row:last-child {
  border-bottom: none;
}

.ds-skeleton-table-cell {
  flex: 1;
  padding: var(--_kjun-geometry-dimension-value12) var(--_kjun-geometry-dimension-value16);
}

.ds-skeleton-table-cell .ds-skeleton-line {
  margin-bottom: 0;
  height: var(--extension-skeleton-table-line-height);
}

/* Chart */
.ds-skeleton-chart {
  display: flex;
  flex-direction: column;
  padding: var(--extension-skeleton-padding);
  border: var(--_kjun-border-default-width) solid var(--border-primary);
  border-radius: var(--extension-skeleton-radius);
  background: var(--bg-primary);
}

.ds-skeleton-chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: var(--extension-skeleton-gap);
  /* Bars stand on the axis line, like ChartSkeleton. */
}

.ds-skeleton-chart-bar {
  flex: 1;
  max-width: var(--extension-skeleton-chart-bar-max-width);
  background: var(--skeleton);
  border-radius: var(--extension-skeleton-line-radius) var(--_kjun-geometry-radius-radius4) 0 0;
}

.ds-skeleton-chart-axis {
  height: var(--extension-skeleton-chart-axis-height);
  background: var(--border-primary);
}

/* Stat Card */
.ds-skeleton-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--extension-skeleton-padding);
  border: var(--_kjun-border-default-width) solid var(--border-primary);
  border-radius: var(--extension-skeleton-radius);
  background: var(--bg-primary);
}

.ds-skeleton-stat-content {
  flex: 1;
}

.ds-skeleton-stat-content .ds-skeleton-line {
  margin-bottom: var(--extension-skeleton-field-gap);
}

.ds-skeleton-stat-chart {
  width: var(--extension-skeleton-stat-width);
  height: var(--extension-skeleton-stat-height);
}

.ds-skeleton-sparkline {
  width: 100%;
  height: 100%;
  background: var(--skeleton);
  border-radius: var(--extension-skeleton-line-radius);
}

/* Block */
.ds-skeleton-block {
  background: var(--skeleton);
  border-radius: var(--extension-skeleton-block-radius);
}

/* Animation */
.ds-skeleton-animated .ds-skeleton-line,
.ds-skeleton-animated .ds-skeleton-avatar,
.ds-skeleton-animated .ds-skeleton-chart-bar,
.ds-skeleton-animated .ds-skeleton-sparkline,
.ds-skeleton-animated .ds-skeleton-block {
  background: linear-gradient(
    90deg,
    var(--skeleton) 25%,
    var(--skeleton-shine) 50%,
    var(--skeleton) 75%
  );
  background-size: 200% 100%;
  animation: ds-skeleton-shimmer var(--motion-shimmer) ease-in-out infinite;
}

@keyframes ds-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ds-skeleton-animated * { animation: none !important; }
}
</style>
