// Shared by the React/Native cases and the Vue 3 mirror: the app keeps the order and passes data in it.
export const reorderRows = [
  { id: 'r1', name: '알파', score: 30 },
  { id: 'r2', name: '브라보', score: 10 },
  { id: 'r3', name: '찰리', score: 20 },
];
export const reorderColumns = [
  { key: 'name', label: '이름', sortable: true },
  { key: 'score', label: '점수', align: 'right', sortable: true },
];
export const inOrder = (order: (string | number)[]) => order.map(id => reorderRows.find(row => row.id === id)!).filter(Boolean);
