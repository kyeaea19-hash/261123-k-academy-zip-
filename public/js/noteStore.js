// 성장 기록 메모지 저장 함수 (store.js 가 다시 내보낸다)
import * as db from './db.js';
import * as limits from './constants.js';
import { newId } from './utils/id.js';
import { notifyDataChanged } from './utils/events.js';

// ==================== 3. 성장 메모지 (GrowthNotes) ====================
export async function addNote(date, { kind = 'interest', color = 'blue', text = '' }) {
  const day = await db.get('days', date);
  if (!day) throw { code: 'NOT_FOUND', field: 'date' };

  if (day.growthNotes.length >= limits.MAX_NOTES_PER_DAY) {
    throw { code: 'VALIDATION', field: 'growthNotes', message: '메모지는 하루 30장까지예요.' };
  }
  const trimmed = text.trim();
  if (!trimmed) throw { code: 'VALIDATION', field: 'text', message: '내용을 입력해 주세요.' };

  const now = new Date().toISOString();
  const note = {
    id: newId(),
    kind,
    color,
    text: trimmed.slice(0, limits.MAX_NOTE),
    createdAt: now,
    updatedAt: now
  };

  day.growthNotes.push(note);
  day.updatedAt = now;
  await db.put('days', day);
  notifyDataChanged('note');
  return note;
}

export async function updateNote(date, noteId, patch) {
  const day = await db.get('days', date);
  if (!day) throw { code: 'NOT_FOUND', field: 'date' };

  const note = day.growthNotes.find(n => n.id === noteId);
  if (!note) throw { code: 'NOT_FOUND', field: 'noteId' };

  if (patch.text !== undefined) {
    const trimmed = patch.text.trim();
    if (!trimmed) throw { code: 'VALIDATION', field: 'text', message: '내용을 입력해 주세요.' };
    note.text = trimmed.slice(0, limits.MAX_NOTE);
  }
  if (patch.kind !== undefined) note.kind = patch.kind;
  if (patch.color !== undefined) note.color = patch.color;

  const now = new Date().toISOString();
  note.updatedAt = now;
  day.updatedAt = now;
  await db.put('days', day);
  notifyDataChanged('note');
  return note;
}

export async function deleteNote(date, noteId) {
  const day = await db.get('days', date);
  if (!day) throw { code: 'NOT_FOUND', field: 'date' };

  day.growthNotes = day.growthNotes.filter(n => n.id !== noteId);
  day.updatedAt = new Date().toISOString();
  await db.put('days', day);
  notifyDataChanged('note');
}
