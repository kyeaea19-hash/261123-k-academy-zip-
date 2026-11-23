import { h, clear } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { renderGrowthNote, openAddNoteModal } from '../components/growthNote.js';
import { renderTeamLogCard } from '../components/teamLogCard.js';
import { cleanupAttachmentUrls } from '../components/attachmentList.js';
import { renderFieldChip } from '../components/fieldChip.js';
import { confirmDeleteDay } from '../components/dayDeleteDialog.js';
import { renderDayAiPanel } from '../components/aiPanel.js';
import { createAiSuggest } from '../components/aiSuggest.js';
import { toast } from '../components/toast.js';
import {
  getDay,
  createDay,
  updateDay,
  listDays,
  listFields,
  setDayFields,
} from '../store.js';
import {
  formatDateLong,
  todayKey,
  weekNumber
} from '../utils/date.js';
import { debounce } from '../utils/debounce.js';
import { formatTime } from '../utils/format.js';

let pendingFlushes = [];

// 대기 중인 저장을 모두 바로 실행한다
function flushAll() {
  for (const fn of pendingFlushes) {
    try { fn(); } catch {}
  }
}

// 탭이 숨겨지면 바로 저장한다
function onVisibilityChange() {
  if (document.visibilityState === 'hidden') flushAll();
}

// 화면을 떠날 때: 저장 마무리 + 첨부 썸네일 URL 해제
export function destroy() {
  flushAll();
  pendingFlushes = [];
  document.removeEventListener('visibilitychange', onVisibilityChange);
  cleanupAttachmentUrls();
}

export async function render(container, { date }) {
  clear(container);
  pendingFlushes = [];
  document.addEventListener('visibilitychange', onVisibilityChange);

  let day = await getDay(date);

  if (!day) {
    document.title = `${date} — 요약.zip`;
    const notFoundEl = h('div', { className: 'content-container section' }, [
      h('div', { className: 'empty-box' }, [
        h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, [`${date} 날짜 섹션이 없어요`]),
        h('p', { style: { color: 'var(--color-graphite)' } }, ['이 날짜의 기록을 시작하려면 섹션을 먼저 만들어 주세요.']),
        h('div', { style: { display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' } }, [
          h('button', {
            className: 'btn btn--ink',
            onClick: async () => {
              await createDay(date);
              render(container, { date });
            }
          }, ['이 날짜 만들기']),
          h('a', { href: '#/', className: 'btn btn--outline-ink' }, ['홈으로'])
        ])
      ])
    ]);
    container.appendChild(notFoundEl);
    return;
  }

  document.title = `${date} 하루 기록 — 요약.zip`;

  const [allDays, allFields] = await Promise.all([
    listDays(),
    listFields()
  ]);

  const currentIndex = allDays.findIndex(d => d.date === date);
  const prevDate = currentIndex > 0 ? allDays[currentIndex - 1].date : null;
  const nextDate = currentIndex < allDays.length - 1 ? allDays[currentIndex + 1].date : null;
  const dayNumber = currentIndex >= 0 ? currentIndex + 1 : 1;
  const weekNum = weekNumber(date, allDays[0]?.date || date);
  const isToday = date === todayKey();

  // 1. 머리 영역
  const breadcrumb = h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, [
    h('a', { href: '#/', style: { textDecoration: 'underline' } }, ['날짜별']),
    ' › ',
    h('span', {}, [`${weekNum}주차`])
  ]);

  const navControls = h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' } }, [
    h('button', {
      className: 'icon-btn',
      'aria-label': '이전 날짜 섹션',
      disabled: !prevDate,
      onClick: () => { if (prevDate) window.location.hash = `#/day/${prevDate}`; }
    }, [icon('chevronLeft', { size: 20 })]),
    prevDate ? h('span', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, [prevDate.slice(5)]) : null,
    nextDate ? h('span', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, [nextDate.slice(5)]) : null,
    h('button', {
      className: 'icon-btn',
      'aria-label': '다음 날짜 섹션',
      disabled: !nextDate,
      onClick: () => { if (nextDate) window.location.hash = `#/day/${nextDate}`; }
    }, [icon('chevronRight', { size: 20 })])
  ]);

  const topNavRow = h('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }
  }, [breadcrumb, navControls]);

  const eyebrow = h('div', {
    style: { fontSize: 'var(--fs-caption-bold)', color: 'var(--color-graphite)', marginBottom: 'var(--space-xxs)' }
  }, [`${dayNumber}일차 · ${weekNum}주차`]);

  const saveStatusEl = h('span', {
    className: 'save-status',
    'aria-live': 'polite',
    style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' }
  }, [day.updatedAt ? `저장됨 ${formatTime(day.updatedAt)}` : '']);

  const titleRow = h('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-lg)' }
  }, [
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' } }, [
      h('h1', { style: { fontSize: 'var(--fs-display-md)', fontWeight: '500' } }, [formatDateLong(date)]),
      isToday ? h('span', { className: 'badge' }, ['TODAY']) : null
    ]),
    saveStatusEl
  ]);

  // 2. 자동 저장 로직
  function setStatus(text, isError = false) {
    saveStatusEl.textContent = text;
    saveStatusEl.style.color = isError ? 'var(--color-bloom-deep)' : 'var(--color-graphite)';
  }

  // 필드 1개를 저장한다 (DB 값과 같으면 건너뜀)
  async function saveField(field, val) {
    if ((day[field] || '') === val) return;
    setStatus('저장 중…');
    try {
      const saved = await updateDay(date, { [field]: val });
      day[field] = saved[field];
      setStatus(`저장됨 ${formatTime(saved.updatedAt)}`);
      aiPanel?.refresh();
    } catch {
      setStatus('저장 실패 — 다시 시도', true);
      toast('저장하지 못했어요. 잠시 뒤 다시 입력해 주세요.', { type: 'error' });
    }
  }

  // 제목·배운 내용·느낀 점은 디바운스 타이머를 따로 둔다
  const savers = {
    title: debounce(v => saveField('title', v), 800),
    learned: debounce(v => saveField('learned', v), 800),
    reflection: debounce(v => saveField('reflection', v), 800)
  };
  const debouncedSave = (field, val) => savers[field](val);
  debouncedSave.flush = () => Promise.all(Object.values(savers).map(s => s.flush()));
  let aiPanel = null; // 섹션 D (아래에서 만든다)

  pendingFlushes.push(() => debouncedSave.flush());

  // 3. 섹션 A: 오늘의 기록
  const titleInput = h('input', {
    type: 'text',
    className: 'input',
    maxLength: 60,
    value: day.title || '',
    placeholder: '예) SMP 결정 원리와 전력거래소 역할',
    onInput: (e) => debouncedSave('title', e.target.value),
    onBlur: () => debouncedSave.flush()
  });

  const learnedTextarea = h('textarea', {
    className: 'textarea',
    maxLength: 5000,
    style: { minHeight: '160px' },
    placeholder: '오늘 배운 핵심 개념, 예시, 실습 내용을 정리해요',
    onInput: (e) => {
      learnedCounter.textContent = `${e.target.value.length}/5000`;
      debouncedSave('learned', e.target.value);
      aiSuggest?.update();
    },
    onBlur: () => debouncedSave.flush()
  }, [day.learned || '']);

  const learnedCounter = h('span', { className: 'form-hint' }, [`${(day.learned || '').length}/5000`]);

  const reflectionTextarea = h('textarea', {
    className: 'textarea',
    maxLength: 3000,
    style: { minHeight: '120px' },
    placeholder: '어려웠던 점, 새로 알게 된 점, 소감을 적어요',
    onInput: (e) => {
      reflectionCounter.textContent = `${e.target.value.length}/3000`;
      debouncedSave('reflection', e.target.value);
    },
    onBlur: () => debouncedSave.flush()
  }, [day.reflection || '']);

  const reflectionCounter = h('span', { className: 'form-hint' }, [`${(day.reflection || '').length}/3000`]);

  const sectionA = h('section', { className: 'card--feature', style: { marginBottom: 'var(--space-xxl)' } }, [
    h('div', { className: 'form-group' }, [
      h('label', { className: 'form-label' }, ['제목 (선택)']),
      titleInput
    ]),
    h('div', { className: 'form-group' }, [
      h('label', { className: 'form-label' }, ['배운 내용']),
      learnedTextarea,
      learnedCounter
    ]),
    h('div', { className: 'form-group' }, [
      h('label', { className: 'form-label' }, ['느낀 점']),
      reflectionTextarea,
      reflectionCounter
    ])
  ]);

  // 4. 섹션 B: 성장 기록 메모지
  const notesContainer = h('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 'var(--space-xl)',
      marginTop: 'var(--space-md)'
    }
  });

  const notesCountSpan = h('span', { style: { color: 'var(--color-graphite)', fontWeight: '400' } });

  function renderNotesList() {
    clear(notesContainer);
    aiPanel?.refresh();
    const notes = day.growthNotes || [];
    notesCountSpan.textContent = `(${notes.length}/30)`;

    notes.forEach((n, idx) => {
      const noteEl = renderGrowthNote(n, {
        date,
        index: idx,
        onUpdate: async () => {
          day = await getDay(date);
          renderNotesList();
        }
      });
      notesContainer.appendChild(noteEl);
    });

    if (notes.length < 30) {
      const addNoteBtn = h('button', {
        className: 'note-placeholder',
        onClick: () => openAddNoteModal(date, async () => {
          day = await getDay(date);
          renderNotesList();
        })
      }, [
        icon('plus', { size: 24 }),
        h('span', { style: { fontWeight: '500' } }, ['메모지 추가'])
      ]);
      notesContainer.appendChild(addNoteBtn);
    }
  }

  renderNotesList();

  const sectionB = h('section', { style: { marginBottom: 'var(--space-xxl)' } }, [
    h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 'var(--space-xs)' } }, [
      h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['성장 기록 메모지']),
      notesCountSpan
    ]),
    h('p', { style: { color: 'var(--color-graphite)', fontSize: 'var(--fs-caption-md)', marginTop: 'var(--space-xxs)' } }, [
      '새로 생긴 관심, 궁금한 점, 다짐을 메모지로 붙여요'
    ]),
    notesContainer
  ]);

  // 5. 섹션 C: 분야 태그
  const fieldsContainer = h('div', {
    style: { display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-sm)' }
  });

  const sectionEContainer = h('div', {});

  function updateSectionE() {
    clear(sectionEContainer);
    const dayFieldIds = new Set(day.fieldIds || []);
    const teamFields = allFields.filter(f => f.type === 'team' && dayFieldIds.has(f.id));

    teamFields.forEach(tf => {
      const cardSlot = h('div', {});
      renderTeamLogCard(cardSlot, {
        field: tf,
        date,
        onFlush: (fn) => pendingFlushes.push(fn)
      });
      sectionEContainer.appendChild(cardSlot);
    });
  }

  function renderFieldChips() {
    clear(fieldsContainer);
    const dayFieldIds = new Set(day.fieldIds || []);

    allFields.forEach(f => {
      const isTagged = dayFieldIds.has(f.id);
      // 칩 클릭 = 즉시 붙이기/떼기 (디바운스 없음)
      const chip = renderFieldChip(f, {
        selected: isTagged,
        onClick: async () => {
          const nextIds = isTagged
            ? (day.fieldIds || []).filter(id => id !== f.id)
            : [...(day.fieldIds || []), f.id];
          try {
            await setDayFields(date, nextIds);
          } catch {
            toast('분야 태그를 저장하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
            return;
          }
          day.fieldIds = nextIds;
          renderFieldChips();
          updateSectionE();
          aiSuggest.update();
        }
      });
      if (f.type === 'team') chip.appendChild(icon('users', { size: 14 }));
      fieldsContainer.appendChild(chip);
    });
  }

  // AI 분야 추천 (배운 내용은 아직 저장 전일 수 있어 입력창 값을 쓴다)
  let aiSuggest = null;
  aiSuggest = createAiSuggest({
    getDay: () => ({ ...day, title: titleInput.value, learned: learnedTextarea.value }),
    getFields: () => allFields,
    flush: () => debouncedSave.flush(),
    onAttach: async (ids) => {
      const nextIds = [...(day.fieldIds || []), ...ids.filter(id => !(day.fieldIds || []).includes(id))];
      await setDayFields(date, nextIds);
      day.fieldIds = nextIds;
      renderFieldChips();
      updateSectionE();
      toast(`분야 ${ids.length}개를 붙였어요.`);
    }
  });

  renderFieldChips();
  updateSectionE();

  const sectionC = h('section', { style: { marginBottom: 'var(--space-xxl)' } }, [
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['분야 태그']),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' } }, [
        aiSuggest.button,
        h('a', { href: '#/fields', className: 'btn btn--text' }, ['+ 새 분야'])
      ])
    ]),
    fieldsContainer,
    aiSuggest.box
  ]);

  // 섹션 D: AI 하루 요약
  const sectionD = h('div', { style: { marginBottom: 'var(--space-xxl)' } });
  aiPanel = renderDayAiPanel(sectionD, { date, flush: () => debouncedSave.flush() });

  // 6. 삭제 버튼 (화면 맨 아래)
  const deleteBtn = h('button', {
    type: 'button',
    className: 'btn btn--danger btn--sm',
    onClick: () => confirmDeleteDay(day)
  }, ['이 날짜 삭제']);

  const bottomRow = h('div', {
    style: { display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-xxl)' }
  }, [deleteBtn]);

  const wrapper = h('div', { className: 'content-container section' }, [
    topNavRow,
    eyebrow,
    titleRow,
    sectionA,
    sectionB,
    sectionC,
    sectionD,
    sectionEContainer,
    bottomRow
  ]);

  container.appendChild(wrapper);
}
