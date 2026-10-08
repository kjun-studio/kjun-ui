<template>
<div class="ds-table-cards" role="list" aria-label="데이터 목록" :aria-busy="loading ? 'true' : 'false'">
      <template v-if="initialLoading">
        <div v-for="index in skeletonRows" :key="index" class="ds-table-card" aria-hidden="true">
          <div class="ds-table-card-header">
            <div class="ds-table-card-header-left">
              <DsSkeleton v-if="selectable" type="block" width="var(--_kjun-geometry-table-selection-size)" height="var(--_kjun-geometry-table-selection-size)" class="mr-2 shrink-0" />
              <DsSkeleton type="block" height="var(--extension-table-card-title-skeleton-height)" width="var(--extension-table-card-title-skeleton-width)" />
            </div>
            <DsSkeleton v-if="badgeColumns.length || cardSubtitle || inlineCardActions || inlineCardColumns.length" type="block" width="var(--extension-table-card-badge-skeleton-width)" height="var(--extension-table-card-title-skeleton-height)" />
          </div>
          <template v-if="cardSectionGroups.length">
            <section v-for="section in cardSectionGroups" :key="section.key" class="ds-table-card-section">
              <div v-if="section.label" class="ds-table-card-section-label">{{ section.label }}</div>
              <div :class="['ds-table-card-body', cardSectionLayoutClass(section)]">
                <div v-for="col in section.columns" :key="col.key" :class="['ds-table-card-field', { 'ds-table-card-field--full': col.fullWidthInCard, 'ds-table-card-field--label-right': section.labelAlign === 'right' }]">
                  <span class="ds-table-card-label">{{ col.label }}</span>
                  <DsSkeleton type="block" height="var(--extension-table-card-field-skeleton-height)" width="70%" />
                </div>
              </div>
            </section>
          </template>
          <div v-else class="ds-table-card-body">
            <div v-for="col in cardBodyColumns" :key="col.key" :class="['ds-table-card-field', { 'ds-table-card-field--full': col.fullWidthInCard }]">
              <span class="ds-table-card-label">{{ col.label }}</span>
              <DsSkeleton type="block" height="var(--extension-table-card-field-skeleton-height)" width="70%" />
            </div>
          </div>
          <div v-if="expandable" class="ds-table-card-expand-toggle"><DsSkeleton type="block" width="var(--extension-table-card-action-skeleton-width)" height="var(--extension-table-card-field-skeleton-height)" /></div>
          <div v-if="$scopedSlots['cell-actions'] && !inlineCardActions" class="ds-table-card-actions"><DsSkeleton type="block" width="var(--extension-table-card-action-skeleton-width)" height="var(--extension-table-card-action-skeleton-height)" /></div>
        </div>
      </template>
      <template v-else>
      <!-- row-class는 "이 행이 특별하다"는 행 상태 표시다 — 카드로 접힌다고 사라지면
           모바일에서만 상태가 안 보인다. hover/striped 같은 테이블 전용 클래스는 빼고
           소비자가 준 클래스만 넘긴다. -->
      <div
        v-for="(row, idx) in sortedData"
        :key="getRowKey(row, idx)"
        :class="['ds-table-card', 'kjun-table-row-action', customRowClass(row, idx)]"
        role="listitem"
        :tabindex="hasRowAction ? 0 : undefined"
        @keydown="handleRowKey($event, row, idx)"
        @click="handleRowClick(row, idx)"
      >
        <!-- 카드 헤더: 제목 + badge -->
        <div class="ds-table-card-header">
          <div class="ds-table-card-header-left">
            <TableCheck
              v-if="selectable"
              :checked="isSelected(row)"
              aria-label="행 선택"
              class="mr-2 flex-shrink-0"
              @change="toggleRow(row)"
              @click.stop
            />
            <span class="ds-table-card-title">
              <slot :name="`cell-${autoCardTitle}`" :row="row" :value="getValue(row, autoCardTitle)" :index="idx">
                {{ getValue(row, autoCardTitle) }}
              </slot>
            </span>
          </div>
          <div v-if="badgeColumns.length" class="ds-table-card-badges">
            <span v-for="col in badgeColumns" :key="col.key">
              <slot :name="`cell-${col.key}`" :row="row" :value="getValue(row, col.key)" :index="idx">
                {{ formatValue(getValue(row, col.key), col, row) }}
              </slot>
            </span>
          </div>
          <span v-else-if="cardSubtitle" class="ds-table-card-subtitle">
            <slot :name="`cell-${cardSubtitle}`" :row="row" :value="getValue(row, cardSubtitle)" :index="idx">
              {{ getValue(row, cardSubtitle) }}
            </slot>
          </span>
          <!-- inlineInCard: true 컬럼(액션·스위치 등 컴팩트 컨트롤)은 본문 대신 헤더 우측에 배치 — 카드 높이 절감 -->
          <div v-if="inlineCardActions || inlineCardColumns.length" class="ds-table-card-header-actions">
            <span v-for="col in inlineCardColumns" :key="col.key" @click.stop>
              <slot :name="`cell-${col.key}`" :row="row" :value="getValue(row, col.key)" :index="idx">
                {{ formatValue(getValue(row, col.key), col, row) }}
              </slot>
            </span>
            <slot v-if="inlineCardActions" name="cell-actions" :row="row" :value="getValue(row, 'actions')" :index="idx" />
          </div>
        </div>

        <!-- 카드 본문: 기본은 기존 2열 그리드, cardSections 지정 시 섹션별 레이아웃 -->
        <template v-if="cardSectionGroups.length">
          <template v-for="section in cardSectionGroups">
            <section
              v-if="cardColumnsForSection(row, section).length"
              :key="section.key"
              class="ds-table-card-section"
            >
              <div v-if="section.label" class="ds-table-card-section-label">{{ section.label }}</div>
              <div :class="['ds-table-card-body', cardSectionLayoutClass(section)]">
                <div
                  v-for="col in cardColumnsForSection(row, section)"
                  :key="col.key"
                  :class="['ds-table-card-field', {
                    'ds-table-card-field--full': col.fullWidthInCard,
                    'ds-table-card-field--label-right': section.labelAlign === 'right'
                  }]"
                >
                  <span class="ds-table-card-label">{{ col.label }}</span>
                  <span class="ds-table-card-value">
                    <slot :name="`cell-${col.key}`" :row="row" :value="getValue(row, col.key)" :index="idx">
                      {{ formatValue(getValue(row, col.key), col, row) }}
                    </slot>
                  </span>
                </div>
              </div>
            </section>
          </template>
        </template>
        <div v-else class="ds-table-card-body">
          <div
            v-for="col in cardBodyColumnsFor(row)"
            :key="col.key"
            :class="['ds-table-card-field', { 'ds-table-card-field--full': col.fullWidthInCard }]"
          >
            <span class="ds-table-card-label">{{ col.label }}</span>
            <span class="ds-table-card-value">
              <slot :name="`cell-${col.key}`" :row="row" :value="getValue(row, col.key)" :index="idx">
                {{ formatValue(getValue(row, col.key), col, row) }}
              </slot>
            </span>
          </div>
        </div>

        <!-- 확장 토글 + 콘텐츠 (카드 모드) -->
        <template v-if="expandable">
          <button
            type="button"
            class="ds-table-card-expand-toggle"
            @click.stop="toggleExpand(row)"
            :aria-expanded="String(isExpanded(row))"
          >
            <DsIcon :name="isExpanded(row) ? 'chevron-down' : 'chevron-right'" class="text-xs mr-1.5" />
            {{ isExpanded(row) ? '접기' : '상세 보기' }}
          </button>
          <div v-if="isExpanded(row)" class="ds-table-card-expand-content">
            <slot name="expand" :row="row" :index="idx"></slot>
          </div>
        </template>

        <!-- 카드 액션 푸터 -->
        <div v-if="actionsColumn && !inlineCardActions" class="ds-table-card-actions">
          <slot name="cell-actions" :row="row" :value="getValue(row, 'actions')" :index="idx" />
        </div>
      </div>
      <div v-if="!sortedData.length" class="ds-table-card-empty">
        {{ emptyText }}
      </div>
      </template>
    </div>
</template>

<script>
import DsIcon from "../../../icon.js";
import DsSkeleton from "../Skeleton.vue";
import TableCheck from "./TableCheck.vue";
import { componentMixins } from "../../../component-mixins.js";
// Card rendering receives only its inputs. State and events belong to Table.
export default {
  mixins: componentMixins,
  components: { DsIcon, DsSkeleton, TableCheck },
  name: 'TableCards',
  props: {
    loading: { type: Boolean, required: true },
    initialLoading: { type: Boolean, required: true },
    skeletonRows: { type: Number, required: true },
    emptyText: { type: String, required: true },
    selectable: { type: Boolean, required: true },
    expandable: { type: Boolean, required: true },
    cardSubtitle: { type: String, required: false },
    autoCardTitle: { type: String, required: false },
    sortedData: { type: Array, required: true },
    badgeColumns: { type: Array, required: true },
    actionsColumn: { type: Object, required: false },
    inlineCardActions: { type: Boolean, required: true },
    inlineCardColumns: { type: Array, required: true },
    cardBodyColumns: { type: Array, required: true },
    cardSectionGroups: { type: Array, required: true },
    getRowKey: { type: Function, required: true },
    getValue: { type: Function, required: true },
    customRowClass: { type: Function, required: true },
    isSelected: { type: Function, required: true },
    toggleRow: { type: Function, required: true },
    formatValue: { type: Function, required: true },
    cardSectionLayoutClass: { type: Function, required: true },
    cardColumnsForSection: { type: Function, required: true },
    cardBodyColumnsFor: { type: Function, required: true },
    toggleExpand: { type: Function, required: true },
    isExpanded: { type: Function, required: true },
    handleRowKey: { type: Function, required: true },
    handleRowClick: { type: Function, required: true },
    hasRowAction: Boolean,
  },
}
</script>
<style scoped src="./table.css"></style>
