import { h } from '../utils/dom.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { saveCourse, generateDays } from '../store.js';
import { listDateRange, isValidDateKey } from '../utils/date.js';

// 첫 실행 온보딩 모달 ("과정 설정")
export async function showOnboardingModal() {
  return new Promise((resolve) => {
    let nameInput, startInput, endInput, weekendCheck, previewEl;

    function updatePreview() {
      const sVal = startInput?.value;
      const eVal = endInput?.value;
      if (!sVal || !eVal || !isValidDateKey(sVal) || !isValidDateKey(eVal) || eVal < sVal) {
        if (previewEl) previewEl.textContent = '';
        return;
      }
      try {
        const inc = Boolean(weekendCheck?.checked);
        const dates = listDateRange(sVal, eVal, { includeWeekends: inc });
        const label = inc ? '주말 포함' : '평일';
        if (previewEl) {
          previewEl.textContent = `${label} ${dates.length}일의 날짜 섹션이 만들어져요.`;
        }
      } catch (err) {
        if (previewEl) previewEl.textContent = '';
      }
    }

    const body = (close) => {
      nameInput = h('input', {
        type: 'text',
        className: 'input',
        value: '전력시장 디지털 인재 아카데미',
        maxLength: 40,
        placeholder: '과정 이름을 입력해 주세요'
      });

      startInput = h('input', {
        type: 'date',
        className: 'input',
        onChange: updatePreview
      });

      endInput = h('input', {
        type: 'date',
        className: 'input',
        onChange: updatePreview
      });

      weekendCheck = h('input', {
        type: 'checkbox',
        id: 'onboard-weekends',
        onChange: updatePreview
      });

      previewEl = h('p', {
        className: 'form-hint',
        style: { color: 'var(--color-primary)', textAlign: 'left', marginTop: 'var(--space-xs)', fontWeight: '500' }
      });

      return [
        h('p', { style: { color: 'var(--color-charcoal)', marginBottom: 'var(--space-md)' } }, [
          '과정 기간을 넣으면 날짜 섹션을 자동으로 만들어 드려요.'
        ]),
        h('div', { className: 'form-group' }, [
          h('label', { className: 'form-label' }, ['과정 이름']),
          nameInput
        ]),
        h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' } }, [
          h('div', { className: 'form-group' }, [
            h('label', { className: 'form-label' }, ['시작일']),
            startInput
          ]),
          h('div', { className: 'form-group' }, [
            h('label', { className: 'form-label' }, ['종료일']),
            endInput
          ])
        ]),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: 'var(--space-xs)' } }, [
          weekendCheck,
          h('label', { htmlFor: 'onboard-weekends', style: { fontSize: 'var(--fs-body-md)', cursor: 'pointer' } }, ['주말 포함'])
        ]),
        previewEl
      ];
    };

    openModal({
      title: '요약.zip에 오신 걸 환영해요',
      body,
      actions: [
        {
          label: '나중에 할게요',
          className: 'btn btn--outline-ink',
          onClick: async () => {
            const courseName = nameInput?.value.trim() || '전력시장 디지털 인재 아카데미';
            await saveCourse({
              name: courseName,
              startDate: null,
              endDate: null,
              includeWeekends: false
            });
            resolve(false);
          }
        },
        {
          label: '시작하기',
          className: 'btn btn--ink',
          onClick: async () => {
            const courseName = nameInput?.value.trim();
            if (!courseName) {
              toast('과정 이름을 입력해 주세요.', { type: 'error' });
              return false;
            }
            const sVal = startInput?.value;
            const eVal = endInput?.value;
            if (!sVal || !eVal) {
              toast('시작일과 종료일을 모두 입력해 주세요.', { type: 'error' });
              return false;
            }
            if (eVal < sVal) {
              toast('종료일은 시작일과 같거나 뒤여야 해요.', { type: 'error' });
              return false;
            }

            try {
              const inc = Boolean(weekendCheck?.checked);
              await saveCourse({
                name: courseName,
                startDate: sVal,
                endDate: eVal,
                includeWeekends: inc
              });
              const count = await generateDays({
                startDate: sVal,
                endDate: eVal,
                includeWeekends: inc
              });
              toast(`날짜 섹션 ${count}개를 만들었어요.`);
              resolve(true);
            } catch (err) {
              toast('날짜 섹션 생성 중 오류가 발생했어요.', { type: 'error' });
              return false;
            }
          }
        }
      ]
    }).then(res => {
      if (res === null) {
        // 배경이나 Esc 닫기 시 '나중에 할게요' 동일 처리
        saveCourse({
          name: nameInput?.value.trim() || '전력시장 디지털 인재 아카데미',
          startDate: null,
          endDate: null,
          includeWeekends: false
        }).then(() => resolve(false));
      }
    });
  });
}
