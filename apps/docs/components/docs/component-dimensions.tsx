import { DataTable } from './data-table';
import { componentSpecs } from './token-component-specs';

export function ComponentDimensions({ name }: { name: string }) {
  const spec = componentSpecs.find(item => item.name === name);
  if (!spec) return null;
  return <div className="component-dimensions" data-component={name}>
    <h3>기본 규격</h3>
    <DataTable headings={['항목', '규격']} rows={spec.rows} />
  </div>;
}
