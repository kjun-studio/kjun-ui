<template>
  <div class="ds-data-state kjun-data-state" :aria-busy="loading || refreshing ? 'true' : 'false'">
    <!-- 갱신 표시의 바깥 DOM을 고정해 Vue 2의 본문 재사용·이동으로 인한 스크롤 초기화를 막는다. -->
    <div key="refresh-status">
      <div v-if="isRefreshing" class="ds-data-state-status kjun-data-status" role="status">
        <DsSpinner size="xs" /><span>{{ refreshingText }}</span>
      </div>
    </div>
    <!-- 첫 로딩: skeleton 모드 (재조회 시에는 hasLoadedOnce로 이전 콘텐츠 유지) -->
    <div v-if="isInitialLoading && skeleton" :class="loadingClasses" role="status" :aria-label="loadingText">
      <slot name="loading">
        <div class="space-y-3">
          <ds-skeleton
            v-for="i in skeletonCount"
            :key="i"
            :type="skeletonType"
          />
        </div>
      </slot>
    </div>

    <!-- 첫 로딩: 스피너 모드 (기본) -->
    <div v-else-if="isInitialLoading" :class="loadingClasses" role="status" :aria-label="loadingText">
      <slot name="loading">
        <div class="kjun-data-loading">
          <ds-spinner size="md" />
          <p>{{ loadingText }}</p>
        </div>
      </slot>
    </div>

    <!-- Error -->
    <div v-else-if="blockingError" class="kjun-state-actions" :class="containerClasses" :role="$scopedSlots.error || $slots.error ? 'alert' : undefined">
      <slot name="error" :error="error" :retry="emitRetry">
        <DsAlert type="danger" title="오류 발생">
          {{ error }}
          <template v-if="hasRetryListener" #actions>
            <DsButton variant="secondary" @click.stop="emitRetry">{{ retryText }}</DsButton>
          </template>
        </DsAlert>
      </slot>
    </div>

    <!-- Empty -->
    <div v-else-if="empty" class="kjun-data-empty kjun-state-actions" :class="containerClasses">
      <slot name="empty">
        <DsEmpty :text="emptyText" :icon="emptyIcon">
          <DsButton
            v-if="emptyActionText"
            @click.stop="$emit('empty-action')"
          >
            {{ emptyActionText }}
          </DsButton>
        </DsEmpty>
      </slot>
    </div>

    <!-- Content: 재조회 중에는 이전 콘텐츠를 유지한 채 dim 처리 (stale-while-revalidate) -->
    <div
      v-if="showContent"
      key="content"
      :class="{
        'ds-data-state-refreshing': loading && !usesQueryState,
        'ds-data-state-concealed': contentConcealed,
      }"
      :aria-hidden="contentConcealed ? 'true' : undefined"
      :inert="contentConcealed ? '' : null"
    >
      <slot></slot>
    </div>
    <div v-if="visibleRefreshError && !isInitialLoading" class="kjun-data-warning kjun-state-actions">
    <!-- Retry sits in the actions slot like the blocking error; the sm alert sizes the button. -->
    <DsAlert type="warning" size="sm">
      {{ visibleRefreshError }} · 이전 조회 결과를 표시하고 있습니다.
      <template v-if="hasRetryListener" #actions>
        <DsButton variant="secondary" @click.stop="emitRetry">{{ retryText }}</DsButton>
      </template>
    </DsAlert>
    </div>
  </div>
</template>

<script>
import DsAlert from "./Alert.vue";
import DsButton from "../primitives/Button.vue";
import DsEmpty from "../data-display/Empty.vue";
import DsSkeleton from "../data-display/Skeleton.vue";
import DsSpinner from "./Spinner.vue";
import { componentMixins } from "../../component-mixins.js";
import queryDisplayMixin from '@kjun-adapter/queryDisplayMixin.js'

export default {
  components: { DsAlert, DsButton, DsEmpty, DsSkeleton, DsSpinner },
  name: 'DsDataState',
  mixins: [queryDisplayMixin, ...componentMixins],
  props: {
    // null은 기존 계약을 유지한다. 조건 키를 전달한 화면만 동일 조건 갱신에서 본문을 보존한다.
    queryKey: { type: [String, Number], default: null },
    // 차트·표 인스턴스가 있는 영역은 조건 변경 중에도 기존 DOM을 보존한다.
    preserveContent: { type: Boolean, default: false },
    refreshing: { type: Boolean, default: false },
    refreshError: { type: String, default: null },
    refreshingText: { type: String, default: '갱신 중...' },
    loadingPadding: {
      type: String,
      default: 'default',
      validator: value => ['default', 'none'].includes(value),
    },
    loading: {
      type: Boolean,
      default: false
    },
    // true면 재조회 시 스피너로 교체하지 않고 이전 콘텐츠를 유지한다 (첫 로딩만 스피너/스켈레톤)
    hasLoadedOnce: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    },
    empty: {
      type: Boolean,
      default: false
    },
    emptyText: {
      type: String,
      default: '데이터가 없습니다'
    },
    // 기본은 텍스트만 — 빈 상태 아이콘은 필요한 페이지에서 empty-icon으로 명시 opt-in (DsEmpty와 동일 규칙)
    emptyIcon: {
      type: String,
      default: ''
    },
    emptyActionText: {
      type: String,
      default: null
    },
    loadingText: {
      type: String,
      default: '로딩 중...'
    },
    retryText: {
      type: String,
      default: '다시 시도'
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v)
    },
    skeleton: {
      type: Boolean,
      default: false,
    },
    skeletonType: {
      type: String,
      default: 'text',
      validator: (v) => ['text', 'card', 'table', 'stat', 'chart', 'block'].includes(v),
    },
    skeletonCount: {
      type: Number,
      default: 3,
    }
  },
  computed: {
    contentConcealed() { return this.isInitialLoading || !!this.blockingError || this.empty },
    showContent() { return !this.contentConcealed || (this.preserveContent && this.hasQueryResult) },
    isInitialLoading() {
      return this.loading && !this.hasCurrentResult
    },
    isRefreshing() { return this.refreshing || (this.usesQueryState && this.loading && this.hasCurrentResult) },
    blockingError() { return this.error && !(this.usesQueryState && this.hasCurrentResult) },
    visibleRefreshError() {
      return this.refreshError || (this.usesQueryState && this.hasCurrentResult ? this.error : null)
    },
    loadingClasses() { return this.loadingPadding === 'none' ? '' : this.containerClasses },
    containerClasses() {
      const sizes = {
        sm: 'py-state-padding-sm',
        md: 'py-state-padding-md',
        lg: 'py-state-padding-lg'
      }
      return sizes[this.size]
    },
    hasRetryListener() {
      return !!(this.$listeners && this.$listeners.retry)
    }
  },
  methods: {
    emitRetry() {
      this.$emit('retry')
    }
  }
}
</script>

<style scoped>
.ds-data-state { position: relative; }
.ds-data-state-concealed { position: absolute; top: 0; left: 0; right: 0; visibility: hidden; pointer-events: none; }
.ds-data-state-refreshing {
  opacity: var(--_kjun-state-opacity-pending);
  pointer-events: none;
  transition: opacity var(--motion-control) var(--ease-out);
}
</style>
