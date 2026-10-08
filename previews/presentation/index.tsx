import { createRoot } from 'react-dom/client';
import { KjunProvider } from '@kjun/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { actions } from './actions';
import { inputs } from './inputs';
import { layout } from './layout';
import { data } from './data';
import { ActivityList, SettingsForm, DataTable } from './common';
import { presentations, overviewScenes, captureFor } from './registry.mjs';
const query = new URLSearchParams(location.search);
const name = query.get('scene') || '';
const embedded = query.get('embedded') === 'true';
const scene = [...presentations, ...overviewScenes].find(scene => scene.name === name);
if (!scene) throw Error('Unknown presentation scene: ' + name);
const content = name === 'OverviewLists' ? <ActivityList /> : name === 'OverviewForm' ? <SettingsForm /> : name === 'OverviewData' ? <DataTable /> : actions(name) || inputs(name) || layout(name) || data(name);
if (!content) throw Error('Missing presentation renderer: ' + name);
applyDemoColors('default');
const capture = captureFor(scene);
document.documentElement.style.setProperty('--presentation-width', capture.width + 'px');
document.documentElement.style.setProperty('--presentation-height', capture.height + 'px');
document.documentElement.style.setProperty('--presentation-padding', capture.padding + 'px');
document.documentElement.dataset.presentation = name.startsWith('Overview') ? 'overview' : 'component';
const root = createRoot(document.getElementById('root')!, { onCaughtError: error => {
  if (name === 'DsErrorBoundary' && error instanceof Error && error.message === 'presentation: expected boundary example') document.documentElement.dataset.expectedBoundary = 'caught';
  else throw error;
} });
root.render(<main className="presentation-canvas" data-scene={name} data-embedded={embedded}>
  <KjunProvider className="presentation-scope" style={{ width: embedded ? '100%' : scene.width || 'max-content', maxWidth: '100%' }}>
    <div className="presentation-subject">{scene.layer && !embedded ? <iframe className="presentation-window" title={name + ' 화면'} src={'?scene=' + name + '&embedded=true'} /> : content}</div>
  </KjunProvider>
</main>);
