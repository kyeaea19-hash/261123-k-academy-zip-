import test from 'node:test';
import assert from 'node:assert/strict';
import * as clientLimits from '../public/js/constants.js';
import * as serverLimits from '../api/_lib/limits.js';

test('공통 키 제한값 일치 검증', () => {
  const commonKeys = [
    'MAX_TITLE',
    'MAX_LEARNED',
    'MAX_REFLECTION',
    'MAX_NOTE',
    'MAX_NOTES_PER_DAY',
    'MAX_FIELD_NAME',
    'MAX_FIELDS',
    'MAX_TEAM_TOPIC',
    'MAX_TEAM_ROLE',
    'MAX_TEAM_GOAL',
    'MAX_TEAM_PURPOSE',
    'MAX_PROGRESS',
    'AI_MIN_CHARS',
    'AI_FIELD_MAX_ENTRIES',
    'AI_ENTRY_LEARNED_CHARS',
    'AI_ENTRY_REFLECTION_CHARS',
    'AI_ENTRY_PROGRESS_CHARS'
  ];

  for (const k of commonKeys) {
    assert.equal(
      clientLimits[k],
      serverLimits[k],
      `Key ${k} differs between client (${clientLimits[k]}) and server (${serverLimits[k]})`
    );
  }
});
