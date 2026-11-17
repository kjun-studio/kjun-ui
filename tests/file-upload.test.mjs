import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptLabels, clampProgress, dragVerdict, extensionLabel, focusAfterRemove, formatBytes, matchesAccept,
  screenFiles, splitFileName, uploadRoom, uploadSummary, uploadTransitions,
} from '../shared/package-runtime/file-upload.ts';

const f = (name, size, type = '') => ({ name, size, type });

test('matchesAccept: extension, exact MIME, wildcard, case, empty accept', () => {
  assert.equal(matchesAccept('A.PDF', '', '.pdf'), true);
  assert.equal(matchesAccept('photo.jpg', 'image/jpeg', 'image/*'), true);
  assert.equal(matchesAccept('photo.jpg', 'image/jpeg', 'image/png'), false);
  assert.equal(matchesAccept('archive.tar.gz', '', '.gz'), true);
  assert.equal(matchesAccept('README', '', '.pdf'), false);
  assert.equal(matchesAccept('anything.bin', '', undefined), true);
  assert.equal(matchesAccept('a.pdf', '', ' .pdf , .png '), true);
});

test('uploadRoom: unlimited, remaining, never negative, one in single mode', () => {
  assert.equal(uploadRoom({ current: 3 }), Infinity);
  assert.equal(uploadRoom({ maxFiles: 5, current: 3 }), 2);
  assert.equal(uploadRoom({ maxFiles: 2, current: 4 }), 0);
  assert.equal(uploadRoom({ multiple: false, maxFiles: 1, current: 1 }), 1);
});

test('screenFiles checks type, then size, then fills the remaining room in order', () => {
  const r = screenFiles([f('a.pdf', 10), f('b.hwp', 10), f('c.pdf', 30), f('d.pdf', 10), f('e.pdf', 10)],
    { accept: '.pdf', maxSize: 20, maxFiles: 5, current: 3 });
  assert.deepEqual(r.accepted.map(x => x.name), ['a.pdf', 'd.pdf']);
  assert.deepEqual(r.rejected.map(x => [x.file.name, x.reason]), [['b.hwp', 'type'], ['c.pdf', 'size'], ['e.pdf', 'count']]);
});

test('screenFiles at the limit rejects everything as count', () => {
  const r = screenFiles([f('a.pdf', 1)], { maxFiles: 2, current: 2 });
  assert.deepEqual(r.accepted, []);
  assert.equal(r.rejected[0].reason, 'count');
});

test('multiple=false takes the first file even when one is already there', () => {
  const r = screenFiles([f('a.pdf', 1), f('b.pdf', 1)], { multiple: false, maxFiles: 1, current: 1 });
  assert.deepEqual(r.accepted.map(x => x.name), ['a.pdf']);
  assert.equal(r.rejected[0].reason, 'count');
});

test('dragVerdict: type only when every known MIME fails, unknown when MIME is missing, count when over room', () => {
  const it = type => ({ kind: 'file', type });
  assert.equal(dragVerdict([it('application/x-hwp')], { accept: 'image/*,application/pdf', current: 0 }).verdict, 'type');
  // A drag carries no names, so a MIME type cannot be checked against ".ext" rules: stay neutral instead of blocking.
  assert.equal(dragVerdict([it('application/pdf')], { accept: '.pdf', current: 0 }).verdict, 'unknown');
  assert.equal(dragVerdict([it('application/x-hwp')], { accept: '.pdf,image/*', current: 0 }).verdict, 'unknown');
  assert.equal(dragVerdict([it('image/png'), it('application/x-hwp')], { accept: 'image/*', current: 0 }).verdict, 'ok');
  assert.equal(dragVerdict([it('')], { accept: '.pdf', current: 0 }).verdict, 'unknown');
  assert.deepEqual(dragVerdict([it('image/png'), it('image/png'), it('image/png')], { maxFiles: 5, current: 4 }), { verdict: 'count', count: 3, room: 1 });
  assert.equal(dragVerdict([{ kind: 'string', type: 'text/plain' }], { current: 0 }).count, 0);
  assert.equal(dragVerdict([it('image/png'), it('')], { current: 0 }).verdict, 'ok'); // no accept: anything goes
});

test('splitFileName keeps the last 4 stem characters with the extension', () => {
  assert.deepEqual(splitFileName('2026년_정산_보고서_최종본.pdf'), { head: '2026년_정산_보고서', tail: '_최종본.pdf' });
  assert.deepEqual(splitFileName('a.pdf'), { head: '', tail: 'a.pdf' });
  assert.deepEqual(splitFileName('README'), { head: 'RE', tail: 'ADME' });
  assert.deepEqual(splitFileName('.env'), { head: '', tail: '.env' });
  assert.deepEqual(splitFileName('archive.tar.gz'), { head: 'archive', tail: '.tar.gz' });
});

test('formatBytes uses 1024 steps, one decimal under 100, none at 100 or more', () => {
  assert.equal(formatBytes(1023), '1023B');
  assert.equal(formatBytes(1024), '1KB');
  assert.equal(formatBytes(327680), '320KB');
  assert.equal(formatBytes(4.2 * 1048576), '4.2MB');
  assert.equal(formatBytes(18.6 * 1048576), '18.6MB');
  assert.equal(formatBytes(20 * 1048576), '20MB');
});

test('extensionLabel: upper-case extension up to 4 letters, FILE without one', () => {
  assert.equal(extensionLabel('a.xlsx'), 'XLSX');
  assert.equal(extensionLabel('a.jpeg'), 'JPEG');
  assert.equal(extensionLabel('a.markdown'), 'MARK');
  assert.equal(extensionLabel('README', 'text/plain'), 'FILE');
});

test('clampProgress', () => {
  assert.equal(clampProgress(undefined), undefined);
  assert.equal(clampProgress(-5), 0);
  assert.equal(clampProgress(140), 100);
  assert.equal(clampProgress(64), 64);
});

test('uploadTransitions reports only changes into done or error', () => {
  const files = [{ id: 'a', name: 'a.pdf', size: 1, status: 'done' }, { id: 'b', name: 'b.pdf', size: 1, status: 'error' }, { id: 'c', name: 'c.pdf', size: 1, status: 'uploading' }];
  assert.deepEqual(uploadTransitions({ a: 'uploading', b: 'error', c: 'queued' }, files), [{ id: 'a', name: 'a.pdf', status: 'done' }]);
  assert.deepEqual(uploadTransitions({}, files), []);
});

test('focusAfterRemove: next row, else previous, else the add button (null)', () => {
  assert.equal(focusAfterRemove(['a', 'b', 'c'], 'b'), 'c');
  assert.equal(focusAfterRemove(['a', 'b', 'c'], 'c'), 'b');
  assert.equal(focusAfterRemove(['a'], 'a'), null);
});

test('uploadSummary counts each status', () => {
  assert.deepEqual(uploadSummary([{ status: 'done' }, { status: 'error' }, { status: 'uploading' }, { status: 'queued' }]), { total: 4, done: 1, failed: 1, uploading: 1, queued: 1 });
});

test('acceptLabels splits extensions and exact MIME from wildcard groups', () => {
  assert.deepEqual(acceptLabels('.pdf, image/png ,video/*,.XLSX'), { labels: ['PDF', 'PNG', 'XLSX'], groups: ['video'] });
  assert.deepEqual(acceptLabels(undefined), { labels: [], groups: [] });
});
