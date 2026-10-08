export default {
  computed: {
    autoCardTitle() {
      return this.cardTitle || (this.columns[0] && this.columns[0].key) || null
    },
    badgeColumns() {
      return this.columns.filter(col => col.badge === true)
    },
    actionsColumn() {
      return this.columns.find(col => col.key === 'actions') || null
    },
    inlineCardActions() {
      return !!(this.actionsColumn && this.actionsColumn.inlineInCard)
    },
    // 액션 외 컬럼도 inlineInCard 지정 시 카드 헤더 우측에 배치 (예: 활성화 스위치) —
    // 본문 라벨-값 그리드에 컨트롤이 섞이면 텍스트 필드와 정렬 리듬이 깨진다
    inlineCardColumns() {
      return this.columns.filter(col => col.key !== 'actions' && col.inlineInCard)
    },
    cardBodyColumns() {
      if (!this.showCardMode) return []
      // cardSubtitle로 헤더에 승격된 컬럼은 본문에서 제외 — 같은 값이 카드당 두 번 렌더되는 것을 막는다.
      // 단, badge 컬럼이 있으면 헤더는 배지가 선점해 서브타이틀이 렌더되지 않으므로(템플릿 v-else-if)
      // 그때는 본문에 남긴다 — 제외하면 해당 컬럼이 카드 어디에도 안 나오는 정보 손실이 된다.
      // hideInCard: 비교 테이블처럼 카드 모드에서 핵심 지표만 남길 때 컬럼 단위로 생략
      const subtitleInHeader = this.badgeColumns.length ? null : this.cardSubtitle
      return this.columns.filter(col =>
        col.key !== this.autoCardTitle &&
        col.key !== subtitleInHeader &&
        col.key !== 'actions' &&
        !col.badge &&
        !col.hideInCard &&
        !col.inlineInCard
      )
    },
    cardSectionGroups() {
      if (!this.cardSections.length || !this.cardBodyColumns.length) return []

      const usedKeys = new Set()
      const groups = this.cardSections
        .map((section, index) => {
          const requestedKeys = Array.isArray(section.columns) ? section.columns : []
          const columns = this.cardBodyColumns.filter(col => requestedKeys.includes(col.key))
          columns.forEach(col => usedKeys.add(col.key))
          return {
            key: section.key || `section-${index}`,
            label: section.label || '',
            labelAlign: section.labelAlign || 'left',
            layout: section.layout || 'grid',
            columns
          }
        })
        .filter(section => section.columns.length)

      // 새 섹션 정의가 일부 컬럼만 다루더라도 나머지 데이터가 사라지지 않도록 기본 섹션에 남긴다.
      const remainingColumns = this.cardBodyColumns.filter(col => !usedKeys.has(col.key))
      if (remainingColumns.length) {
        groups.push({
          key: 'remaining',
          label: '',
          layout: 'grid',
          columns: remainingColumns
        })
      }
      return groups
    },
  },
  methods: {
    // 카드 모드에서 빈 값 필드를 생략 (컬럼 옵션 hideEmptyInCard: true 지정 시) —
    // 대부분 비어 있는 컬럼(에러 등)이 모든 카드에 "라벨: -"로 자리만 차지하는 것을 막는다
    cardBodyColumnsFor(row) {
      return this.cardBodyColumns.filter(col => {
        if (!col.hideEmptyInCard) return true
        const value = this.getValue(row, col.key)
        return value !== null && value !== undefined && value !== ''
      })
    },
    cardColumnsForSection(row, section) {
      const sectionKeys = new Set(section.columns.map(col => col.key))
      return this.cardBodyColumnsFor(row).filter(col => sectionKeys.has(col.key))
    },
    cardSectionLayoutClass(section) {
      const layout = ['stack', 'grid', 'metrics'].includes(section.layout) ? section.layout : 'grid'
      return `ds-table-card-body--${layout}`
    },
  },
}
