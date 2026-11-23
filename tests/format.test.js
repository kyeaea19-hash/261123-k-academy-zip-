import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  hashText,
  truncateFileName
} from '../public/js/utils/format.js';

test('1. formatBytes 검증', () => {
  assert.equal(formatBytes(845), '845B');
  assert.equal(formatBytes(1258291), '1.2MB');
  assert.equal(formatBytes(0), '0B');
});

test('2. hashText 검증 (FNV-1a 8자리 16진수)', () => {
  const h1 = hashText('');
  assert.equal(typeof h1, 'string');
  assert.equal(h1.length, 8);

  const h2 = hashText('SMP 결정 원리');
  const h3 = hashText('SMP 결정 원리');
  const h4 = hashText('다른 내용');

  assert.equal(h2, h3);
  assert.notEqual(h2, h4);
});

test('3. truncateFileName 검증', () => {
  const longName = '가'.repeat(200) + '.pdf';
  const truncated = truncateFileName(longName, 120);
  assert.equal(truncated.length, 120);
  assert.ok(truncated.endsWith('.pdf'));
});
