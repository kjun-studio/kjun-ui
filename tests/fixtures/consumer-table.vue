<script setup lang="ts">
import { ref } from 'vue';
import { KjunTable, type TableColumn } from '@kjun-ui/vue3';
interface Row { id: string; amount: number }
const rows = ref<Row[]>([{ id: 'first', amount: 7 }]);
const selected = ref<Row[]>([]);
const columns: TableColumn<Row>[] = [{ key: 'amount', label: 'Amount', render: (_value, row) => row.amount.toFixed() }];
const rowClass = (row: Row) => row.id;
const rowClick = (row: Row, index: number) => row.amount + index;
const format = (_value: unknown, _column: TableColumn<Row>, row: Row) => row.amount.toFixed();
</script>
<template>
  <KjunTable :data="rows" :columns="columns" v-model:selected="selected" :row-class="rowClass" :format-value="format" @row-click="rowClick" selectable expandable>
    <template #cell="{ row, column }">{{ row.amount.toFixed() }}{{ column.format?.(row.amount, row) }}</template>
    <template #cell-amount="{ row }">{{ row.amount.toFixed() }}</template>
    <template #expand="{ row }">
      {{ row.amount.toFixed() }}
      <!-- @vue-expect-error The inferred row must reject unknown fields. -->
      {{ row.missing }}
    </template>
    <template #selectionToolbar="{ selected: chosen }">{{ chosen[0].amount.toFixed() }}</template>
  </KjunTable>
  <KjunTable :data="rows" :columns="[]" @update:selected="chosen => chosen[0].amount.toFixed()">
    <template #expand="{ row }">
      {{ row.amount.toFixed() }}
      <!-- @vue-expect-error Inference must work without annotated columns too. -->
      {{ row.missing }}
    </template>
  </KjunTable>
</template>
