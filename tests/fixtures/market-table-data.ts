// Rows and columns shared by the MarketTable fixtures.
export const marketRows = [
  { id: 'a', name: 'Alpha', symbol: 'AAA', price: 84200, change: 2.35, volume: '12,340', cap: '8.2T' },
  { id: 'b', name: 'Beta', symbol: 'BBB', price: 98400, change: -1.25, volume: '5,120', cap: '1.1T' },
  { id: 'c', name: 'Gamma', symbol: 'CCC', price: 6500, change: 0, volume: '880', cap: '32B' },
];
export const marketColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'price', label: 'Price', type: 'price', align: 'right', sortable: true, flash: true },
  { key: 'change', label: 'Change', type: 'percent', align: 'right', sortable: true },
];
export const wideColumns = [...marketColumns, { key: 'volume', label: 'Volume', align: 'right' }, { key: 'cap', label: 'Cap', align: 'right' }];
export const longRows = [{ id: 'l', name: 'A very long asset name that never fits', symbol: 'LLL', price: 1234567, change: 2.35 }];
