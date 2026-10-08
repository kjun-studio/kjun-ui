<template>
  <span class="kjun-image" :style="{ aspectRatio: aspectRatio > 0 ? aspectRatio : 1 }" :data-state="!src || state === 'error' ? 'error' : state">
    <img v-if="src && state !== 'error'" ref="image" :key="version" :src="src" :alt="decorative ? '' : alt" :loading="lazy ? 'lazy' : 'eager'" :style="{ objectFit: fit }" @load="loaded" @error="failed" />
    <span v-else class="kjun-image-fallback" :role="decorative ? undefined : 'img'" :aria-label="decorative ? undefined : alt" :aria-hidden="decorative ? 'true' : undefined"><slot name="fallback"><DsIcon name="image" size="var(--extension-image-fallback-icon-size)" /></slot></span>
  </span>
</template>
<script>
import DsIcon from "../icon.js";
export default {
  name: "DsImage", components: { DsIcon },
  props: { src: String, alt: { type: String, required: true }, decorative: { type: Boolean, default: false }, aspectRatio: { type: Number, default: 1 }, fit: { type: String, default: "cover", validator: v => ["cover", "contain"].includes(v) }, lazy: { type: Boolean, default: true } },
  data() { return { state: "loading", version: 0 }; },
  watch: { src() { this.state = "loading"; this.version++; } },
  methods: {
    loaded(event) { if (event.target !== this.$refs.image || event.target.getAttribute("src") !== this.src) return; this.state = "loaded"; this.$emit("load"); },
    failed(event) { if (event.target !== this.$refs.image || event.target.getAttribute("src") !== this.src) return; this.state = "error"; this.$emit("error"); },
  },
};
</script>
