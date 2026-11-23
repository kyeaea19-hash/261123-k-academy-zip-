import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toDateKey,
  fromDateKey,
  isValidDateKey,
  weekNumber,
  listDateRange
} from '../public/js/utils/date.js';

test('1. toDateKey(new Date(2026, 10, 23, 0, 30)) === "2026-11-23"', () => {
  const d = new Date(2026, 10, 23, 0, 30);
  assert.equal(toDateKey(d), '2026-11-23');
});

test('2. fromDateKey("2026-11-23").getDate() === 23', () => {
  const d = fromDateKey('2026-11-23');
  assert.equal(d.getDate(), 23);
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 10);
});

test('3. isValidDateKey 검증', () => {
  assert.equal(isValidDateKey('2026-02-30'), false);
  assert.equal(isValidDateKey('2028-02-29'), true); // 윤년
  assert.equal(isValidDateKey('invalid'), false);
});

test('4. weekNumber 검증', () => {
  // 기준일: 2026-11-03 (화요일, 기준 월요일: 11-02)
  assert.equal(weekNumber('2026-11-10', '2026-11-03'), 2);
  assert.equal(weekNumber('2026-11-02', '2026-11-03'), 1);
  assert.equal(weekNumber('2026-10-30', '2026-11-03'), 0);
});

test('5. listDateRange 검증', () => {
  // 2026-11-03(화) ~ 2026-11-09(월): 화, 수, 목, 금, 월 (5일)
  const weekdays = listDateRange('2026-11-03', '2026-11-09', { includeWeekends: false });
  assert.equal(weekdays.length, 5);

  const allDays = listDateRange('2026-11-03', '2026-11-09', { includeWeekends: true });
  assert.equal(allDays.length, 7);
});

test('6. 기간 367일이면 오류', () => {
  assert.throws(() => {
    listDateRange('2026-01-01', '2027-01-05', { includeWeekends: true });
  }, /RANGE_TOO_LONG/);
});
