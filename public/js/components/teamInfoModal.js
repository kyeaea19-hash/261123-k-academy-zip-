import { h, clear } from '../utils/dom.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { updateField } from '../store.js';
import {
  MAX_TEAM_TOPIC, MAX_TEAM_ROLE, MAX_TEAM_GOAL, MAX_TEAM_PURPOSE,
  MAX_TEAM_MEMBERS, MAX_MEMBER_NAME, MAX_TEAM_MEMO
} from '../constants.js';

// 라벨 + 입력창 묶음을 만든다
function group(label, inputEl) {
  return h('div', { className: 'form-group' }, [
    h('label', { className: 'form-label', htmlFor: inputEl.id }, [label]),
    inputEl
  ]);
}

/**
 * 팀 정보 입력/수정 모달을 연다.
 * - skippable: true 면 취소 버튼이 `건너뛰기` (팀플 분야를 막 만든 직후)
 * - 저장하면 onSaved() 호출, 결과로 true/false 를 돌려준다
 */
export async function openTeamInfoModal(field, { onSaved = null, skippable = false } = {}) {
  const t = field.team || {};
  const members = [...(t.members || [])];

  const topic = h('input', { id: 'team-topic', type: 'text', className: 'input', maxLength: MAX_TEAM_TOPIC, value: t.topic || '', placeholder: '예) 전력 수요예측 대시보드' });
  const role = h('input', { id: 'team-role', type: 'text', className: 'input', maxLength: MAX_TEAM_ROLE, value: t.role || '', placeholder: '예) 데이터 전처리 · 시각화' });
  const goal = h('textarea', { id: 'team-goal', className: 'textarea', maxLength: MAX_TEAM_GOAL, style: { minHeight: '80px' }, placeholder: '이 팀플로 만들어 낼 결과' }, [t.goal || '']);
  const purpose = h('textarea', { id: 'team-purpose', className: 'textarea', maxLength: MAX_TEAM_PURPOSE, style: { minHeight: '80px' }, placeholder: '이 팀플을 하는 이유, 배우고 싶은 것' }, [t.purpose || '']);
  const start = h('input', { id: 'team-start', type: 'date', className: 'input', value: t.startDate || '' });
  const end = h('input', { id: 'team-end', type: 'date', className: 'input', value: t.endDate || '' });
  const memo = h('textarea', { id: 'team-memo', className: 'textarea', maxLength: MAX_TEAM_MEMO, style: { minHeight: '80px' }, placeholder: '회의 시간, 저장소 주소 등 자유 메모' }, [t.memo || '']);

  const chips = h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'var(--space-xs)' } });
  const memberInput = h('input', {
    id: 'team-member', type: 'text', className: 'input', maxLength: MAX_MEMBER_NAME, placeholder: '이름 입력 후 Enter',
    onKeyDown: (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        addMember();
      }
    }
  });

  // 팀원 칩 목록을 다시 그린다
  function renderChips() {
    clear(chips);
    members.forEach((name, idx) => {
      chips.appendChild(h('span', { className: 'member-pill member-pill--light' }, [
        name,
        h('button', {
          type: 'button',
          className: 'member-pill__remove',
          'aria-label': `${name} 삭제`,
          onClick: () => { members.splice(idx, 1); renderChips(); memberInput.focus(); }
        }, ['✕'])
      ]));
    });
  }

  // 입력창의 이름을 팀원으로 추가한다 (공백·중복·10명 초과는 안내만)
  function addMember() {
    const name = memberInput.value.trim();
    if (!name) {
      toast('팀원 이름을 입력해 주세요.', { type: 'error' });
      return;
    }
    if (members.includes(name)) {
      toast('이미 추가한 팀원이에요. 다른 이름을 입력해 주세요.', { type: 'error' });
      return;
    }
    if (members.length >= MAX_TEAM_MEMBERS) {
      toast(`팀원은 ${MAX_TEAM_MEMBERS}명까지 추가할 수 있어요.`, { type: 'error' });
      return;
    }
    members.push(name);
    memberInput.value = '';
    renderChips();
  }
  renderChips();

  const memberRow = h('div', { className: 'form-group' }, [
    h('label', { className: 'form-label', htmlFor: 'team-member' }, [`팀원 (최대 ${MAX_TEAM_MEMBERS}명)`]),
    h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } }, [
      memberInput,
      h('button', { type: 'button', className: 'btn btn--outline-ink', onClick: addMember }, ['추가'])
    ]),
    chips
  ]);

  const saved = await openModal({
    title: '팀 정보',
    body: [
      group('주제', topic),
      group('내 역할', role),
      group('목표', goal),
      group('목적', purpose),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' } }, [
        group('시작일', start),
        group('종료일', end)
      ]),
      memberRow,
      group('메모', memo)
    ],
    actions: [
      { label: skippable ? '건너뛰기' : '취소', className: 'btn btn--outline-ink', value: false },
      {
        label: '저장',
        className: 'btn btn--ink',
        value: true,
        onClick: async () => {
          const startDate = start.value || null;
          const endDate = end.value || null;
          if (startDate && endDate && endDate < startDate) {
            toast('종료일은 시작일과 같거나 뒤여야 해요. 날짜를 다시 골라 주세요.', { type: 'error' });
            end.focus();
            return false;
          }
          try {
            await updateField(field.id, {
              team: {
                topic: topic.value.trim(),
                role: role.value.trim(),
                goal: goal.value.trim(),
                purpose: purpose.value.trim(),
                startDate,
                endDate,
                members: [...members],
                memo: memo.value.trim()
              }
            });
            toast('팀 정보를 저장했어요.');
            return true;
          } catch {
            toast('팀 정보를 저장하지 못했어요. 다시 시도해 주세요.', { type: 'error' });
            return false;
          }
        }
      }
    ]
  });

  if (saved && onSaved) onSaved();
  return Boolean(saved);
}
