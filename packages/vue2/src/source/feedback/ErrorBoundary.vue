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
import Vue from "vue";
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
  // Like React's onError, the nearest boundary handles the error: it emits error, reports it to the
  // app's Vue.config.errorHandler (or the console, as Vue would), and stops outer boundaries from reacting.
  errorCaptured(err, vm, info) {
    this.hasError = true
    this.$emit('error', err, info)
    if (Vue.config.errorHandler) Vue.config.errorHandler(err, vm, info)
    else console.error(err)
    return false
  },
  methods: {
    reload() {
      window.location.reload()
    }
  }
}
</script>
