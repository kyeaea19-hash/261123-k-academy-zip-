import { h } from '../utils/dom.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { getDay, createDay } from '../store.js';
import { todayKey, formatDateCard } from '../utils/date.js';

// `오늘 기록` 버튼: 오늘 섹션이 있으면 이동, 없으면 만들지 물어본 뒤 이동 (05 §2.5)
export async function goToday() {
  const today = todayKey();
  try {
    if (await getDay(today)) {
      window.location.hash = `#/day/${today}`;
      return;
    }
  } catch {
    toast('기록을 불러오지 못했어요. 새로고침해 주세요.', { type: 'error' });
    return;
  }
  await openModal({
    title: '오늘 날짜 섹션 만들기',
    body: [h('p', {}, [`오늘(${formatDateCard(today)}) 날짜 섹션이 없어요. 만들까요?`])],
    actions: [
      { label: '취소', className: 'btn btn--outline-ink', value: false },
      {
        label: '만들기',
        className: 'btn btn--ink',
        onClick: async () => {
          try {
            await createDay(today);
            window.location.hash = `#/day/${today}`;
            return true;
          } catch {
            toast('날짜 섹션을 만들지 못했어요. 다시 시도해 주세요.', { type: 'error' });
            return false;
          }
        }
      }
    ]
  });
}
