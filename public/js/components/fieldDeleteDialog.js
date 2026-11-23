import { confirmDialog } from './modal.js';
import { toast } from './toast.js';
import { deleteField, listDays, listTeamLogsByField, listAttachmentsByField } from '../store.js';

// 분야 삭제 확인 → 삭제 → 토스트. 삭제했으면 true 를 돌려준다
// 예) 팀플: "'팀플-수요예측' 팀플을 삭제할까요? 팀 정보, 팀플 일지 6개, 첨부 9개가 함께 삭제되고 되돌릴 수 없어요."
export async function confirmDeleteField(field) {
  let message;
  try {
    if (field.type === 'team') {
      const [logs, atts] = await Promise.all([listTeamLogsByField(field.id), listAttachmentsByField(field.id)]);
      message = `'${field.name}' 팀플을 삭제할까요? 팀 정보, 팀플 일지 ${logs.length}개, 첨부 ${atts.length}개가 함께 삭제되고 되돌릴 수 없어요.`;
    } else {
      const days = await listDays();
      const count = days.filter(d => (d.fieldIds || []).includes(field.id)).length;
      message = `'${field.name}' 분야를 삭제할까요? ${count}개 날짜에서 이 태그가 빠져요. 기록 자체는 지워지지 않아요.`;
    }
  } catch {
    toast('삭제 정보를 불러오지 못했어요. 다시 시도해 주세요.', { type: 'error' });
    return false;
  }

  const ok = await confirmDialog({ title: `${field.name} 삭제`, message, confirmLabel: '삭제', danger: true });
  if (!ok) return false;

  try {
    await deleteField(field.id);
    toast('분야를 삭제했어요.');
    return true;
  } catch {
    toast('분야를 삭제하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
    return false;
  }
}
