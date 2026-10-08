<template>
  <div class="ds-error-boundary">
    <div v-if="hasError" class="ds-error-boundary-fallback">
      <div class="kjun-error-fallback">
        <h3 >{{ fallbackMessage }}</h3>
        <p >
          페이지를 새로고침하면 문제가 해결될 수 있습니다.
        </p>
        <DsButton
          @click.stop="reload"
        >
          새로고침
        </DsButton>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<script>
import DsButton from "../primitives/Button.vue";
import { componentMixins } from "../../component-mixins.js";
import { createLogger } from '@kjun-adapter/logger.js'

const logger = createLogger('DsErrorBoundary')

export default {
  mixins: componentMixins,
  components: { DsButton },
  name: 'DsErrorBoundary',
  props: {
    fallbackMessage: {
      type: String,
      default: '문제가 발생했습니다'
    }
  },
  data() {
    return {
      hasError: false
    }
  },
  errorCaptured(err, vm, info) {
    this.hasError = true
    logger.error('컴포넌트 에러 포착:', err, { component: vm?.$options?.name, info })
    return false
  },
  methods: {
    reload() {
      window.location.reload()
    }
  }
}
</script>
