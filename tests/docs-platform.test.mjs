import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlatform, platformHref } from '../shared/docs-platform.ts';

test('document platform URLs override the tab preference and invalid values fall back', () => {
  for (const platform of ['vue2', 'react', 'native']) {
    assert.equal(resolvePlatform('?platform=' + platform, 'native'), platform);
    assert.equal(resolvePlatform('', platform), platform);
    assert.equal(resolvePlatform('?platform=unsupported', platform), platform);
  }
  assert.equal(resolvePlatform('?platform=React', null), 'vue2');
  assert.equal(resolvePlatform('', 'invalid'), 'vue2');
});

test('document links preserve explicit platforms, other parameters and API anchors', () => {
  const url = new URL(platformHref('/components?q=검색&category=inputs#api', 'react'), 'https://docs.test');
  assert.equal(url.searchParams.get('q'), '검색');
  assert.equal(url.searchParams.get('category'), 'inputs');
  assert.equal(url.searchParams.get('platform'), 'react');
  assert.equal(url.hash, '#api');
  assert.equal(platformHref('/feedback?platform=native#api', 'react'), '/feedback?platform=native#api');
  assert.equal(platformHref('/feedback?platform=invalid', 'react'), '/feedback?platform=react');
  for (const link of ['#api', 'https://example.com/', '//example.com/', 'mailto:hello@example.com'])
    assert.equal(platformHref(link, 'native'), link);
  assert.equal(platformHref('/feedback', null), '/feedback');
});
