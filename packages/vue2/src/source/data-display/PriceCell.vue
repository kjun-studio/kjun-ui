<script>
import { tokens } from "@kjun/tokens";
import { componentMixins } from "../../component-mixins.js";
import { domainColorHooks } from "../../domain-colors.js";
import DsSkeleton from './Skeleton.vue'
import DsAnimatedNumber from './AnimatedNumber.vue'
import DsFreshness from './Freshness.vue'

/**
 * 가격 값 셀에서 반복되던 3-요소(값 없으면 skeleton / stale이면 dim + AnimatedNumber / 신선도 배지)를
 * 한 곳에 모은 렌더 헬퍼.
 *
 * 함수형 컴포넌트로 작성한 이유: value가 있을 때는 [값-span, DsFreshness] 두 형제 노드를 반환해야
 * 호출부의 기존 마크업(예: NXT 배지 옆에 나란히, 바깥 inline-flex 래퍼 안)을 래핑 엘리먼트 추가 없이
 * 그대로 재현할 수 있다. 일반 컴포넌트는 단일 루트만 허용되어 이 구조를 그대로 복제할 수 없다.
 */
export default {
  mixins: componentMixins,
  name: 'PriceCell',
  functional: true,
  props: {
    value: { type: Number, default: null },
    formatter: { type: Function, default: null },
    stale: { type: Boolean, default: false },
    // 목록이 행 단위 신선도를 표시할 때는 가격의 stale 색상만 유지한다.
    showFreshness: { type: Boolean, default: true },
    source: { type: String, default: null },
    fetchedAt: { type: String, default: null },
    flashClass: { type: String, default: '' },
    fromPrevious: { type: Boolean, default: true },
  },
  render(h, { props }) {
    if (props.value == null) {
      // block 타입은 height prop 미지정 시 기본 100px 인라인 스타일이 래퍼 클래스(크기 유틸리티)를 무시하고
      // 행 밖으로 넘치므로, 높이는 반드시 prop으로 지정한다.
      return h(DsSkeleton, { props: { type: 'block', height: tokens.extensions.financial.priceSkeletonHeight + 'px', width: tokens.extensions.financial.priceSkeletonWidth + 'px' }, class: 'inline-block' })
    }
    return [
      h(
        'span',
        { class: ['ds-price-cell', props.flashClass, props.stale ? 'text-text-tertiary' : ''],
          hook: domainColorHooks(/\bprice-flash-(up|down)/.test(props.flashClass)) },
        [
          h(DsAnimatedNumber, {
            props: {
              fromPrevious: props.fromPrevious,
              value: props.value,
              formatter: props.formatter,
            },
          }),
        ],
      ),
      props.showFreshness ? h(DsFreshness, {
        props: {
          stale: !!props.stale,
          source: props.source,
          fetchedAt: props.fetchedAt,
        },
      }) : null,
    ]
  },
}
</script>
