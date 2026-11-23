import { h, clear } from '../utils/dom.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { createField, updateField } from '../store.js';
import { openTeamInfoModal } from './teamInfoModal.js';

const COLOR_MAP = {
  blue: 'var(--color-primary)',
  navy: 'var(--color-primary-deep)',
  teal: 'var(--color-storm-deep)',
  sea: 'var(--color-storm-sea)',
  brick: 'var(--color-bloom-deep)',
  charcoal: 'var(--color-charcoal)'
};

// 분야 생성/수정 모달
export async function openFieldModal(targetField = null, onSaved = null) {
  const isEdit = Boolean(targetField);
  let nameInput;
  let selectedType = targetField?.type || 'general';
  let selectedColor = targetField?.color || 'blue';

  const colorOptions = ['blue', 'navy', 'teal', 'sea', 'brick', 'charcoal'];

  const body = () => {
    nameInput = h('input', {
      type: 'text',
      className: 'input',
      maxLength: 20,
      value: targetField?.name || '',
      placeholder: '예) 전력시장 기초'
    });

    // 종류 선택
    let typeRow = null;
    if (!isEdit) {
      const generalRadio = h('input', {
        type: 'radio',
        name: 'fieldType',
        id: 'type-general',
        checked: selectedType === 'general',
        onChange: () => { selectedType = 'general'; }
      });
      const teamRadio = h('input', {
        type: 'radio',
        name: 'fieldType',
        id: 'type-team',
        checked: selectedType === 'team',
        onChange: () => { selectedType = 'team'; }
      });

      typeRow = h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['종류']),
        h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' } }, [
          h('label', {
            htmlFor: 'type-general',
            className: 'card',
            style: { padding: 'var(--space-md)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'flex-start' }
          }, [
            generalRadio,
            h('div', {}, [
              h('div', { style: { fontWeight: '600' } }, ['일반']),
              h('div', { style: { fontSize: '13px', color: 'var(--color-graphite)' } }, ['기록을 주제별로 모아 봐요'])
            ])
          ]),
          h('label', {
            htmlFor: 'type-team',
            className: 'card',
            style: { padding: 'var(--space-md)', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'flex-start' }
          }, [
            teamRadio,
            h('div', {}, [
              h('div', { style: { fontWeight: '600' } }, ['팀플']),
              h('div', { style: { fontSize: '13px', color: 'var(--color-graphite)' } }, ['팀 정보와 날짜별 일지·첨부 관리'])
            ])
          ])
        ])
      ]);
    } else {
      typeRow = h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['종류']),
        h('p', { style: { fontSize: 'var(--fs-body-md)', color: 'var(--color-graphite)' } }, [
          targetField.type === 'team' ? '팀플 (변경 불가)' : '일반 (변경 불가)'
        ])
      ]);
    }

    // 색상 선택 스와치
    const swatches = colorOptions.map(c => {
      const btn = h('button', {
        type: 'button',
        'aria-label': c,
        style: {
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: COLOR_MAP[c],
          border: selectedColor === c ? '2px solid var(--color-ink)' : '1px solid var(--color-steel)',
          cursor: 'pointer'
        },
        onClick: () => {
          selectedColor = c;
          swatches.forEach(s => s.style.border = '1px solid var(--color-steel)');
          btn.style.border = '2px solid var(--color-ink)';
        }
      });
      return btn;
    });

    return [
      h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['분야 이름 (필수)']),
        nameInput
      ]),
      typeRow,
      h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['색상']),
        h('div', { style: { display: 'flex', gap: '8px', marginTop: 'var(--space-xxs)' } }, swatches)
      ])
    ];
  };

  openModal({
    title: isEdit ? '분야 수정' : '분야 만들기',
    body,
    actions: [
      { label: '취소', className: 'btn btn--outline-ink', value: null },
      {
        label: isEdit ? '저장' : '만들기',
        className: 'btn btn--ink',
        onClick: async () => {
          const nameVal = nameInput?.value.trim();
          if (!nameVal) {
            toast('분야 이름을 입력해 주세요.', { type: 'error' });
            return false;
          }

          try {
            if (isEdit) {
              await updateField(targetField.id, {
                name: nameVal,
                color: selectedColor
              });
              toast('분야를 수정했어요.');
            } else {
              const created = await createField({
                name: nameVal,
                type: selectedType,
                color: selectedColor
              });
              toast('분야를 만들었어요.');
              if (selectedType === 'team') {
                // 팀플이면 저장 직후 팀 정보 모달을 이어서 연다 (건너뛰기 가능)
                setTimeout(() => openTeamInfoModal(created, { skippable: true, onSaved }), 0);
              }
            }
            if (onSaved) onSaved();
            return true;
          } catch (err) {
            if (err.code === 'DUPLICATE') {
              toast('이미 있는 분야 이름이에요.', { type: 'error' });
            } else if (err.code === 'LIMIT_EXCEEDED') {
              toast('분야는 50개까지 만들 수 있어요.', { type: 'error' });
            } else {
              toast('분야 저장에 실패했어요.', { type: 'error' });
            }
            return false;
          }
        }
      }
    ]
  });
}
