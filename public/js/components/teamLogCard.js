import { h, clear } from '../utils/dom.js';
import { getTeamLog, saveTeamLog } from '../store.js';
import { renderAttachmentList } from './attachmentList.js';
import { debounce } from '../utils/debounce.js';
import { formatTime } from '../utils/format.js';
import { toast } from './toast.js';
import { MAX_PROGRESS } from '../constants.js';

// 하루 기록 화면 섹션 E — 팀플 분야 1개의 일지 카드를 그린다
export async function renderTeamLogCard(container, { field, date, onFlush = null }) {
  clear(container);

  let savedProgress = '';
  let updatedAt = null;
  try {
    const teamLog = await getTeamLog(field.id, date);
    savedProgress = teamLog?.progress || '';
    updatedAt = teamLog?.updatedAt || null;
  } catch {
    container.appendChild(h('p', { className: 'form-error' }, [`${field.name} 일지를 불러오지 못했어요. 새로고침해 주세요.`]));
    return;
  }

  const textareaId = `team-progress-${field.id}`;
  const statusEl = h('span', { className: 'save-status', 'aria-live': 'polite' }, [updatedAt ? `저장됨 ${formatTime(updatedAt)}` : '']);
  const counter = h('span', { className: 'form-hint' }, [`${savedProgress.length}/${MAX_PROGRESS}`]);
  let lastValue = savedProgress;

  // 저장 상태 글자를 바꾼다
  function setStatus(text, isError = false) {
    clear(statusEl);
    statusEl.style.color = isError ? 'var(--color-bloom-deep)' : 'var(--color-graphite)';
    if (isError) {
      statusEl.appendChild(h('button', { type: 'button', className: 'btn btn--text', onClick: () => save(lastValue) }, [text]));
    } else {
      statusEl.textContent = text;
    }
  }

  // 진행 내용을 저장한다 (DB 값과 같으면 건너뜀, 일지가 없으면 store 가 새로 만듦)
  async function save(val) {
    lastValue = val;
    if (val === savedProgress) return;
    setStatus('저장 중…');
    try {
      const rec = await saveTeamLog(field.id, date, val);
      savedProgress = rec.progress;
      setStatus(`저장됨 ${formatTime(rec.updatedAt)}`);
    } catch {
      setStatus('저장 실패 — 다시 시도', true);
      toast('팀플 일지를 저장하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
    }
  }

  const debouncedSave = debounce(save, 800);
  if (onFlush) onFlush(() => debouncedSave.flush());

  const textarea = h('textarea', {
    id: textareaId,
    className: 'textarea',
    maxLength: MAX_PROGRESS,
    style: { minHeight: '96px' },
    placeholder: '오늘 팀에서 진행한 내용, 회의 결과, 내 할 일을 적어요',
    onInput: (e) => {
      counter.textContent = `${e.target.value.length}/${MAX_PROGRESS}`;
      lastValue = e.target.value;
      debouncedSave(e.target.value);
    },
    onBlur: () => debouncedSave.flush()
  }, [savedProgress]);

  const header = h('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }
  }, [
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' } }, [
      h('span', { className: 'badge badge--team' }, ['팀플']),
      h('h3', { style: { fontSize: 'var(--fs-display-xs)', fontWeight: '500' } }, [field.name])
    ]),
    h('a', { href: `#/fields/${field.id}`, className: 'btn btn--text' }, ['팀플 전체 보기 →'])
  ]);

  const attsContainer = h('div', { style: { marginTop: 'var(--space-lg)' } });

  const card = h('section', {
    className: 'card team-card',
    'aria-label': `${field.name} 팀플 일지`,
    style: { padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }
  }, [
    header,
    h('div', { className: 'form-group' }, [
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } }, [
        h('label', { className: 'form-label', htmlFor: textareaId }, ['오늘 진행 내용']),
        statusEl
      ]),
      textarea,
      counter
    ]),
    attsContainer
  ]);

  renderAttachmentList(attsContainer, { fieldId: field.id, date, dropTarget: card });
  container.appendChild(card);
}
