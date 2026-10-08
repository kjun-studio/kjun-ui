export const EXECUTION_STATUSES = Object.freeze({
  queued: { variant: 'secondary', label: '대기 중' },
  starting: { variant: 'primary', label: '시작 중' },
  running: { variant: 'primary', label: '실행 중' },
  stopping: { variant: 'warning', label: '중단 중' },
  stopped: { variant: 'secondary', label: '중단됨' },
  completed: { variant: 'success', label: '완료' },
  completed_with_errors: { variant: 'warning', label: '완료 (오류)' },
  failed: { variant: 'danger', label: '실패' },
})
export function executionStatus(status) {
  if (status == null || status === '') return { variant: 'secondary', label: '실행 이력 없음' }
  return EXECUTION_STATUSES[status] || { variant: 'secondary', label: '알 수 없음' }
}
