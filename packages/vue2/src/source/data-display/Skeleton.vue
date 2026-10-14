<template>
  <div :class="skeletonClasses" :style="wrapperStyle" aria-hidden="true">
    <!-- Text type -->
    <template v-if="type === 'text'">
      <div
        v-for="i in rows"
        :key="i"
        class="kjun-skeleton-line"
        :style="getLineStyle(i)"
      ></div>
    </template>

    <!-- Avatar type -->
    <template v-else-if="type === 'avatar'">
      <div class="kjun-skeleton-avatar" :style="avatarStyle"></div>
    </template>

    <!-- Card type -->
    <template v-else-if="type === 'card'">
      <div class="kjun-skeleton-card">
        <div class="kjun-skeleton-card-header">
          <div class="kjun-skeleton-avatar kjun-skeleton-avatar-sm"></div>
          <div class="kjun-skeleton-card-header-text">
            <div class="kjun-skeleton-line" style="width: 60%"></div>
            <div class="kjun-skeleton-line kjun-skeleton-line-sm" style="width: 40%"></div>
          </div>
        </div>
        <div class="kjun-skeleton-card-body">
          <div class="kjun-skeleton-line" style="width: 100%"></div>
          <div class="kjun-skeleton-line" style="width: 80%"></div>
          <div class="kjun-skeleton-line" style="width: 60%"></div>
        </div>
      </div>
    </template>

    <!-- Table type -->
    <template v-else-if="type === 'table'">
      <div class="kjun-skeleton-table">
        <div class="kjun-skeleton-table-header">
          <div
            v-for="col in columns"
            :key="`header-${col}`"
            class="kjun-skeleton-table-cell"
          >
            <div class="kjun-skeleton-line" style="width: 70%"></div>
          </div>
        </div>
        <div
          v-for="row in rows"
          :key="`row-${row}`"
          class="kjun-skeleton-table-row"
        >
          <div
            v-for="col in columns"
            :key="`cell-${row}-${col}`"
            class="kjun-skeleton-table-cell"
          >
            <div class="kjun-skeleton-line" :style="{ width: getCellWidth(row, col) }"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Chart type -->
    <template v-else-if="type === 'chart'">
      <div class="kjun-skeleton-chart" :style="chartStyle">
        <div class="kjun-skeleton-chart-bars">
          <div
            v-for="i in 7"
            :key="i"
            class="kjun-skeleton-chart-bar"
            :style="{ height: getBarHeight(i) }"
          ></div>
        </div>
        <div class="kjun-skeleton-chart-axis"></div>
      </div>
    </template>

    <!-- Stat Card type -->
    <template v-else-if="type === 'stat'">
      <div class="kjun-skeleton-stat">
        <div class="kjun-skeleton-stat-content">
          <div class="kjun-skeleton-line kjun-skeleton-line-sm" style="width: 40%"></div>
          <div class="kjun-skeleton-line kjun-skeleton-line-lg" style="width: 60%"></div>
          <div class="kjun-skeleton-line kjun-skeleton-line-sm" style="width: 30%"></div>
        </div>
        <div class="kjun-skeleton-stat-chart">
          <div class="kjun-skeleton-sparkline"></div>
        </div>
      </div>
    </template>

    <!-- Custom/Block type -->
    <template v-else>
      <div class="kjun-skeleton-block" :style="blockStyle"></div>
    </template>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
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
    // 래퍼 폭은 width prop으로만 좁힌다. 아래 .kjun-skeleton { width: 100% }는 scoped 속성이
    // 붙어 Tailwind의 크기 유틸리티 같은 유틸리티 클래스를 specificity로 눌러버리므로, 호출부가
    // 클래스로 고정폭을 주면 shrink-to-fit 부모(예: flex-shrink-0 가격 셀) 안에서
    // "부모 폭=자식 내용, 자식 폭=부모의 100%" 순환이 생겨 0px로 붕괴한다.
    wrapperStyle() {
      return this.width ? { width: this.width } : {}
    },
    skeletonClasses() {
      return [
        'kjun-skeleton',
        this.animated ? 'kjun-skeleton-animated' : ''
      ].filter(Boolean).join(' ')
    },
    avatarStyle() {
      return {
        width: this.width || tokens.extensions.skeleton.avatarSize + 'px',
        height: this.height || tokens.extensions.skeleton.avatarSize + 'px',
        borderRadius: this.rounded ? '50%' : 'var(--_kjun-extension-skeleton-block-radius)'
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
.kjun-skeleton {
  width: 100%;
  /* 방어선: block 타입 내부 요소는 height prop 미지정 시 인라인 100px로 렌더된다.
     호출부가 클래스(크기 유틸리티 등)로만 래퍼 높이를 제한한 경우 내부가 행 밖으로 흘러넘쳐
     이웃 행을 덮는 사고가 재발했으므로, 래퍼 밖으로는 절대 넘치지 않게 클립한다. */
  overflow: hidden;
}

/* Base line */
.kjun-skeleton-line {
  height: var(--_kjun-extension-skeleton-line-heights-md);
  background: var(--_kjun-skeleton);
  border-radius: var(--_kjun-extension-skeleton-line-radius);
  margin-bottom: var(--_kjun-extension-skeleton-gap);
}

.kjun-skeleton-line:last-child {
  margin-bottom: 0;
}

.kjun-skeleton-line-sm {
  height: var(--_kjun-extension-skeleton-line-heights-sm);
}

.kjun-skeleton-line-lg {
  height: var(--_kjun-extension-skeleton-line-heights-lg);
}

/* Avatar */
.kjun-skeleton-avatar {
  background: var(--_kjun-skeleton);
  flex-shrink: 0;
}

.kjun-skeleton-avatar-sm {
  width: var(--_kjun-extension-skeleton-card-avatar-size);
  height: var(--_kjun-extension-skeleton-card-avatar-size);
  border-radius: 50%;
}

/* Card */
.kjun-skeleton-card {
  padding: var(--_kjun-extension-skeleton-padding);
  border: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
  border-radius: var(--_kjun-extension-skeleton-radius);
  background: var(--_kjun-bg-primary);
}

.kjun-skeleton-card-header {
  display: flex;
  align-items: center;
  gap: var(--_kjun-extension-skeleton-gap);
  margin-bottom: var(--_kjun-extension-skeleton-form-gap);
}

.kjun-skeleton-card-header-text {
  flex: 1;
}

.kjun-skeleton-card-header-text .kjun-skeleton-line {
  margin-bottom: var(--_kjun-extension-skeleton-field-gap);
}

.kjun-skeleton-card-body .kjun-skeleton-line {
  margin-bottom: var(--_kjun-geometry-dimension-value10);
}

/* Table */
.kjun-skeleton-table {
  border: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
  border-radius: var(--_kjun-extension-skeleton-block-radius);
  overflow: hidden;
}

.kjun-skeleton-table-header {
  display: flex;
  background: var(--_kjun-bg-secondary);
  border-bottom: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
}

.kjun-skeleton-table-row {
  display: flex;
  border-bottom: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
}

.kjun-skeleton-table-row:last-child {
  border-bottom: none;
}

.kjun-skeleton-table-cell {
  flex: 1;
  padding: var(--_kjun-geometry-dimension-value12) var(--_kjun-geometry-dimension-value16);
}

.kjun-skeleton-table-cell .kjun-skeleton-line {
  margin-bottom: 0;
  height: var(--_kjun-extension-skeleton-table-line-height);
}

/* Chart */
.kjun-skeleton-chart {
  display: flex;
  flex-direction: column;
  padding: var(--_kjun-extension-skeleton-padding);
  border: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
  border-radius: var(--_kjun-extension-skeleton-radius);
  background: var(--_kjun-bg-primary);
}

.kjun-skeleton-chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: var(--_kjun-extension-skeleton-gap);
  /* Bars stand on the axis line, like ChartSkeleton. */
}

.kjun-skeleton-chart-bar {
  flex: 1;
  max-width: var(--_kjun-extension-skeleton-chart-bar-max-width);
  background: var(--_kjun-skeleton);
  border-radius: var(--_kjun-extension-skeleton-line-radius) var(--_kjun-geometry-radius-radius4) 0 0;
}

.kjun-skeleton-chart-axis {
  height: var(--_kjun-extension-skeleton-chart-axis-height);
  background: var(--_kjun-border-primary);
}

/* Stat Card */
.kjun-skeleton-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--_kjun-extension-skeleton-padding);
  border: var(--_kjun-border-default-width) solid var(--_kjun-border-primary);
  border-radius: var(--_kjun-extension-skeleton-radius);
  background: var(--_kjun-bg-primary);
}

.kjun-skeleton-stat-content {
  flex: 1;
}

.kjun-skeleton-stat-content .kjun-skeleton-line {
  margin-bottom: var(--_kjun-extension-skeleton-field-gap);
}

.kjun-skeleton-stat-chart {
  width: var(--_kjun-extension-skeleton-stat-width);
  height: var(--_kjun-extension-skeleton-stat-height);
}

.kjun-skeleton-sparkline {
  width: 100%;
  height: 100%;
  background: var(--_kjun-skeleton);
  border-radius: var(--_kjun-extension-skeleton-line-radius);
}

/* Block */
.kjun-skeleton-block {
  background: var(--_kjun-skeleton);
  border-radius: var(--_kjun-extension-skeleton-block-radius);
}

/* Animation */
.kjun-skeleton-animated .kjun-skeleton-line,
.kjun-skeleton-animated .kjun-skeleton-avatar,
.kjun-skeleton-animated .kjun-skeleton-chart-bar,
.kjun-skeleton-animated .kjun-skeleton-sparkline,
.kjun-skeleton-animated .kjun-skeleton-block {
  background: linear-gradient(
    90deg,
    var(--_kjun-skeleton) 25%,
    var(--_kjun-skeleton-shine) 50%,
    var(--_kjun-skeleton) 75%
  );
  background-size: 200% 100%;
  animation: kjun-skeleton-shimmer var(--_kjun-motion-shimmer) ease-in-out infinite;
}

@keyframes kjun-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kjun-skeleton-animated * { animation: none !important; }
}
</style>
