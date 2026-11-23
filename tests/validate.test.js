import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSummarizeDayInput, validateSummarizeFieldInput, validateSuggestFieldsInput,
  cleanDaySummary, cleanFieldSummary, cleanFieldSuggestion
} from '../api/_lib/validate.js';

const okDay = {
  date: '2026-11-23',
  title: 'SMP',
  learned: '계통한계가격은 시간대별 가장 비싼 발전기의 변동비로 결정된다.',
  reflection: '',
  growthNotes: [{ kind: 'interest', text: 'LSTM' }]
};

test('1. summarize-day 입력 검사', () => {
  assert.equal(validateSummarizeDayInput(okDay).ok, true);
  assert.equal(validateSummarizeDayInput({ ...okDay, date: '오늘' }).ok, false);
  assert.equal(validateSummarizeDayInput({ ...okDay, learned: 'a'.repeat(5001) }).ok, false);
  assert.equal(validateSummarizeDayInput({ ...okDay, learned: 'a'.repeat(19), reflection: '  ' }).ok, false);
  assert.equal(validateSummarizeDayInput({ ...okDay, growthNotes: [{ kind: 'wish', text: 'x' }] }).ok, false);
});

test('2. summarize-field 입력 검사', () => {
  const entry = { date: '2026-11-17', title: '', learned: '배움', reflection: '', notes: [], teamProgress: '' };
  const base = { fieldName: '파이썬', fieldType: 'general', team: null, entries: [entry] };
  assert.equal(validateSummarizeFieldInput(base).ok, true);
  assert.equal(validateSummarizeFieldInput({ ...base, entries: [] }).ok, false);
  assert.equal(validateSummarizeFieldInput({ ...base, entries: Array(31).fill(entry) }).ok, false);
  assert.equal(validateSummarizeFieldInput({ ...base, fieldType: 'team', team: null }).ok, false);
  assert.equal(validateSummarizeFieldInput({ ...base, fieldType: 'team', team: { topic: 't', role: '', goal: '', purpose: '' } }).ok, true);
});

test('3. suggest-fields 입력 검사', () => {
  const text = '오늘은 파이썬 판다스로 전력 수요 데이터를 전처리했다';
  assert.equal(validateSuggestFieldsInput({ text, fields: [] }).ok, false);
  assert.equal(validateSuggestFieldsInput({ text, fields: [{ id: 'a', name: '파이썬' }] }).ok, true);
});

test('4. 결과 정리', () => {
  const r = cleanDaySummary({ summary: ['a', 'b', 'c', 'd'], keywords: ['#SMP', 'SMP', 'a'.repeat(30)] });
  assert.deepEqual(r.keywords, ['SMP', 'a'.repeat(20)]);
  assert.equal(r.summary.length, 3);
  assert.equal(cleanDaySummary({ summary: ['a', ' '], keywords: ['x'] }), null);
  assert.equal(cleanFieldSummary({ overview: '', keyPoints: ['x'], nextTopics: [] }), null);
  assert.deepEqual(cleanFieldSuggestion({ fieldIds: ['b', 'x', 'b', 'a', 'c', 'd'] }, ['a', 'b', 'c', 'd']).fieldIds, ['b', 'a', 'c']);
});
