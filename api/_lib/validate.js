// AI API 입력 검사와 결과 정리 (모두 순수 함수 — tests/validate.test.js 대상)
import * as L from './limits.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const NOTE_KINDS = ['interest', 'question', 'pledge'];

// 실패 결과를 만든다
const fail = (message) => ({ ok: false, message });

// 문자열이고 길이가 min~max 인지 확인한다
function isStr(v, min, max) {
  return typeof v === 'string' && v.length >= min && v.length <= max;
}

// 공백을 뺀 글자 수를 센다. 예) 'a b\n c' → 3
function countNonSpace(s) {
  return String(s || '').replace(/\s/g, '').length;
}

// 하루 요약 요청 본문을 검사한다
export function validateSummarizeDayInput(body) {
  if (!body || typeof body !== 'object') return fail('요청 형식이 올바르지 않아요');
  const { date, title = '', learned = '', reflection = '', growthNotes = [] } = body;
  if (typeof date !== 'string' || !DATE_RE.test(date)) return fail('date는 YYYY-MM-DD 형식이어야 해요');
  if (!isStr(title, 0, L.MAX_TITLE)) return fail(`title은 ${L.MAX_TITLE}자 이하여야 해요`);
  if (!isStr(learned, 0, L.MAX_LEARNED)) return fail(`learned는 ${L.MAX_LEARNED}자 이하여야 해요`);
  if (!isStr(reflection, 0, L.MAX_REFLECTION)) return fail(`reflection은 ${L.MAX_REFLECTION}자 이하여야 해요`);
  if (!Array.isArray(growthNotes) || growthNotes.length > L.MAX_NOTES_PER_DAY) return fail(`growthNotes는 ${L.MAX_NOTES_PER_DAY}개 이하 배열이어야 해요`);
  for (const n of growthNotes) {
    if (!n || !NOTE_KINDS.includes(n.kind)) return fail('growthNotes의 kind가 올바르지 않아요');
    if (!isStr(n.text, 1, L.MAX_NOTE)) return fail(`growthNotes의 text는 1~${L.MAX_NOTE}자여야 해요`);
  }
  if (countNonSpace(learned) + countNonSpace(reflection) < L.AI_MIN_CHARS) return fail(`배운 내용과 느낀 점을 합쳐 ${L.AI_MIN_CHARS}자 이상이어야 해요`);
  return { ok: true, value: { date, title, learned, reflection, growthNotes: growthNotes.map(n => ({ kind: n.kind, text: n.text })) } };
}

// 분야 요약 요청 본문을 검사한다
export function validateSummarizeFieldInput(body) {
  if (!body || typeof body !== 'object') return fail('요청 형식이 올바르지 않아요');
  const { fieldName, fieldType, team = null, entries } = body;
  if (!isStr(fieldName, 1, L.MAX_FIELD_NAME)) return fail(`fieldName은 1~${L.MAX_FIELD_NAME}자여야 해요`);
  if (!['general', 'team'].includes(fieldType)) return fail('fieldType은 general 또는 team이어야 해요');

  let cleanTeam = null;
  if (fieldType === 'team') {
    if (!team || typeof team !== 'object') return fail('팀플 분야는 team 정보가 필요해요');
    const t = { topic: team.topic ?? '', role: team.role ?? '', goal: team.goal ?? '', purpose: team.purpose ?? '' };
    if (!isStr(t.topic, 0, L.MAX_TEAM_TOPIC) || !isStr(t.role, 0, L.MAX_TEAM_ROLE) ||
        !isStr(t.goal, 0, L.MAX_TEAM_GOAL) || !isStr(t.purpose, 0, L.MAX_TEAM_PURPOSE)) {
      return fail('team 정보의 글자 수가 너무 많아요');
    }
    cleanTeam = t;
  } else if (team !== null) {
    return fail('일반 분야는 team이 null이어야 해요');
  }

  if (!Array.isArray(entries) || entries.length < 1 || entries.length > L.AI_FIELD_MAX_ENTRIES) {
    return fail(`entries는 1~${L.AI_FIELD_MAX_ENTRIES}개여야 해요`);
  }
  const cleanEntries = [];
  for (const e of entries) {
    if (!e || typeof e.date !== 'string' || !DATE_RE.test(e.date)) return fail('entries의 date 형식이 올바르지 않아요');
    const x = { date: e.date, title: e.title ?? '', learned: e.learned ?? '', reflection: e.reflection ?? '', notes: e.notes ?? [], teamProgress: e.teamProgress ?? '' };
    if (!isStr(x.title, 0, L.MAX_TITLE)) return fail(`entries의 title은 ${L.MAX_TITLE}자 이하여야 해요`);
    if (!isStr(x.learned, 0, L.AI_ENTRY_LEARNED_CHARS)) return fail(`entries의 learned는 ${L.AI_ENTRY_LEARNED_CHARS}자 이하여야 해요`);
    if (!isStr(x.reflection, 0, L.AI_ENTRY_REFLECTION_CHARS)) return fail(`entries의 reflection은 ${L.AI_ENTRY_REFLECTION_CHARS}자 이하여야 해요`);
    if (!Array.isArray(x.notes) || x.notes.length > 10 || x.notes.some(n => !isStr(n, 1, L.MAX_NOTE))) return fail('entries의 notes가 올바르지 않아요');
    if (!isStr(x.teamProgress, 0, L.AI_ENTRY_PROGRESS_CHARS)) return fail(`entries의 teamProgress는 ${L.AI_ENTRY_PROGRESS_CHARS}자 이하여야 해요`);
    cleanEntries.push(x);
  }
  return { ok: true, value: { fieldName, fieldType, team: cleanTeam, entries: cleanEntries } };
}

// 분야 태그 추천 요청 본문을 검사한다
export function validateSuggestFieldsInput(body) {
  if (!body || typeof body !== 'object') return fail('요청 형식이 올바르지 않아요');
  const { text, fields } = body;
  const maxText = L.MAX_TITLE + 1 + L.MAX_LEARNED;
  if (typeof text !== 'string' || text.length > maxText || countNonSpace(text) < L.AI_MIN_CHARS) return fail(`text는 ${L.AI_MIN_CHARS}~${maxText}자여야 해요`);
  if (!Array.isArray(fields) || fields.length < 1 || fields.length > L.MAX_FIELDS) return fail(`fields는 1~${L.MAX_FIELDS}개여야 해요`);
  for (const f of fields) {
    if (!f || !isStr(f.id, 1, 64) || !isStr(f.name, 1, L.MAX_FIELD_NAME)) return fail('fields의 id 또는 name이 올바르지 않아요');
  }
  return { ok: true, value: { text, fields: fields.map(f => ({ id: f.id, name: f.name })) } };
}

// 문자열 배열을 다듬는다 (trim, 빈 값 제거, 길이 자르기)
function cleanList(arr, maxLen) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(s => typeof s === 'string').map(s => s.trim()).filter(Boolean).map(s => s.slice(0, maxLen));
}

// 하루 요약 결과를 정리한다. 예) keywords ['#SMP','SMP'] → ['SMP']. 조건 미달이면 null
export function cleanDaySummary(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const summary = cleanList(raw.summary, 120).slice(0, 3);
  const keywords = Array.from(new Set(
    (Array.isArray(raw.keywords) ? raw.keywords : [])
      .filter(s => typeof s === 'string')
      .map(s => s.trim().replace(/^#+/, '').trim())
      .filter(Boolean)
      .map(s => s.slice(0, 20))
  )).slice(0, 5);
  if (summary.length < 3 || keywords.length === 0) return null;
  return { summary, keywords };
}

// 분야 요약 결과를 정리한다. 조건 미달이면 null
export function cleanFieldSummary(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const overview = typeof raw.overview === 'string' ? raw.overview.trim().slice(0, 600) : '';
  const keyPoints = cleanList(raw.keyPoints, 120).slice(0, 7);
  const nextTopics = cleanList(raw.nextTopics, 80).slice(0, 5);
  if (!overview || keyPoints.length === 0) return null;
  return { overview, keyPoints, nextTopics };
}

// 분야 추천 결과를 정리한다 (요청에 있던 id만, 중복 제거, 최대 3개)
export function cleanFieldSuggestion(raw, allowedIds) {
  const allowed = new Set(allowedIds);
  const ids = Array.isArray(raw?.fieldIds) ? raw.fieldIds : [];
  return { fieldIds: Array.from(new Set(ids.filter(id => typeof id === 'string' && allowed.has(id)))).slice(0, 3) };
}
