import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBackup } from '../public/js/utils/backupSchema.js';

// 정상 백업 객체를 새로 만든다
function sample() {
  return {
    app: 'academy-summary-zip',
    schemaVersion: 1,
    exportedAt: '2026-11-23T08:00:00.000Z',
    data: {
      course: { name: '과정', startDate: '2026-11-03', endDate: '2026-11-24', includeWeekends: false },
      days: [
        { date: '2026-11-23', title: 'SMP', learned: '배움', reflection: '', growthNotes: [{ id: 'n1', kind: 'interest', color: 'blue', text: 'LSTM' }], fieldIds: ['f1'], ai: null },
        { date: '2026-11-24', title: '', learned: '', reflection: '', growthNotes: [], fieldIds: [], ai: null }
      ],
      fields: [{ id: 'f1', name: '팀플', type: 'team', color: 'teal', order: 0, team: { topic: '', role: '', goal: '', purpose: '', members: [], memo: '' } }],
      teamLogs: [{ id: 'f1__2026-11-23', fieldId: 'f1', date: '2026-11-23', progress: '회의' }],
      attachments: [
        { id: 'a1', teamLogId: 'f1__2026-11-23', fieldId: 'f1', date: '2026-11-23', category: 'material', kind: 'file', name: 'a.pdf', mimeType: 'application/pdf', size: 3, url: '', dataUrl: 'data:application/pdf;base64,JVBE' },
        { id: 'a2', teamLogId: 'f1__2026-11-23', fieldId: 'f1', date: '2026-11-23', category: 'output', kind: 'link', name: 'docs', mimeType: '', size: 0, url: 'https://example.com', dataUrl: null }
      ]
    }
  };
}

test('1. 정상 객체 통과', () => {
  assert.deepEqual(validateBackup(sample()), { ok: true });
});

test('2. app 다름 / schemaVersion 2', () => {
  assert.equal(validateBackup({ ...sample(), app: 'other' }).message, '요약.zip 백업 파일이 아니에요');
  assert.equal(validateBackup({ name: 'package' }).message, '요약.zip 백업 파일이 아니에요');
  assert.equal(validateBackup({ ...sample(), schemaVersion: 2 }).message, '지원하지 않는 백업 버전이에요 (버전 2)');
});

test('3. days 배열 아님 / 중복 date / 잘못된 date', () => {
  const a = sample(); a.data.days = {};
  assert.equal(validateBackup(a).message, '백업 파일 형식이 올바르지 않아요');
  const b = sample(); b.data.days[1].date = '2026-11-23';
  assert.equal(validateBackup(b).message, '백업 파일 형식이 올바르지 않아요 (days[1].date)');
  const c = sample(); c.data.days[0].date = 'abc';
  assert.equal(validateBackup(c).message, '백업 파일 형식이 올바르지 않아요 (days[0].date)');
});

test('4. 잘못된 color / dataUrl 누락 / 글자 수 초과', () => {
  const a = sample(); a.data.fields[0].color = 'pink';
  assert.equal(validateBackup(a).message, '백업 파일 형식이 올바르지 않아요 (fields[0].color)');
  const b = sample(); b.data.attachments[0].dataUrl = null;
  assert.equal(validateBackup(b).message, '백업 파일 형식이 올바르지 않아요 (attachments[0].dataUrl)');
  const c = sample(); c.data.days[0].learned = 'a'.repeat(5001);
  assert.equal(validateBackup(c).message, '백업 파일 형식이 올바르지 않아요 (days[0].learned)');
  const d = sample(); d.data.attachments[1].url = 'javascript:alert(1)';
  assert.equal(validateBackup(d).message, '백업 파일 형식이 올바르지 않아요 (attachments[1].url)');
});
