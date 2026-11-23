// 고수준 비즈니스 로직 및 스토리지 제어 모듈
import * as db from './db.js';
import * as limits from './constants.js';
import { newId } from './utils/id.js';
import { isValidDateKey, listDateRange, todayKey } from './utils/date.js';
import { notifyDataChanged } from './utils/events.js';

// 팀플·첨부, 검색·백업 함수도 이 파일에서 함께 내보낸다 (화면은 store.js 만 부른다)
export * from './noteStore.js';
export * from './teamStore.js';
export * from './dataStore.js';

// ==================== 1. 과정 (Course) ====================
export async function getCourse() {
  const rec = await db.get('meta', 'course');
  return rec ? rec.value : null;
}

export async function saveCourse(course) {
  if (!course || typeof course !== 'object') {
    throw { code: 'VALIDATION', field: 'course' };
  }
  const now = new Date().toISOString();
  const existing = await getCourse();

  const record = {
    key: 'course',
    value: {
      name: (course.name || '').trim().slice(0, limits.MAX_COURSE_NAME),
      startDate: course.startDate || null,
      endDate: course.endDate || null,
      includeWeekends: Boolean(course.includeWeekends),
      createdAt: existing?.createdAt || now,
      updatedAt: now
    }
  };

  await db.put('meta', record);
  notifyDataChanged('course');
  return record.value;
}

export async function generateDays({ startDate, endDate, includeWeekends = false }) {
  const dates = listDateRange(startDate, endDate, { includeWeekends });
  const existingDays = await db.getAll('days');
  const existingSet = new Set(existingDays.map(d => d.date));

  let createdCount = 0;
  const now = new Date().toISOString();

  await db.tx('days', 'readwrite', (store) => {
    for (const d of dates) {
      if (!existingSet.has(d)) {
        store.put({
          date: d,
          title: '',
          learned: '',
          reflection: '',
          growthNotes: [],
          fieldIds: [],
          ai: null,
          createdAt: now,
          updatedAt: now
        });
        createdCount++;
      }
    }
  });

  if (createdCount > 0) notifyDataChanged('day');
  return createdCount;
}

// ==================== 2. 날짜 기록 (Day) ====================
export async function listDays() {
  const days = await db.getAll('days');
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDay(date) {
  return await db.get('days', date);
}

export async function createDay(date) {
  if (!isValidDateKey(date)) {
    throw { code: 'VALIDATION', field: 'date', message: '올바른 날짜 형식이 아니에요.' };
  }
  const existing = await getDay(date);
  if (existing) return existing;

  const now = new Date().toISOString();
  const day = {
    date,
    title: '',
    learned: '',
    reflection: '',
    growthNotes: [],
    fieldIds: [],
    ai: null,
    createdAt: now,
    updatedAt: now
  };

  await db.put('days', day);
  notifyDataChanged('day');
  return day;
}

export async function updateDay(date, patch) {
  const day = await getDay(date);
  if (!day) throw { code: 'NOT_FOUND', field: 'date' };

  if (patch.title !== undefined) day.title = String(patch.title).slice(0, limits.MAX_TITLE);
  if (patch.learned !== undefined) day.learned = String(patch.learned).slice(0, limits.MAX_LEARNED);
  if (patch.reflection !== undefined) day.reflection = String(patch.reflection).slice(0, limits.MAX_REFLECTION);
  if (patch.fieldIds !== undefined) day.fieldIds = Array.from(new Set(patch.fieldIds));
  if (patch.ai !== undefined) day.ai = patch.ai;

  day.updatedAt = new Date().toISOString();
  await db.put('days', day);
  notifyDataChanged('day');
  return day;
}

export async function deleteDay(date) {
  // 연관된 teamLogs, attachments, files 함께 삭제
  await db.tx(['days', 'teamLogs', 'attachments', 'files'], 'readwrite', (stores) => {
    const [daysStore, teamLogsStore, attStore, filesStore] = stores;
    daysStore.delete(date);

    // date 인덱스로 teamLogs 조회
    const dateIdx = teamLogsStore.index('byDate');
    const req = dateIdx.getAll(date);
    req.onsuccess = () => {
      const logs = req.result || [];
      for (const log of logs) {
        teamLogsStore.delete(log.id);
        const attIdx = attStore.index('byTeamLog');
        const attReq = attIdx.getAll(log.id);
        attReq.onsuccess = () => {
          const atts = attReq.result || [];
          for (const a of atts) {
            attStore.delete(a.id);
            filesStore.delete(a.id);
          }
        };
      }
    };
  });

  notifyDataChanged('day');
}

// ==================== 4. 분야 (Fields) ====================
export async function listFields() {
  const fields = await db.getAll('fields');
  return fields.sort((a, b) => a.order - b.order);
}

export async function getField(id) {
  return await db.get('fields', id);
}

export async function createField({ name, type = 'general', color = 'blue' }) {
  const fields = await listFields();
  if (fields.length >= limits.MAX_FIELDS) {
    throw { code: 'LIMIT_EXCEEDED', message: '분야는 50개까지 만들 수 있어요.' };
  }

  const trimmed = name.trim();
  if (!trimmed) throw { code: 'VALIDATION', field: 'name', message: '분야 이름을 입력해 주세요.' };

  const norm = trimmed.toLowerCase().replace(/\s+/g, '');
  if (fields.some(f => f.name.toLowerCase().replace(/\s+/g, '') === norm)) {
    throw { code: 'DUPLICATE', message: '이미 있는 분야 이름이에요.' };
  }

  const now = new Date().toISOString();
  const maxOrder = fields.reduce((max, f) => Math.max(max, f.order), -1);

  const field = {
    id: newId(),
    name: trimmed.slice(0, limits.MAX_FIELD_NAME),
    type,
    color,
    order: maxOrder + 1,
    team: type === 'team' ? {
      topic: '',
      role: '',
      goal: '',
      purpose: '',
      startDate: null,
      endDate: null,
      members: [],
      memo: ''
    } : null,
    ai: null,
    createdAt: now,
    updatedAt: now
  };

  await db.put('fields', field);
  notifyDataChanged('field');
  return field;
}

export async function updateField(id, patch) {
  const field = await getField(id);
  if (!field) throw { code: 'NOT_FOUND', field: 'id' };

  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) throw { code: 'VALIDATION', field: 'name', message: '분야 이름을 입력해 주세요.' };
    const norm = trimmed.toLowerCase().replace(/\s+/g, '');
    const fields = await listFields();
    if (fields.some(f => f.id !== id && f.name.toLowerCase().replace(/\s+/g, '') === norm)) {
      throw { code: 'DUPLICATE', message: '이미 있는 분야 이름이에요.' };
    }
    field.name = trimmed.slice(0, limits.MAX_FIELD_NAME);
  }

  if (patch.color !== undefined) field.color = patch.color;
  if (patch.team !== undefined && field.type === 'team') {
    // 팀 정보는 글자 수·인원 제한에 맞춰 정리해서 저장한다
    const t = { ...field.team, ...patch.team };
    const cut = (v, max) => String(v || '').trim().slice(0, max);
    field.team = {
      topic: cut(t.topic, limits.MAX_TEAM_TOPIC),
      role: cut(t.role, limits.MAX_TEAM_ROLE),
      goal: cut(t.goal, limits.MAX_TEAM_GOAL),
      purpose: cut(t.purpose, limits.MAX_TEAM_PURPOSE),
      startDate: isValidDateKey(t.startDate) ? t.startDate : null,
      endDate: isValidDateKey(t.endDate) ? t.endDate : null,
      members: Array.from(new Set((t.members || []).map(m => cut(m, limits.MAX_MEMBER_NAME)).filter(Boolean))).slice(0, limits.MAX_TEAM_MEMBERS),
      memo: cut(t.memo, limits.MAX_TEAM_MEMO)
    };
  }
  if (patch.ai !== undefined) field.ai = patch.ai;

  field.updatedAt = new Date().toISOString();
  await db.put('fields', field);
  notifyDataChanged('field');
  return field;
}

export async function deleteField(id) {
  const field = await getField(id);
  if (!field) return;

  if (field.type === 'general') {
    await db.tx(['fields', 'days'], 'readwrite', (stores) => {
      const [fieldsStore, daysStore] = stores;
      fieldsStore.delete(id);
      const req = daysStore.getAll();
      req.onsuccess = () => {
        const days = req.result || [];
        for (const d of days) {
          if (d.fieldIds.includes(id)) {
            d.fieldIds = d.fieldIds.filter(fId => fId !== id);
            daysStore.put(d);
          }
        }
      };
    });
  } else {
    // 팀플 삭제
    await db.tx(['fields', 'days', 'teamLogs', 'attachments', 'files'], 'readwrite', (stores) => {
      const [fieldsStore, daysStore, teamLogsStore, attStore, filesStore] = stores;
      fieldsStore.delete(id);

      const daysReq = daysStore.getAll();
      daysReq.onsuccess = () => {
        const days = daysReq.result || [];
        for (const d of days) {
          if (d.fieldIds.includes(id)) {
            d.fieldIds = d.fieldIds.filter(fId => fId !== id);
            daysStore.put(d);
          }
        }
      };

      const logIdx = teamLogsStore.index('byField');
      const logReq = logIdx.getAll(id);
      logReq.onsuccess = () => {
        const logs = logReq.result || [];
        for (const l of logs) {
          teamLogsStore.delete(l.id);
        }
      };

      const attIdx = attStore.index('byField');
      const attReq = attIdx.getAll(id);
      attReq.onsuccess = () => {
        const atts = attReq.result || [];
        for (const a of atts) {
          attStore.delete(a.id);
          filesStore.delete(a.id);
        }
      };
    });
  }

  // order 재정렬
  const remaining = await listFields();
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i) {
      remaining[i].order = i;
      await db.put('fields', remaining[i]);
    }
  }

  notifyDataChanged('field');
}

export async function moveField(id, direction) {
  const fields = await listFields();
  const idx = fields.findIndex(f => f.id === id);
  if (idx === -1) return;

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= fields.length) return;

  const temp = fields[idx].order;
  fields[idx].order = fields[targetIdx].order;
  fields[targetIdx].order = temp;

  await db.put('fields', fields[idx]);
  await db.put('fields', fields[targetIdx]);
  notifyDataChanged('field');
}

export async function setDayFields(date, fieldIds) {
  return await updateDay(date, { fieldIds });
}

// ==================== 7. 통계 및 기타 ====================
export async function getStats() {
  const days = await db.getAll('days');
  const fields = await db.getAll('fields');
  const atts = await db.getAll('attachments');

  let writtenDays = 0;
  let noteCount = 0;

  for (const d of days) {
    if ((d.learned && d.learned.trim()) || (d.reflection && d.reflection.trim()) || d.growthNotes.length > 0) {
      writtenDays++;
    }
    noteCount += d.growthNotes.length;
  }

  return {
    totalDays: days.length,
    writtenDays,
    noteCount,
    fieldCount: fields.length,
    teamCount: fields.filter(f => f.type === 'team').length,
    attachmentCount: atts.length
  };
}
