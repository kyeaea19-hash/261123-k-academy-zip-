import { h, clear } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { openFieldModal } from './fieldsPage.js';
import { renderAttachmentList, cleanupAttachmentUrls } from '../components/attachmentList.js';
import { renderFieldAiPanel } from '../components/aiPanel.js';
import { openTeamInfoModal } from '../components/teamInfoModal.js';
import { confirmDeleteField } from '../components/fieldDeleteDialog.js';
import {
  getField,
  listDays,
  listTeamLogsByField,
  listAttachmentsByField
} from '../store.js';
import { formatDateCard, formatDateDot } from '../utils/date.js';

const COLOR_MAP = {
  blue: 'var(--color-primary)',
  navy: 'var(--color-primary-deep)',
  teal: 'var(--color-storm-deep)',
  sea: 'var(--color-storm-sea)',
  brick: 'var(--color-bloom-deep)',
  charcoal: 'var(--color-charcoal)'
};

// 화면을 떠날 때 첨부 썸네일 URL 을 해제한다
export function destroy() {
  cleanupAttachmentUrls();
}

// 분야 상세 화면 렌더링
export async function render(container, { id, sort = 'asc', filter = 'all' } = {}) {
  clear(container);

  const [field, allDays] = await Promise.all([
    getField(id),
    listDays()
  ]);

  if (!field) {
    document.title = '분야를 찾을 수 없어요 — 요약.zip';
    container.appendChild(h('div', { className: 'container section' }, [
      h('div', { className: 'empty-box' }, [
        h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['분야를 찾을 수 없어요']),
        h('a', { href: '#/fields', className: 'btn btn--ink', style: { marginTop: 'var(--space-md)' } }, ['분야 목록으로'])
      ])
    ]));
    return;
  }

  document.title = `${field.name} — 요약.zip`;

  let taggedDays = allDays.filter(d => (d.fieldIds || []).includes(field.id));
  if (sort === 'desc') {
    taggedDays = [...taggedDays].reverse();
  }

  // 날짜 → N일차 (전체 날짜 섹션 중 몇 번째인지)
  const dayNumberOf = new Map(allDays.map((d, i) => [d.date, i + 1]));
  const dateLabel = (key) => dayNumberOf.has(key) ? `${formatDateCard(key)} · ${dayNumberOf.get(key)}일차` : formatDateCard(key);

  const totalNotes = taggedDays.reduce((acc, d) => acc + (d.growthNotes?.length || 0), 0);

  // 상단 브레드크럼 및 제목
  const breadcrumb = h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)', marginBottom: 'var(--space-sm)' } }, [
    h('a', { href: '#/fields', style: { textDecoration: 'underline' } }, ['분야별']),
    ' › ',
    h('span', {}, [field.name])
  ]);

  const dot = h('span', {
    className: 'chip-dot',
    style: {
      width: '12px',
      height: '12px',
      backgroundColor: COLOR_MAP[field.color] || COLOR_MAP.blue,
      display: 'inline-block'
    }
  });

  const titleRow = h('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }
  }, [
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' } }, [
      dot,
      h('h1', { style: { fontSize: 'var(--fs-display-md)', fontWeight: '500' } }, [field.name]),
      field.type === 'team' ? h('span', { className: 'badge badge--team' }, ['팀플']) : null
    ]),
    h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } }, [
      h('button', {
        className: 'btn btn--outline-ink btn--sm',
        onClick: () => openFieldModal(field, () => render(container, { id, sort, filter }))
      }, ['수정']),
      h('button', {
        className: 'btn btn--danger btn--sm',
        onClick: async () => {
          if (await confirmDeleteField(field)) window.location.hash = '#/fields';
        }
      }, ['삭제'])
    ])
  ]);

  const metaRow = h('p', {
    style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)', marginBottom: 'var(--space-xl)' }
  }, [`기록 ${taggedDays.length}일 · 메모지 ${totalNotes}장`]);

  // ==================== 1. 일반 분야 모아보기 ====================
  function renderGeneralView() {
    const sortTabs = h('div', { style: { display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' } }, [
      h('a', {
        href: `#/fields/${field.id}?sort=asc`,
        className: `tab ${sort === 'asc' ? 'tab--active' : ''}`
      }, ['오래된 순']),
      h('a', {
        href: `#/fields/${field.id}?sort=desc`,
        className: `tab ${sort === 'desc' ? 'tab--active' : ''}`
      }, ['최신 순'])
    ]);

    if (taggedDays.length === 0) {
      return h('div', {}, [
        sortTabs,
        h('div', { className: 'empty-box' }, [
          h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['이 분야가 붙은 기록이 없어요']),
          h('p', { style: { color: 'var(--color-graphite)' } }, ['하루 기록 화면의 "분야 태그"에서 이 분야를 붙여 보세요.']),
          h('a', { href: '#/', className: 'btn btn--ink', style: { marginTop: 'var(--space-md)' } }, ['홈으로 이동'])
        ])
      ]);
    }

    const items = taggedDays.map(d => {
      let isExpanded = false;
      const dateLink = h('a', {
        href: `#/day/${d.date}`,
        style: { fontWeight: '600', fontSize: 'var(--fs-body-lg)', color: 'var(--color-ink)' }
      }, [`${dateLabel(d.date)} →`]);

      const titleEl = d.title ? h('h3', { style: { fontSize: 'var(--fs-body-md)', fontWeight: '500' } }, [d.title]) : null;

      const learnedContent = h('p', {
        style: {
          fontSize: 'var(--fs-body-md)',
          color: 'var(--color-charcoal)',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          display: '-webkit-box',
          WebkitLineClamp: '4',
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }
      }, [d.learned || '']);

      const expandBtn = (d.learned || '').length > 120 ? h('button', {
        type: 'button',
        className: 'btn btn--text',
        style: { alignSelf: 'flex-start', marginTop: '4px' },
        onClick: () => {
          isExpanded = !isExpanded;
          if (isExpanded) {
            learnedContent.style.display = 'block';
            expandBtn.textContent = '접기';
          } else {
            learnedContent.style.display = '-webkit-box';
            expandBtn.textContent = '펼치기';
          }
        }
      }, ['펼치기']) : null;

      const reflectionEl = d.reflection ? h('p', {
        style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)', fontStyle: 'italic', marginTop: 'var(--space-xs)' }
      }, [`느낀 점: ${d.reflection}`]) : null;

      return h('div', {
        className: 'card--compact',
        style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }
      }, [
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [dateLink, titleEl]),
        learnedContent,
        expandBtn,
        reflectionEl
      ]);
    });

    return h('div', {}, [sortTabs, ...items]);
  }

  // ==================== 2. 팀플 분야 뷰 ====================
  // 팀 정보 다크 패널 1줄 (라벨 + 값, 비었으면 "미입력")
  function infoRow(label, value) {
    const empty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
    let valueEl;
    if (empty) valueEl = h('span', { className: 'team-info__value team-info__value--empty' }, ['미입력']);
    else if (Array.isArray(value)) {
      valueEl = h('div', { className: 'team-info__value', style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        value.map(m => h('span', { className: 'member-pill' }, [m])));
    } else valueEl = h('span', { className: 'team-info__value' }, [value]);
    return [h('span', { className: 'team-info__label' }, [label]), valueEl];
  }

  // 긴 진행 내용은 6줄까지만 보이고 펼치기/접기 버튼을 단다
  function clampedProgress(text) {
    const p = h('p', { className: 'clamp-6', style: { whiteSpace: 'pre-wrap', color: 'var(--color-charcoal)', lineHeight: 'var(--lh-body)' } }, [text]);
    const btn = h('button', {
      type: 'button',
      className: 'btn btn--text',
      hidden: true,
      'aria-expanded': 'false',
      onClick: () => {
        const open = p.classList.toggle('clamp-6') === false;
        btn.textContent = open ? '접기' : '펼치기';
        btn.setAttribute('aria-expanded', String(open));
      }
    }, ['펼치기']);
    // 화면에 붙은 뒤 실제로 잘렸는지 확인해서 버튼을 보인다
    requestAnimationFrame(() => { if (p.scrollHeight > p.clientHeight + 1) btn.hidden = false; });
    return h('div', { style: { marginBottom: 'var(--space-sm)' } }, [p, btn]);
  }

  async function renderTeamView() {
    const t = field.team || {};
    const period = t.startDate || t.endDate
      ? `${t.startDate ? formatDateDot(t.startDate) : '?'} – ${t.endDate ? formatDateDot(t.endDate) : '?'}`
      : '';

    const teamPanel = h('section', { className: 'panel-dark', 'aria-label': '팀 정보', style: { marginBottom: 'var(--space-xl)' } }, [
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' } }, [
        h('h2', { style: { fontSize: 'var(--fs-display-xs)', fontWeight: '500' } }, ['팀 정보']),
        h('button', {
          type: 'button',
          className: 'btn btn--sm btn--outline-dark',
          onClick: () => openTeamInfoModal(field, { onSaved: () => render(container, { id, sort, filter }) })
        }, ['팀 정보 수정'])
      ]),
      h('div', { className: 'team-info' }, [
        ...infoRow('주제', t.topic),
        ...infoRow('내 역할', t.role),
        ...infoRow('목표', t.goal),
        ...infoRow('목적', t.purpose),
        ...infoRow('기간', period),
        ...infoRow('팀원', t.members || []),
        ...infoRow('메모', t.memo)
      ])
    ]);

    let logs = [];
    let atts = [];
    try {
      [logs, atts] = await Promise.all([listTeamLogsByField(field.id), listAttachmentsByField(field.id)]);
    } catch {
      return h('div', {}, [teamPanel, h('p', { className: 'form-error' }, ['팀플 일지를 불러오지 못했어요. 새로고침해 주세요.'])]);
    }

    const activeFilter = ['material', 'output'].includes(filter) ? filter : 'all';
    const filterTabs = h('div', { role: 'tablist', 'aria-label': '첨부 구분', style: { display: 'flex', gap: 'var(--space-xs)' } },
      [['all', '전체'], ['material', '자료'], ['output', '결과물']].map(([key, label]) => h('a', {
        href: `#/fields/${field.id}?filter=${key}`,
        role: 'tab',
        'aria-selected': String(activeFilter === key),
        className: `tab ${activeFilter === key ? 'tab--active' : ''}`
      }, [label])));

    // 진행 내용이 있거나 첨부가 1개 이상인 일지만, 날짜 최신 순
    const logByDate = new Map(logs.map(l => [l.date, l]));
    const dates = Array.from(new Set([
      ...logs.filter(l => (l.progress || '').trim()).map(l => l.date),
      ...atts.map(a => a.date)
    ])).sort().reverse();

    const items = [];
    for (const d of dates) {
      const dayAtts = atts.filter(a => a.date === d && (activeFilter === 'all' || a.category === activeFilter));
      if (activeFilter !== 'all' && dayAtts.length === 0) continue;

      const progress = (logByDate.get(d)?.progress || '').trim();
      const attsBox = h('div', {});
      if (dayAtts.length > 0) {
        renderAttachmentList(attsBox, { fieldId: field.id, date: d, readOnly: true, atts: dayAtts, category: activeFilter === 'all' ? null : activeFilter });
      }

      items.push(h('article', { style: { marginBottom: 'var(--space-xxl)' } }, [
        h('h3', { style: { borderBottom: '1px solid var(--color-hairline)', paddingBottom: 'var(--space-xxs)', marginBottom: 'var(--space-sm)' } }, [
          h('a', { href: `#/day/${d}`, style: { fontWeight: '600', fontSize: 'var(--fs-body-lg)', color: 'var(--color-ink)' } }, [`${dateLabel(d)} →`])
        ]),
        activeFilter === 'all' && progress ? clampedProgress(progress) : null,
        attsBox
      ]));
    }

    return h('div', {}, [
      teamPanel,
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-lg)' } }, [
        h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['팀플 일지']),
        filterTabs
      ]),
      items.length > 0 ? h('div', {}, items) : h('div', { className: 'empty-box' }, [
        h('p', { style: { color: 'var(--color-graphite)' } }, [
          activeFilter === 'all'
            ? '아직 팀플 일지가 없어요. 하루 기록 화면에서 이 팀플 태그를 붙이면 일지를 쓸 수 있어요.'
            : `아직 ${activeFilter === 'material' ? '자료' : '결과물'} 첨부가 없어요.`
        ])
      ])
    ]);
  }

  const mainView = field.type === 'team' ? await renderTeamView() : renderGeneralView();

  // AI 분야 요약 카드 (팀플은 팀 정보 패널 아래, 일반은 목록 위)
  const aiSlot = h('div', { style: { marginBottom: 'var(--space-xl)' } });
  renderFieldAiPanel(aiSlot, { field });
  if (field.type === 'team' && mainView.firstChild) mainView.insertBefore(aiSlot, mainView.firstChild.nextSibling);
  else mainView.insertBefore(aiSlot, mainView.firstChild);

  container.appendChild(h('div', { className: 'content-container section' }, [
    breadcrumb,
    titleRow,
    metaRow,
    mainView
  ]));
}
