import * as L from '../constants.js';

// 백업 파일 검증 (05 §8.2). 하나라도 틀리면 { ok:false, message } — 처음 발견한 위치를 괄호에 넣는다
// 예) days[0].date 가 'abc' → '백업 파일 형식이 올바르지 않아요 (days[0].date)'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLORS = ['blue', 'navy', 'teal', 'sea', 'brick', 'charcoal'];
const NOTE_KINDS = ['interest', 'question', 'pledge'];
const FORMAT = '백업 파일 형식이 올바르지 않아요';

// 실패 결과를 만든다 (위치가 있으면 괄호로 붙인다)
const bad = (where) => ({ ok: false, message: where ? `${FORMAT} (${where})` : FORMAT });

// 값이 문자열이고 max 자 이하인지 (없거나 null 이면 allowEmpty 에 따라 허용)
function strOk(v, max, allowEmpty = true) {
  if (v === undefined || v === null) return allowEmpty;
  return typeof v === 'string' && v.length <= max && (allowEmpty || v.length > 0);
}

// Day 1개를 검사한다 → 틀린 위치 이름 또는 null
function checkDay(d, i, seen) {
  const p = `days[${i}]`;
  if (!d || typeof d !== 'object') return p;
  if (typeof d.date !== 'string' || !DATE_RE.test(d.date) || seen.has(d.date)) return `${p}.date`;
  seen.add(d.date);
  if (!strOk(d.title, L.MAX_TITLE)) return `${p}.title`;
  if (!strOk(d.learned, L.MAX_LEARNED)) return `${p}.learned`;
  if (!strOk(d.reflection, L.MAX_REFLECTION)) return `${p}.reflection`;
  if (!Array.isArray(d.growthNotes) || d.growthNotes.length > L.MAX_NOTES_PER_DAY) return `${p}.growthNotes`;
  for (let j = 0; j < d.growthNotes.length; j++) {
    const n = d.growthNotes[j];
    if (!n || !NOTE_KINDS.includes(n.kind) || !strOk(n.text, L.MAX_NOTE, false)) return `${p}.growthNotes[${j}]`;
  }
  if (!Array.isArray(d.fieldIds)) return `${p}.fieldIds`;
  return null;
}

// Field 1개를 검사한다
function checkField(f, i) {
  const p = `fields[${i}]`;
  if (!f || typeof f !== 'object') return p;
  if (typeof f.id !== 'string' || !f.id) return `${p}.id`;
  if (!strOk(f.name, L.MAX_FIELD_NAME, false)) return `${p}.name`;
  if (f.type !== 'general' && f.type !== 'team') return `${p}.type`;
  if (!COLORS.includes(f.color)) return `${p}.color`;
  if (f.type === 'team' && f.team) {
    const t = f.team;
    if (!strOk(t.topic, L.MAX_TEAM_TOPIC)) return `${p}.team.topic`;
    if (!strOk(t.role, L.MAX_TEAM_ROLE)) return `${p}.team.role`;
    if (!strOk(t.goal, L.MAX_TEAM_GOAL)) return `${p}.team.goal`;
    if (!strOk(t.purpose, L.MAX_TEAM_PURPOSE)) return `${p}.team.purpose`;
    if (!strOk(t.memo, L.MAX_TEAM_MEMO)) return `${p}.team.memo`;
    if (t.members !== undefined && (!Array.isArray(t.members) || t.members.length > L.MAX_TEAM_MEMBERS)) return `${p}.team.members`;
  }
  return null;
}

// TeamLog 1개를 검사한다
function checkLog(l, i) {
  const p = `teamLogs[${i}]`;
  if (!l || typeof l !== 'object') return p;
  if (typeof l.id !== 'string' || typeof l.fieldId !== 'string') return `${p}.id`;
  if (typeof l.date !== 'string' || !DATE_RE.test(l.date)) return `${p}.date`;
  if (!strOk(l.progress, L.MAX_PROGRESS)) return `${p}.progress`;
  return null;
}

// 첨부 1개를 검사한다
function checkAttachment(a, i) {
  const p = `attachments[${i}]`;
  if (!a || typeof a !== 'object') return p;
  if (typeof a.id !== 'string' || !a.id) return `${p}.id`;
  if (typeof a.teamLogId !== 'string') return `${p}.teamLogId`;
  if (a.category !== 'material' && a.category !== 'output') return `${p}.category`;
  if (a.kind !== 'file' && a.kind !== 'link') return `${p}.kind`;
  if (a.kind === 'file') {
    if (!strOk(a.name, L.MAX_FILE_NAME, false)) return `${p}.name`;
    if (typeof a.dataUrl !== 'string' || !a.dataUrl.startsWith('data:')) return `${p}.dataUrl`;
  } else {
    if (!strOk(a.name, L.MAX_LINK_NAME, false)) return `${p}.name`;
    if (!strOk(a.url, L.MAX_URL, false) || !/^https?:\/\//i.test(a.url)) return `${p}.url`;
  }
  return null;
}

// 백업 객체 전체를 검사한다
export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj) || obj.app !== 'academy-summary-zip') {
    return { ok: false, message: '요약.zip 백업 파일이 아니에요' };
  }
  if (obj.schemaVersion !== 1) {
    return { ok: false, message: `지원하지 않는 백업 버전이에요 (버전 ${obj.schemaVersion ?? '없음'})` };
  }
  const data = obj.data;
  if (!data || typeof data !== 'object' ||
      !Array.isArray(data.days) || !Array.isArray(data.fields) ||
      !Array.isArray(data.teamLogs) || !Array.isArray(data.attachments)) {
    return bad();
  }

  const seen = new Set();
  for (let i = 0; i < data.days.length; i++) {
    const w = checkDay(data.days[i], i, seen);
    if (w) return bad(w);
  }
  for (let i = 0; i < data.fields.length; i++) {
    const w = checkField(data.fields[i], i);
    if (w) return bad(w);
  }
  for (let i = 0; i < data.teamLogs.length; i++) {
    const w = checkLog(data.teamLogs[i], i);
    if (w) return bad(w);
  }
  for (let i = 0; i < data.attachments.length; i++) {
    const w = checkAttachment(data.attachments[i], i);
    if (w) return bad(w);
  }
  return { ok: true };
}
