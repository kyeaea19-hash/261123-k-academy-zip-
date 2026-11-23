import { h } from '../utils/dom.js';
import { icon } from './icons.js';
import { openModal, confirmDialog } from './modal.js';
import { toast } from './toast.js';
import { addNote, updateNote, deleteNote } from '../store.js';

const TILT_VALS = ['-1deg', '0.5deg', '-0.5deg', '1deg'];

// 성장 기록 메모지 렌더러
export function renderGrowthNote(note, { date, onUpdate, index = 0, readOnly = false } = {}) {
  let isEditing = false;
  let cardEl = null;

  const tilt = TILT_VALS[index % TILT_VALS.length];

  // 1. 읽기 모드 뷰
  function createViewEl() {
    const kindLabels = {
      interest: { label: '관심', iconName: 'bulb' },
      question: { label: '궁금', iconName: 'question' },
      pledge: { label: '다짐', iconName: 'flag' }
    };
    const kInfo = kindLabels[note.kind] || kindLabels.interest;

    const kindHeader = h('div', {
      style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-caption-bold)' }
    }, [
      icon(kInfo.iconName, { size: 16 }),
      kInfo.label
    ]);

    const content = h('div', {
      style: {
        fontSize: 'var(--fs-body-md)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 'var(--space-sm) 0',
        flex: 1
      }
    }, [note.text]);

    const actions = [];
    if (!readOnly) {
      actions.push(
        h('button', {
          className: 'icon-btn',
          style: { width: '32px', height: '32px' },
          'aria-label': '메모지 수정',
          onClick: (e) => {
            e.stopPropagation();
            switchToEdit();
          }
        }, [icon('edit', { size: 16 })]),
        h('button', {
          className: 'icon-btn',
          style: { width: '32px', height: '32px', color: 'var(--color-bloom-deep)' },
          'aria-label': '메모지 삭제',
          onClick: async (e) => {
            e.stopPropagation();
            const ok = await confirmDialog({
              title: '메모지 삭제',
              message: '이 메모지를 삭제할까요?',
              danger: true
            });
            if (ok) {
              await deleteNote(date, note.id);
              toast('메모지를 삭제했어요.');
              if (onUpdate) onUpdate();
            }
          }
        }, [icon('trash', { size: 16 })])
      );
    }

    const timeStr = note.createdAt ? note.createdAt.slice(11, 16) : '';
    const footer = h('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--fs-caption-sm)', color: 'var(--color-graphite)' }
    }, [
      h('span', {}, [timeStr]),
      h('div', { style: { display: 'flex', gap: '2px' } }, actions)
    ]);

    const el = h('div', {
      className: `note note--${note.color || 'blue'}`,
      style: { '--tilt': tilt, cursor: readOnly ? 'default' : 'pointer' },
      tabIndex: readOnly ? -1 : 0,
      onClick: () => {
        if (!readOnly && !isEditing) switchToEdit();
      },
      onKeyDown: (e) => {
        if (!readOnly && !isEditing && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          switchToEdit();
        }
      }
    }, [
      kindHeader,
      content,
      footer
    ]);

    return el;
  }

  // 2. 편집 모드 뷰
  function createEditEl() {
    let currentKind = note.kind || 'interest';
    let currentColor = note.color || 'blue';

    // 종류 선택 라디오
    const kindBtns = [
      { id: 'interest', label: '관심' },
      { id: 'question', label: '궁금' },
      { id: 'pledge', label: '다짐' }
    ].map(k => {
      const btn = h('button', {
        type: 'button',
        className: `btn btn--sm ${currentKind === k.id ? 'btn--ink' : 'btn--outline-ink'}`,
        onClick: () => {
          currentKind = k.id;
          kindBtns.forEach(b => b.className = 'btn btn--sm btn--outline-ink');
          btn.className = 'btn btn--sm btn--ink';
        }
      }, [k.label]);
      return btn;
    });

    const kindRow = h('div', { style: { display: 'flex', gap: '4px', marginBottom: 'var(--space-xs)' } }, kindBtns);

    // 색상 선택 스와치
    const colorSwatches = [
      { id: 'blue', colorVar: 'var(--color-primary-soft)' },
      { id: 'rose', colorVar: 'var(--color-bloom-rose)' },
      { id: 'mist', colorVar: 'var(--color-storm-mist)' },
      { id: 'fog', colorVar: 'var(--color-fog)' }
    ].map(c => {
      const swatch = h('button', {
        type: 'button',
        'aria-label': c.id,
        style: {
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: c.colorVar,
          border: currentColor === c.id ? '2px solid var(--color-ink)' : '1px solid var(--color-steel)',
          cursor: 'pointer'
        },
        onClick: () => {
          currentColor = c.id;
          colorSwatches.forEach(s => s.style.border = '1px solid var(--color-steel)');
          swatch.style.border = '2px solid var(--color-ink)';
          editCard.className = `note note--${currentColor} note--editing`;
        }
      });
      return swatch;
    });

    const colorRow = h('div', { style: { display: 'flex', gap: '6px', marginBottom: 'var(--space-sm)' } }, colorSwatches);

    // 내용 텍스트 영역
    const textarea = h('textarea', {
      className: 'textarea',
      maxLength: 300,
      placeholder: '관심사, 궁금한 점, 다짐을 적어요',
      style: { minHeight: '90px', fontSize: 'var(--fs-body-md)' }
    }, [note.text || '']);

    const charCounter = h('span', {
      className: 'form-hint',
      style: { fontSize: 'var(--fs-caption-sm)' }
    }, [`${(note.text || '').length}/300`]);

    textarea.addEventListener('input', () => {
      charCounter.textContent = `${textarea.value.length}/300`;
    });

    // 버튼 저장 / 취소
    const saveBtn = h('button', {
      type: 'button',
      className: 'btn btn--ink btn--sm',
      onClick: async () => {
        const val = textarea.value.trim();
        if (!val) {
          toast('내용을 입력해 주세요.', { type: 'error' });
          return;
        }
        await updateNote(date, note.id, {
          text: val,
          kind: currentKind,
          color: currentColor
        });
        note.text = val;
        note.kind = currentKind;
        note.color = currentColor;
        switchToView();
        if (onUpdate) onUpdate();
      }
    }, ['저장']);

    const cancelBtn = h('button', {
      type: 'button',
      className: 'btn btn--outline-ink btn--sm',
      onClick: () => {
        switchToView();
      }
    }, ['취소']);

    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        saveBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
    });

    const editCard = h('div', {
      className: `note note--${currentColor} note--editing`,
      style: { '--tilt': '0deg' }
    }, [
      kindRow,
      colorRow,
      textarea,
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xs)' } }, [
        charCounter,
        h('div', { style: { display: 'flex', gap: '4px' } }, [cancelBtn, saveBtn])
      ])
    ]);

    requestAnimationFrame(() => textarea.focus());
    return editCard;
  }

  function switchToEdit() {
    isEditing = true;
    const newEl = createEditEl();
    cardEl.replaceWith(newEl);
    cardEl = newEl;
  }

  function switchToView() {
    isEditing = false;
    const newEl = createViewEl();
    cardEl.replaceWith(newEl);
    cardEl = newEl;
  }

  cardEl = createViewEl();
  return cardEl;
}

// 메모지 추가 모달을 연다 (저장되면 onAdded 호출)
export function openAddNoteModal(date, onAdded) {
  let kind = 'interest';
  let color = 'blue';

  const textInput = h('textarea', {
    className: 'textarea',
    maxLength: 300,
    placeholder: '관심사, 궁금한 점, 다짐을 적어요'
  });

  openModal({
    title: '메모지 추가',
    body: [
      h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['종류']),
        h('select', {
          className: 'select',
          onChange: (e) => { kind = e.target.value; }
        }, [
          h('option', { value: 'interest' }, ['관심 (전구)']),
          h('option', { value: 'question' }, ['궁금 (물음표)']),
          h('option', { value: 'pledge' }, ['다짐 (깃발)'])
        ])
      ]),
      h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['색상']),
        h('select', {
          className: 'select',
          onChange: (e) => { color = e.target.value; }
        }, [
          h('option', { value: 'blue' }, ['파랑']),
          h('option', { value: 'rose' }, ['분홍']),
          h('option', { value: 'mist' }, ['하늘']),
          h('option', { value: 'fog' }, ['회색'])
        ])
      ]),
      h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['내용']),
        textInput
      ])
    ],
    actions: [
      { label: '취소', className: 'btn btn--outline-ink', value: null },
      {
        label: '추가',
        className: 'btn btn--ink',
        onClick: async () => {
          const val = textInput.value.trim();
          if (!val) {
            toast('내용을 입력해 주세요.', { type: 'error' });
            return false;
          }
          await addNote(date, { kind, color, text: val });
          day = await getDay(date);
          renderNotesList();
          return true;
        }
      }
    ]
  });
}
