import { confirmDialog } from './modal.js';
import { toast } from './toast.js';
import { deleteDay, listFields, listTeamLogsByField, listAttachments } from '../store.js';

// 삭제 확인 문구를 만든다 (0인 항목은 뺀다)
// 예) "배운 내용, 느낀 점, 메모지 3장, 팀플 일지와 첨부 2개가 함께 삭제돼요. 되돌릴 수 없어요."
async function buildMessage(day) {
  const parts = ['배운 내용', '느낀 점'];
  const noteCount = day.growthNotes?.length || 0;
  if (noteCount > 0) parts.push(`메모지 ${noteCount}장`);
  try {
    const teamFields = (await listFields()).filter(f => f.type === 'team');
    const logs = (await Promise.all(teamFields.map(f => listTeamLogsByField(f.id)))).flat().filter(l => l.date === day.date);
    const attCount = (await Promise.all(logs.map(l => listAttachments(l.id)))).flat().length;
    if (logs.length > 0) parts.push(attCount > 0 ? `팀플 일지와 첨부 ${attCount}개` : '팀플 일지');
  } catch {}
  return `${parts.join(', ')}가 함께 삭제돼요. 되돌릴 수 없어요.`;
}

// 날짜 섹션 삭제 확인 → 삭제 → 토스트 → 홈으로 이동
export async function confirmDeleteDay(day) {
  const [, m, d] = day.date.split('-').map(Number);
  const ok = await confirmDialog({
    title: `${m}월 ${d}일 기록을 삭제할까요?`,
    message: await buildMessage(day),
    confirmLabel: '삭제',
    danger: true
  });
  if (!ok) return;
  try {
    await deleteDay(day.date);
    toast('삭제했어요');
    window.location.hash = '#/';
  } catch {
    toast('삭제하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
  }
}
