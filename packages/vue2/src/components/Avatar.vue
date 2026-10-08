<template>
  <span class="kjun-avatar" :data-shape="shape" :data-size="size" :style="{ width: dimension + 'px', height: dimension + 'px' }"><DsImage :src="src" :alt="alt || name || '사용자'" :decorative="decorative" @load="$emit('load')" @error="$emit('error')"><template #fallback><slot name="fallback"><span v-if="initial">{{ initial }}</span><DsIcon v-else name="user" :size="'var(--extension-avatar-fallback-icon-sizes-' + size + ')'" /></slot></template></DsImage></span>
</template>
<script>
import { tokens } from "@kjun-ui/tokens";
import DsImage from "./Image.vue";
import DsIcon from "../icon.js";
export default { name: "DsAvatar", components: { DsImage, DsIcon }, props: { src: String, name: { type: String, default: "" }, alt: String, decorative: { type: Boolean, default: false }, size: { type: String, default: "md", validator: v => ["sm", "md", "lg"].includes(v) }, shape: { type: String, default: "circle", validator: v => ["circle", "square"].includes(v) } }, computed: { dimension() { return tokens.extensions.avatar[this.size]; }, initial() { return Array.from(this.name.trim())[0] || ""; } } };
</script>
