<template>
  <div
    ref="scroller"
    class="ds-scroll-fade"
    :style="maskStyle"
    @scroll.passive="updateOverflow"
  >
    <slot></slot>
  </div>
</template>

<script>
import { tokens } from "@kjun-ui/tokens";
import { componentMixins } from "../../component-mixins.js";
// 가로 스크롤 + 양끝 페이드 힌트 래퍼.
// 세그먼트 컨트롤/칩 그룹이 좁은 뷰포트에서 잘릴 때, 잘린 채 보이는 대신
// 스크롤 가능함을 페이드로 알린다. Tabs.vue와 동일하게 배경색을 칠하지 않고
// 콘텐츠 alpha를 mask로 깎아 어떤 배경에서도 자연스럽다.
export default {
  mixins: componentMixins,
  name: 'ScrollFade',
  data() {
    return {
      overflowLeft: false,
      overflowRight: false,
    }
  },
  computed: {
    maskStyle() {
      const fade = tokens.extensions.scrollFade.width
      let mask = null
      if (this.overflowLeft && this.overflowRight) {
        mask = `linear-gradient(to right, transparent, currentColor ${fade}px, currentColor calc(100% - ${fade}px), transparent)`
      } else if (this.overflowRight) {
        mask = `linear-gradient(to right, currentColor calc(100% - ${fade}px), transparent)`
      } else if (this.overflowLeft) {
        mask = `linear-gradient(to right, transparent, currentColor ${fade}px)`
      }
      return mask ? { maskImage: mask, WebkitMaskImage: mask } : {}
    },
  },
  mounted() {
    this.$nextTick(this.updateOverflow)
    window.addEventListener('resize', this.updateOverflow)
  },
  updated() {
    // 슬롯 콘텐츠 변동(옵션 증감 등) 후 오버플로우 재계산
    this.$nextTick(this.updateOverflow)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateOverflow)
  },
  methods: {
    updateOverflow() {
      const el = this.$refs.scroller
      if (!el) return
      const left = el.scrollLeft > 1
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      if (left !== this.overflowLeft) this.overflowLeft = left
      if (right !== this.overflowRight) this.overflowRight = right
    },
  },
}
</script>

<style scoped>
.ds-scroll-fade {
  overflow-x: auto;
  min-width: 0;
  max-width: 100%;
  scrollbar-width: none;
}
.ds-scroll-fade::-webkit-scrollbar {
  display: none;
}
</style>
