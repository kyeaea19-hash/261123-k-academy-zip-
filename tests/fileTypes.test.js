import test from 'node:test';
import assert from 'node:assert/strict';
import { getFileTypeInfo } from '../public/js/utils/fileTypes.js';

test('1. 허용 확장자 검증 (대소문자 무관)', () => {
  assert.equal(getFileTypeInfo('a.png').allowed, true);
  assert.equal(getFileTypeInfo('b.PDF').allowed, true);
  assert.equal(getFileTypeInfo('c.hwp').allowed, true);
  assert.equal(getFileTypeInfo('d.ipynb').allowed, true);
});

test('2. 비허용 확장자 검증', () => {
  assert.equal(getFileTypeInfo('e.svg').allowed, false);
  assert.equal(getFileTypeInfo('f.html').allowed, false);
  assert.equal(getFileTypeInfo('g.exe').allowed, false);
  assert.equal(getFileTypeInfo('README').allowed, false);
});

test('3. openMode 및 isImage 검증', () => {
  assert.equal(getFileTypeInfo('c.hwp').openMode, 'download');
  assert.equal(getFileTypeInfo('b.PDF').openMode, 'tab');
  assert.equal(getFileTypeInfo('a.png').isImage, true);
  assert.equal(getFileTypeInfo('b.PDF').isImage, false);
});
