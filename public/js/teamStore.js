// 팀플 일지·첨부 저장 함수 (store.js 가 다시 내보낸다)
import * as db from './db.js';
import * as limits from './constants.js';
import { newId } from './utils/id.js';
import { getFileTypeInfo } from './utils/fileTypes.js';
import { truncateFileName } from './utils/format.js';
import { notifyDataChanged } from './utils/events.js';

// ==================== 5. 팀플 일지 (TeamLogs) ====================
export async function getTeamLog(fieldId, date) {
  const id = `${fieldId}__${date}`;
  return await db.get('teamLogs', id);
}

export async function saveTeamLog(fieldId, date, progress) {
  const id = `${fieldId}__${date}`;
  const existing = await getTeamLog(fieldId, date);
  const now = new Date().toISOString();

  const record = {
    id,
    fieldId,
    date,
    progress: String(progress || '').slice(0, limits.MAX_PROGRESS),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  await db.put('teamLogs', record);
  notifyDataChanged('teamLog');
  return record;
}

export async function listTeamLogsByField(fieldId) {
  return await db.getAllByIndex('teamLogs', 'byField', fieldId);
}

// ==================== 6. 첨부 (Attachments & Files) ====================
export async function listAttachments(teamLogId) {
  return await db.getAllByIndex('attachments', 'byTeamLog', teamLogId);
}

// 모든 첨부 정보를 읽는다 (홈 카드의 날짜별 첨부 수 계산용)
export async function listAllAttachments() {
  return await db.getAll('attachments');
}

export async function listAttachmentsByField(fieldId) {
  return await db.getAllByIndex('attachments', 'byField', fieldId);
}

export async function addFileAttachment({ fieldId, date, category = 'material', file }) {
  const teamLogId = `${fieldId}__${date}`;
  let log = await getTeamLog(fieldId, date);
  if (!log) {
    log = await saveTeamLog(fieldId, date, '');
  }

  const existingAtts = await listAttachments(teamLogId);
  if (existingAtts.length >= limits.MAX_ATTACHMENTS_PER_LOG) {
    throw { code: 'LIMIT_EXCEEDED', message: '일지 1개당 첨부는 최대 20개까지예요.' };
  }

  // 화면 검사와 별개로 한 번 더 확인한다 (확장자·크기)
  const info = getFileTypeInfo(file.name);
  if (!info.allowed) throw { code: 'VALIDATION', field: 'file', message: `올릴 수 없는 파일 형식이에요 (.${info.ext})` };
  if (file.size > limits.MAX_FILE_BYTES) throw { code: 'VALIDATION', field: 'file', message: '파일이 10MB보다 커요.' };

  const id = newId();
  const att = {
    id,
    teamLogId,
    fieldId,
    date,
    category: category === 'output' ? 'output' : 'material',
    kind: 'file',
    name: truncateFileName(file.name, limits.MAX_FILE_NAME),
    mimeType: file.type || info.mime,
    size: file.size,
    url: '',
    createdAt: new Date().toISOString()
  };

  await db.tx(['attachments', 'files'], 'readwrite', (stores) => {
    const [attStore, filesStore] = stores;
    attStore.put(att);
    filesStore.put({ id, blob: file });
  });

  notifyDataChanged('attachment');
  return att;
}

export async function addLinkAttachment({ fieldId, date, category = 'material', name = '', url }) {
  const teamLogId = `${fieldId}__${date}`;
  let log = await getTeamLog(fieldId, date);
  if (!log) {
    log = await saveTeamLog(fieldId, date, '');
  }

  const existingAtts = await listAttachments(teamLogId);
  if (existingAtts.length >= limits.MAX_ATTACHMENTS_PER_LOG) {
    throw { code: 'LIMIT_EXCEEDED', message: '일지 1개당 첨부는 최대 20개까지예요.' };
  }

  // 주소는 http/https 만, 2000자 이하만 허용한다
  let parsedUrl = null;
  try { parsedUrl = new URL(url); } catch {}
  if (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol) || url.length > limits.MAX_URL) {
    throw { code: 'VALIDATION', field: 'url', message: 'http:// 또는 https:// 로 시작하는 주소를 입력해 주세요' };
  }
  const finalName = (name.trim() || parsedUrl.hostname).slice(0, limits.MAX_LINK_NAME);

  const att = {
    id: newId(),
    teamLogId,
    fieldId,
    date,
    category: category === 'output' ? 'output' : 'material',
    kind: 'link',
    name: finalName,
    mimeType: '',
    size: 0,
    url,
    createdAt: new Date().toISOString()
  };

  await db.put('attachments', att);
  notifyDataChanged('attachment');
  return att;
}

export async function getFileBlob(id) {
  const rec = await db.get('files', id);
  return rec ? rec.blob : null;
}

export async function deleteAttachment(id) {
  await db.tx(['attachments', 'files'], 'readwrite', (stores) => {
    const [attStore, filesStore] = stores;
    attStore.delete(id);
    filesStore.delete(id);
  });
  notifyDataChanged('attachment');
}
