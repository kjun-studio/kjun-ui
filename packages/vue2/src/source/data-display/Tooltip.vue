<template>
  <div
    class="ds-tooltip-wrapper relative inline-block"
    ref="trigger"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
    @click.capture="hide"
    @keydown.esc="hide"
  >
    <slot></slot>
    <transition name="ds-tooltip" :css="false" @before-enter="motionPrepare" @enter="motionEnter" @leave="motionLeave"
      @enter-cancelled="motionCancel" @leave-cancelled="motionCancel">
      <div
        v-kjun-layer="'tooltip'" v-if="visible && content"
        ref="floating"
        :id="tooltipId"
        role="tooltip"
        :style="floatingStyle"
        class="fixed px-tooltip-padding-x py-tooltip-padding-y text-xs rounded whitespace-normal break-words max-w-tooltip-max-width bg-chart-tooltip-bg text-chart-tooltip-text pointer-events-none"
      >
        {{ content }}
        <div class="absolute w-tooltip-arrow-size h-tooltip-arrow-size bg-chart-tooltip-bg rotate-45" :style="arrowStyle"></div>
      </div>
    </transition>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { layerMotion } from "../../adapters/layer-motion.js";
import { componentMixins } from "../../component-mixins.js";
import { connectTooltipDescription } from "../../adapters/tooltip-description.js";
import { computeFloatingPosition } from '../utils/position'

const ARROW = tokens.extensions.tooltip.arrowSize

export default {
  mixins: [...componentMixins, layerMotion("tooltip")],
  name: 'DsTooltip',
  props: {
    content: {
      type: String,
      default: ''
    },
    placement: {
      type: String,
      default: 'top',
      validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v)
    },
    delay: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      visible: false,
      timer: null,
      floatingStyle: {},
      arrowStyle: {}
    }
  },
  computed: {
    tooltipId() {
      return `ds-tooltip-${this._uid}`
    }
  },
  mounted() {
    this._description = connectTooltipDescription(this.$refs.trigger, this.tooltipId, () => this.visible && !!this.content);
    this._layerSubscription = this.kjunLayers?.state.subscribe(() => {
      let owner = this.$parent;
      while (owner && !this.kjunLayers.state.entries.has(owner._kjunLayerId)) owner = owner.$parent;
      if (this.kjunLayers.state.windowOf(owner?._kjunLayerId) !== this.kjunLayers.state.topWindow()?.id) this.hide();
    });
  },
  updated() {
    this._description?.sync();
  },
  methods: {
    // 트리거 클릭으로 모달이 열리면 포인터가 오버레이에 덮이는데, 브라우저는 포인터 이동
    // 없이는 mouseleave를 쏘지 않아 툴팁이 오버레이 위에 남는다. 그래서 템플릿에서 클릭에도
    // hide를 건다(버튼이 @click.stop을 달고 있어 버블링이 끊기므로 capture 단계).
    show() {
      // mouseenter와 focusin이 연달아 오면 대기 타이머가 두 개 생기는데, hide()는 마지막
      // 참조 하나만 취소한다. 남은 타이머가 뒤늦게 open()을 불러 툴팁이 닫히지 않는다.
      this.clearTimer()
      if (this.delay) {
        this.timer = setTimeout(() => this.open(), this.delay)
      } else {
        this.open()
      }
    },
    clearTimer() {
      if (!this.timer) return
      clearTimeout(this.timer)
      this.timer = null
    },
    open() {
      this.visible = true
      this.$nextTick(() => this.updatePosition())
      // 스크롤/리사이즈 시 추적 (capture로 내부 스크롤 컨테이너까지 포착)
      window.addEventListener('scroll', this.updatePosition, true)
      window.addEventListener('resize', this.updatePosition)
    },
    hide() {
      this.clearTimer()
      this.visible = false
      this._description?.sync();
      window.removeEventListener('scroll', this.updatePosition, true)
      window.removeEventListener('resize', this.updatePosition)
    },
    updatePosition() {
      const triggerEl = this.$refs.trigger
      const floatingEl = this.$refs.floating
      if (!triggerEl || !floatingEl) return

      const { top, left, placement, arrow } = computeFloatingPosition(
        triggerEl.getBoundingClientRect(),
        floatingEl.getBoundingClientRect(),
        { placement: this.placement, arrowSize: ARROW }
      )
      // backdrop-filter/transform 조상은 fixed 요소의 containing block이 된다.
      // 위치 계산값은 뷰포트 좌표이므로 해당 조상의 원점을 빼서 실제 CSS 좌표로 변환한다.
      const offsetParent = floatingEl.offsetParent
      const offsetRect = offsetParent
        && offsetParent !== document.body
        && offsetParent !== document.documentElement
        ? offsetParent.getBoundingClientRect()
        : null
      const adjustedTop = offsetRect ? top - offsetRect.top : top
      const adjustedLeft = offsetRect ? left - offsetRect.left : left
      this.floatingStyle = {
        top: `${Math.round(adjustedTop)}px`,
        left: `${Math.round(adjustedLeft)}px`
      }
      this.arrowStyle = this.buildArrowStyle(placement, arrow)
    },
    buildArrowStyle(placement, arrow) {
      const half = ARROW / 2
      if (placement === 'top') return { left: `${arrow.left - half}px`, bottom: `-${half}px` }
      if (placement === 'bottom') return { left: `${arrow.left - half}px`, top: `-${half}px` }
      if (placement === 'left') return { top: `${arrow.top - half}px`, right: `-${half}px` }
      return { top: `${arrow.top - half}px`, left: `-${half}px` }
    }
  },
  beforeDestroy() {
    this._description?.destroy();
    this._layerSubscription?.();
    if (this.timer) clearTimeout(this.timer)
    window.removeEventListener('scroll', this.updatePosition, true)
    window.removeEventListener('resize', this.updatePosition)
  }
}
</script>

<style scoped></style>
