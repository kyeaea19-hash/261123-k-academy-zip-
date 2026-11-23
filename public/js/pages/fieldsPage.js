import { h, clear } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { renderGrowthNote } from '../components/growthNote.js';
import {
  listFields,
  listDays,
  moveField,
  listAttachmentsByField
} from '../store.js';
import { openFieldModal } from '../components/fieldModal.js';
import { confirmDeleteField } from '../components/fieldDeleteDialog.js';
import { formatDateCard } from '../utils/date.js';

const COLOR_MAP = {
  blue: 'var(--color-primary)',
  navy: 'var(--color-primary-deep)',
  teal: 'var(--color-storm-deep)',
  sea: 'var(--color-storm-sea)',
  brick: 'var(--color-bloom-deep)',
  charcoal: 'var(--color-charcoal)'
};

// 다른 화면(분야 상세)이 쓰던 이름을 그대로 내보낸다
export { openFieldModal };

// 분야 목록 및 성장 보드 화면 렌더링
export async function render(container, params = {}) {
  clear(container);
  const activeTab = params.tab || 'list'; // 'list' 또는 'board'

  document.title = activeTab === 'board' ? '성장 보드 — 요약.zip' : '분야별 정리 — 요약.zip';

  const [fields, days] = await Promise.all([
    listFields(),
    listDays()
  ]);

  // 팀플 분야별 첨부 개수 (카드의 `첨부 N개`)
  const attCountByField = new Map();
  await Promise.all(fields.filter(f => f.type === 'team').map(async f => {
    try {
      attCountByField.set(f.id, (await listAttachmentsByField(f.id)).length);
    } catch {
      attCountByField.set(f.id, 0);
    }
  }));

  // 상단 헤더 영역
  const headerRow = h('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }
  }, [
    h('div', {}, [
      h('h1', { style: { fontSize: 'var(--fs-display-md)', fontWeight: '500' } }, ['분야별 정리']),
      h('p', { style: { color: 'var(--color-charcoal)', marginTop: 'var(--space-xxs)' } }, [
        '기록을 내가 정한 분야로 나눠 모아 봐요'
      ])
    ]),
    h('button', {
      className: 'btn btn--primary',
      onClick: () => {
        if (fields.length >= 50) {
          toast('분야는 50개까지 만들 수 있어요.', { type: 'error' });
          return;
        }
        openFieldModal(null, () => render(container, params));
      }
    }, ['+ 분야 만들기'])
  ]);

  // 탭 네비게이션
  const tabs = h('div', { style: { display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-xl)' } }, [
    h('a', {
      href: '#/fields',
      className: `tab ${activeTab === 'list' ? 'tab--active' : ''}`
    }, ['분야 목록']),
    h('a', {
      href: '#/fields?tab=board',
      className: `tab ${activeTab === 'board' ? 'tab--active' : ''}`
    }, ['성장 보드'])
  ]);

  // ==================== 1. 분야 목록 탭 ====================
  function renderFieldsList() {
    if (fields.length === 0) {
      return h('div', { className: 'empty-box' }, [
        h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['아직 분야가 없어요']),
        h('p', { style: { color: 'var(--color-graphite)' } }, ['예) 전력시장 기초, 파이썬, 팀플-수요예측']),
        h('button', {
          className: 'btn btn--ink',
          style: { marginTop: 'var(--space-md)' },
          onClick: () => openFieldModal(null, () => render(container, params))
        }, ['분야 만들기'])
      ]);
    }

    const cards = fields.map((f, idx) => {
      // 해당 분야가 붙은 날짜들
      const taggedDays = days.filter(d => (d.fieldIds || []).includes(f.id));
      const recordCount = taggedDays.length;
      const noteCount = taggedDays.reduce((acc, d) => acc + (d.growthNotes?.length || 0), 0);
      const lastDate = taggedDays.length > 0 ? taggedDays[taggedDays.length - 1].date.slice(5).replace('-', '.') : '기록 없음';

      // 카드 위쪽 4px 분야 색상 띠
      const topStripe = h('div', {
        style: {
          height: '4px',
          backgroundColor: COLOR_MAP[f.color] || COLOR_MAP.blue,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          margin: '-24px -24px 16px -24px'
        }
      });

      // 도구 버튼: 수정, 위로, 아래로, 삭제
      const toolRow = h('div', {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '2px',
          borderTop: '1px solid var(--color-hairline)',
          paddingTop: 'var(--space-xs)',
          marginTop: 'var(--space-md)'
        }
      }, [
        h('button', {
          className: 'icon-btn',
          'aria-label': `${f.name} 수정`,
          onClick: (e) => {
            e.stopPropagation();
            openFieldModal(f, () => render(container, params));
          }
        }, [icon('edit', { size: 16 })]),
        h('button', {
          className: 'icon-btn',
          'aria-label': `${f.name} 위로 이동`,
          disabled: idx === 0,
          onClick: async (e) => {
            e.stopPropagation();
            await moveField(f.id, 'up');
            render(container, params);
          }
        }, [icon('arrowUp', { size: 16 })]),
        h('button', {
          className: 'icon-btn',
          'aria-label': `${f.name} 아래로 이동`,
          disabled: idx === fields.length - 1,
          onClick: async (e) => {
            e.stopPropagation();
            await moveField(f.id, 'down');
            render(container, params);
          }
        }, [icon('arrowDown', { size: 16 })]),
        h('button', {
          className: 'icon-btn',
          style: { color: 'var(--color-bloom-deep)' },
          'aria-label': `${f.name} 삭제`,
          onClick: async (e) => {
            e.stopPropagation();
            if (await confirmDeleteField(f)) render(container, params);
          }
        }, [icon('trash', { size: 16 })])
      ]);

      const content = h('a', {
        href: `#/fields/${f.id}`,
        style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', textDecoration: 'none', color: 'inherit', flex: 1 }
      }, [
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
          h('h2', { style: { fontSize: 'var(--fs-display-xs)', fontWeight: '500' } }, [f.name]),
          f.type === 'team' ? h('span', { className: 'badge badge--team' }, ['팀플']) : null
        ]),
        f.type === 'team' ? h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, [
          h('p', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, [
            `주제: ${f.team?.topic || '미입력'}`
          ]),
          h('p', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, [
            `내 역할: ${f.team?.role || '미입력'}`
          ]),
          h('p', { style: { marginTop: 'var(--space-xxs)' } }, [
            `기록 ${recordCount}일 · 첨부 ${attCountByField.get(f.id) || 0}개`
          ])
        ]) : h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, [
          h('p', {}, [`기록 ${recordCount}일`]),
          h('p', {}, [`메모지 ${noteCount}장`]),
          h('p', {}, [lastDate === '기록 없음' ? lastDate : `최근 ${lastDate}`])
        ])
      ]);

      return h('div', {
        className: 'card',
        style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }
      }, [
        topStripe,
        content,
        toolRow
      ]);
    });

    return h('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 'var(--gutter)'
      }
    }, cards);
  }

  // ==================== 2. 성장 보드 탭 ====================
  function renderGrowthBoard() {
    const currentKind = params.kind || 'all';

    const kindTabs = h('div', { style: { display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' } }, [
      { id: 'all', label: '전체' },
      { id: 'interest', label: '관심' },
      { id: 'question', label: '궁금' },
      { id: 'pledge', label: '다짐' }
    ].map(k => {
      return h('a', {
        href: k.id === 'all' ? '#/fields?tab=board' : `#/fields?tab=board&kind=${k.id}`,
        className: `tab ${currentKind === k.id ? 'tab--active' : ''}`
      }, [k.label]);
    }));

    // 모든 날짜의 메모지 수집 (날짜 최신순)
    const reversedDays = [...days].reverse();
    const dayGroups = [];

    for (const d of reversedDays) {
      let notes = d.growthNotes || [];
      if (currentKind !== 'all') {
        notes = notes.filter(n => n.kind === currentKind);
      }
      if (notes.length === 0) continue;

      const groupHead = h('div', {
        style: { borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-xs)', marginBottom: 'var(--space-md)' }
      }, [
        h('a', {
          href: `#/day/${d.date}`,
          style: { fontSize: 'var(--fs-body-lg)', fontWeight: '500', textDecoration: 'underline' }
        }, [`${formatDateCard(d.date)} 기록 보러 가기`])
      ]);

      const noteCards = notes.map((n, idx) => renderGrowthNote(n, {
        date: d.date,
        index: idx,
        readOnly: true
      }));

      const grid = h('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)'
        }
      }, noteCards);

      dayGroups.push(h('div', {}, [groupHead, grid]));
    }

    if (dayGroups.length === 0) {
      return h('div', {}, [
        kindTabs,
        h('div', { className: 'empty-box' }, [
          h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['아직 메모지가 없어요']),
          h('p', { style: { color: 'var(--color-graphite)' } }, ['하루 기록 화면에서 메모지를 붙여 보세요.'])
        ])
      ]);
    }

    return h('div', {}, [
      kindTabs,
      ...dayGroups
    ]);
  }

  const contentEl = activeTab === 'board' ? renderGrowthBoard() : renderFieldsList();

  container.appendChild(h('div', { className: 'container section' }, [
    headerRow,
    tabs,
    contentEl
  ]));
}
