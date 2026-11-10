<script setup lang="ts">
import { ref } from 'vue';
import { KjunIconToggle, KjunInput, KjunTextarea, KjunDatePicker } from '@kjun-ui/vue3';
const input = ref<string | number | null>(null);
const textarea = ref<string | null>(null);
const date = ref<string | null>(null);
const label = 'Favorite';
</script>
<template>
  <KjunIconToggle active-icon="star" :aria-label="label" />
  <KjunIconToggle active-icon="star" aria-labelledby="favorite-label" />
  <KjunIconToggle active-icon="star" v-bind="{ ariaLabel: label }" />
  <!-- @vue-expect-error A standard accessible name must not erase the required icon type. -->
  <KjunIconToggle :aria-label="label" />
  <span id="favorite-label">Favorite</span>
  <KjunInput v-model="input" />
  <KjunTextarea v-model="textarea" show-count :max-length="20" />
  <KjunDatePicker v-model="date" />
</template>
