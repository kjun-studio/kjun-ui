// 응답 완료를 관찰해 표시 상태만 관리한다. 요청 순서 검증과 데이터 커밋은 조회 소유자가 담당한다.
export default {
  props: {
    queryKey: { type: [String, Number], default: null },
    resultKey: { type: [String, Number], default: undefined },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null },
    hasLoadedOnce: { type: Boolean, default: false },
  },
  data() {
    return { completedQueryKey: null, pendingQueryKey: null, hasQueryResult: false }
  },
  computed: {
    usesQueryState() { return this.queryKey !== null },
    hasCurrentResult() {
      if (this.usesQueryState && this.resultKey !== undefined) return this.resultKey === this.queryKey
      return this.usesQueryState
        ? this.hasQueryResult && this.completedQueryKey === this.queryKey
        : this.hasLoadedOnce
    },
    initialLoading() { return this.loading && !this.hasCurrentResult },
    queryRefreshing() { return this.usesQueryState && this.loading && this.hasCurrentResult },
  },
  created() {
    // 브레이크포인트 전환으로 목록이 다시 생성되어도 이미 받은 결과를 최초 로딩으로 취급하지 않는다.
    if (this.usesQueryState && this.hasLoadedOnce && !this.loading && !this.error) {
      this.completedQueryKey = this.queryKey
      this.hasQueryResult = true
    }
  },
  watch: {
    resultKey: {
      immediate: true,
      handler(value) {
        if (value === undefined || value === null) return
        this.completedQueryKey = value
        this.hasQueryResult = true
      },
    },
    loading: {
      immediate: true,
      handler(value, previous) {
        if (!this.usesQueryState) return
        if (value) this.pendingQueryKey = this.queryKey
        // 최초 false나 실패를 성공으로 기록하면 빈 화면도 갱신 대상으로 잘못 보존된다.
        else if (previous && !this.error && this.pendingQueryKey === this.queryKey) {
          this.completedQueryKey = this.queryKey
          this.hasQueryResult = true
        }
      },
    },
    queryKey() {
      if (this.loading) this.pendingQueryKey = this.queryKey
    },
  },
}
