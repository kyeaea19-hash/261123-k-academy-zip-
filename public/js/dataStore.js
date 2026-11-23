// 검색 · 백업 · 전체 삭제 (store.js 가 다시 내보낸다)
import * as db from './db.js';
import { MAX_SEARCH_QUERY, MAX_SEARCH_RESULTS } from './constants.js';
import { notifyDataChanged } from './utils/events.js';

const STORES = ['meta', 'days', 'fields', 'teamLogs', 'attachments', 'files'];
const EXCERPT_CHARS = 40;
const MAX_MATCHES_PER_DAY = 3;

// ==================== 검색 ====================
// 일치 위치 앞뒤 40자 발췌를 만든다. 예) { before: '…앞 글', match: 'SMP', after: '뒤 글…' }
export function makeExcerpt(text, index, length) {
  const flat = String(text).replace(/\s*\n\s*/g, ' ');
  const start = Math.max(0, index - EXCERPT_CHARS);
  const end = Math.min(flat.length, index + length + EXCERPT_CHARS);
  return {
    before: (start > 0 ? '…' : '') + flat.slice(start, index),
    match: flat.slice(index, index + length),
    after: flat.slice(index + length, end) + (end < flat.length ? '…' : '')
  };
}

// 검색어로 기록을 찾는다 → [{ date, matches: [{ label, excerpt }] }] (날짜 최신 순, 최대 100개)
export async function search(query) {
  const q = String(query || '').trim();
  if (!q || q.length > MAX_SEARCH_QUERY) return [];
  const needle = q.toLowerCase();

  const [days, logs, atts] = await Promise.all([db.getAll('days'), db.getAll('teamLogs'), db.getAll('attachments')]);
  const byDate = new Map();

  // 글 1개를 검사해 맞으면 그 날짜 결과에 넣는다
  const check = (date, label, text) => {
    if (typeof text !== 'string' || !text) return;
    const flat = text.replace(/\s*\n\s*/g, ' ');
    const idx = flat.toLowerCase().indexOf(needle);
    if (idx === -1) return;
    if (!byDate.has(date)) byDate.set(date, []);
    const list = byDate.get(date);
    if (list.length < MAX_MATCHES_PER_DAY) list.push({ label, excerpt: makeExcerpt(flat, idx, q.length) });
  };

  for (const d of days) {
    check(d.date, '제목', d.title);
    check(d.date, '배운 내용', d.learned);
    check(d.date, '느낀 점', d.reflection);
    for (const n of d.growthNotes || []) check(d.date, '메모지', n.text);
  }
  for (const l of logs) check(l.date, '팀플 일지', l.progress);
  for (const a of atts) check(a.date, '첨부', a.name);

  return Array.from(byDate.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, MAX_SEARCH_RESULTS)
    .map(([date, matches]) => ({ date, matches }));
}

// ==================== 백업 ====================
// Blob 을 data: URL 문자열로 바꾼다
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// data: URL 을 Blob 으로 바꾼다 (fetch 를 쓰지 않음 — CSP 와 무관하게 동작)
export function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(5, comma); // 'image/png;base64'
  const isBase64 = header.endsWith(';base64');
  const mime = (isBase64 ? header.slice(0, -7) : header) || 'application/octet-stream';
  const body = dataUrl.slice(comma + 1);
  if (!isBase64) return new Blob([decodeURIComponent(body)], { type: mime });
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// 모든 데이터를 백업 객체로 만든다 (04 §8)
export async function exportAll() {
  const [course, days, fields, teamLogs, attachments] = await Promise.all([
    db.get('meta', 'course'), db.getAll('days'), db.getAll('fields'), db.getAll('teamLogs'), db.getAll('attachments')
  ]);
  const withData = [];
  for (const a of attachments) {
    if (a.kind === 'file') {
      const rec = await db.get('files', a.id);
      withData.push({ ...a, dataUrl: rec?.blob ? await blobToDataUrl(rec.blob) : null });
    } else {
      withData.push({ ...a, dataUrl: null });
    }
  }
  return {
    app: 'academy-summary-zip',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      course: course ? course.value : null,
      days: days.sort((a, b) => a.date.localeCompare(b.date)),
      fields: fields.sort((a, b) => a.order - b.order),
      teamLogs,
      attachments: withData
    }
  };
}

// 검증을 통과한 백업 객체로 지금 데이터를 모두 바꾼다 (한 트랜잭션)
export async function importAll(backup) {
  const { course, days, fields, teamLogs, attachments } = backup.data;
  // 트랜잭션을 열기 전에 파일을 모두 Blob 으로 바꿔 둔다 (트랜잭션 안에서 다른 await 금지)
  const files = attachments.filter(a => a.kind === 'file').map(a => ({ id: a.id, blob: dataUrlToBlob(a.dataUrl) }));
  const cleanAtts = attachments.map(({ dataUrl, ...rest }) => rest);

  await db.tx(STORES, 'readwrite', (stores) => {
    const [metaS, daysS, fieldsS, logsS, attsS, filesS] = stores;
    stores.forEach(s => s.clear());
    if (course) metaS.put({ key: 'course', value: course });
    days.forEach(d => daysS.put(d));
    fields.forEach(f => fieldsS.put(f));
    teamLogs.forEach(l => logsS.put(l));
    cleanAtts.forEach(a => attsS.put(a));
    files.forEach(f => filesS.put(f));
  });
  notifyDataChanged('all');
}

// 마지막 백업 시각을 읽는다 (없으면 null)
export async function getLastBackupAt() {
  const rec = await db.get('meta', 'lastBackupAt');
  return rec ? rec.value : null;
}

// 마지막 백업 시각을 지금으로 저장한다
export async function setLastBackupAt(iso = new Date().toISOString()) {
  await db.put('meta', { key: 'lastBackupAt', value: iso });
  return iso;
}

// 6개 저장소를 모두 비운다 (localStorage 의 AI 접근 코드는 그대로)
export async function wipeAll() {
  await db.tx(STORES, 'readwrite', (stores) => {
    for (const s of stores) s.clear();
  });
  notifyDataChanged('all');
}
