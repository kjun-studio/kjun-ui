<template>
  <div class="kjun-error-boundary">
    <div v-if="hasError" class="kjun-error-boundary-fallback">
      <div class="kjun-error-fallback">
        <h3 >{{ fallbackMessage }}</h3>
        <p >
          페이지를 새로고침하면 문제가 해결될 수 있습니다.
        </p>
        <KjunButton
          @click.stop="reload"
        >
          새로고침
        </KjunButton>
      </div>
    </div>
    <slot v-else />
  </div>
</template>

<script>
import KjunButton from "../primitives/Button.vue";
import { componentMixins } from "../../component-mixins.js";
export default {
  mixins: componentMixins,
  components: { KjunButton },
  name: 'KjunErrorBoundary',
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
  // Like React's onError: the app hears about the error through the error event, and it keeps
  // propagating to Vue.config.errorHandler so error reporting still sees it.
  errorCaptured(err, vm, info) {
    this.hasError = true
    this.$emit('error', err, info)
  },
  methods: {
    reload() {
      window.location.reload()
    }
  }
}
</script>
