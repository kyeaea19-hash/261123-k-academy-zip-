import { h, clear } from '../utils/dom.js';
import { renderDayCard } from '../components/dayCard.js';
import { goToday } from '../components/goToday.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import {
  getCourse,
  listDays,
  listFields,
  getStats,
  createDay,
  listAllAttachments
} from '../store.js';
import {
  weekNumber,
  formatDateDot,
  formatDateCard,
  todayKey,
  isValidDateKey
} from '../utils/date.js';

// 날짜 추가 모달
async function openAddDayModal() {
  let dateInput;

  const body = () => {
    dateInput = h('input', {
      type: 'date',
      className: 'input',
      value: todayKey()
    });

    return [
      h('div', { className: 'form-group' }, [
        h('label', { className: 'form-label' }, ['추가할 날짜']),
        dateInput
      ])
    ];
  };

  openModal({
    title: '날짜 섹션 추가',
    body,
    actions: [
      { label: '취소', className: 'btn btn--outline-ink', value: null },
      {
        label: '추가',
        className: 'btn btn--ink',
        onClick: async () => {
          const val = dateInput?.value;
          if (!val || !isValidDateKey(val)) {
            toast('올바른 날짜를 선택해 주세요.', { type: 'error' });
            return false;
          }
          const days = await listDays();
          if (days.some(d => d.date === val)) {
            toast('이미 있는 날짜예요.', {
              type: 'info',
              action: {
                label: '그 날짜로 이동',
                onClick: () => { window.location.hash = `#/day/${val}`; }
              }
            });
            return false;
          }

          try {
            await createDay(val);
            toast(`${formatDateCard(val)}을 추가했어요.`);
            window.location.hash = `#/day/${val}`;
            return true;
          } catch (err) {
            toast('날짜 추가에 실패했어요.', { type: 'error' });
            return false;
          }
        }
      }
    ]
  });
}

// 홈 화면 렌더링
export async function render(container, params = {}) {
  clear(container);
  document.title = '요약.zip — 전력시장 디지털 인재 아카데미';

  const [course, days, fields, stats, allAtts] = await Promise.all([
    getCourse(),
    listDays(),
    listFields(),
    getStats(),
    listAllAttachments().catch(() => [])
  ]);

  // 날짜별 첨부 개수 (카드의 📎 표시)
  const attCountByDate = new Map();
  for (const a of allAtts) attCountByDate.set(a.date, (attCountByDate.get(a.date) || 0) + 1);

  const fieldMap = new Map(fields.map(f => [f.id, f]));

  // 1. 히어로 영역 (Hero Strip)
  const heroLeft = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' } }, [
    h('span', { style: { fontSize: 'var(--fs-caption-bold)', color: 'var(--color-graphite)' } }, [
      course?.name || '전력시장 디지털 인재 아카데미'
    ]),
    h('h1', { className: 'home-hero__title' }, [
      '오늘 배운 것을',
      h('br'),
      '요약.zip에 담아요'
    ]),
    h('p', { style: { fontSize: 'var(--fs-body-md)', color: 'var(--color-charcoal)' } }, [
      course?.startDate && course?.endDate
        ? `${formatDateDot(course.startDate)} – ${formatDateDot(course.endDate)} · ${days.length}일`
        : '과정 기간을 설정해 주세요'
    ]),
    h('div', { style: { display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' } }, [
      h('button', {
        className: 'btn btn--primary',
        onClick: goToday
      }, ['오늘 기록 쓰기']),
      h('a', {
        href: '#/fields',
        className: 'btn btn--outline-ink'
      }, ['분야별로 보기'])
    ])
  ]);

  // 히어로 통계 4칸 (기록한 날, 성장 메모지, 분야, 팀플)
  const statsGrid = h('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 'var(--space-md)',
      alignContent: 'center'
    }
  }, [
    h('div', { className: 'card', style: { padding: 'var(--space-md)' } }, [
      h('div', { style: { fontSize: 'var(--fs-stat-md)', fontWeight: '500' } }, [`${stats.writtenDays}일`]),
      h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, ['기록한 날'])
    ]),
    h('div', { className: 'card', style: { padding: 'var(--space-md)' } }, [
      h('div', { style: { fontSize: 'var(--fs-stat-md)', fontWeight: '500' } }, [`${stats.noteCount}장`]),
      h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, ['성장 메모지'])
    ]),
    h('div', { className: 'card', style: { padding: 'var(--space-md)' } }, [
      h('div', { style: { fontSize: 'var(--fs-stat-md)', fontWeight: '500' } }, [`${stats.fieldCount}개`]),
      h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, ['분야'])
    ]),
    h('div', { className: 'card', style: { padding: 'var(--space-md)' } }, [
      h('div', { style: { fontSize: 'var(--fs-stat-md)', fontWeight: '500' } }, [`${stats.teamCount}개`]),
      h('div', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, ['팀플'])
    ])
  ]);

  const chevronLeft = h('div', { className: 'chevrons', 'aria-hidden': 'true' }, [
    h('div', { className: 'chevron-shape' }),
    h('div', { className: 'chevron-shape' })
  ]);
  const chevronRight = h('div', { className: 'chevrons', 'aria-hidden': 'true' }, [
    h('div', { className: 'chevron-shape' }),
    h('div', { className: 'chevron-shape' })
  ]);

  const heroCard = h('div', { className: 'hero-card' }, [
    heroLeft,
    statsGrid
  ]);

  const heroSection = h('section', { className: 'container hero' }, [
    chevronLeft,
    heroCard,
    chevronRight
  ]);

  // 2. 필터 영역 (Status Tabs & Field Chips)
  const currentStatus = params.status || 'all';
  const selectedFieldIds = new Set(params.fields ? params.fields.split(',') : []);

  const updateFilters = (newStatus, newFieldsSet) => {
    const qParts = [];
    if (newStatus && newStatus !== 'all') qParts.push(`status=${newStatus}`);
    if (newFieldsSet.size > 0) qParts.push(`fields=${Array.from(newFieldsSet).join(',')}`);
    window.location.hash = qParts.length > 0 ? `#/?${qParts.join('&')}` : '#/';
  };

  const statusTabs = h('div', { style: { display: 'flex', gap: 'var(--space-xs)' } }, [
    h('button', {
      className: `tab ${currentStatus === 'all' ? 'tab--active' : ''}`,
      onClick: () => updateFilters('all', selectedFieldIds)
    }, ['전체']),
    h('button', {
      className: `tab ${currentStatus === 'written' ? 'tab--active' : ''}`,
      onClick: () => updateFilters('written', selectedFieldIds)
    }, ['작성한 날']),
    h('button', {
      className: `tab ${currentStatus === 'empty' ? 'tab--active' : ''}`,
      onClick: () => updateFilters('empty', selectedFieldIds)
    }, ['빈 날'])
  ]);

  const addDayBtn = h('button', {
    className: 'btn btn--outline-ink btn--sm',
    onClick: openAddDayModal
  }, ['+ 날짜 추가']);

  const filterTopRow = h('div', {
    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }
  }, [
    statusTabs,
    addDayBtn
  ]);

  const fieldChipEls = fields.map(f => {
    const isSelected = selectedFieldIds.has(f.id);
    const dot = h('span', {
      className: 'chip-dot',
      style: { backgroundColor: `var(--color-${f.color === 'blue' ? 'primary' : (f.color === 'navy' ? 'primary-deep' : (f.color === 'teal' ? 'storm-deep' : (f.color === 'sea' ? 'storm-sea' : (f.color === 'brick' ? 'bloom-deep' : 'charcoal'))))})` }
    });
    return h('button', {
      className: `chip ${isSelected ? 'chip--active' : ''}`,
      'aria-pressed': isSelected ? 'true' : 'false',
      onClick: () => {
        const nextSet = new Set(selectedFieldIds);
        if (nextSet.has(f.id)) nextSet.delete(f.id);
        else nextSet.add(f.id);
        updateFilters(currentStatus, nextSet);
      }
    }, [dot, f.name]);
  });

  const filterSection = h('section', { className: 'container', style: { marginBottom: 'var(--space-xl)' } }, [
    filterTopRow,
    fieldChipEls.length > 0 ? h('div', {
      style: { display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '4px' }
    }, fieldChipEls) : h('p', { style: { color: 'var(--color-graphite)', fontSize: 'var(--fs-caption-md)' } }, [
      '분야를 만들면 여기서 골라 볼 수 있어요 → ',
      h('a', { href: '#/fields', style: { textDecoration: 'underline', color: 'var(--color-primary)' } }, ['분야 만들기'])
    ])
  ]);

  // 3. 주차별 날짜 카드 목록
  // 필터링 적용
  const baseStartDate = course?.startDate || (days.length > 0 ? days[0].date : todayKey());
  const dayNumberMap = new Map();
  days.forEach((d, idx) => {
    dayNumberMap.set(d.date, idx + 1);
  });

  const filteredDays = days.filter(d => {
    const isWritten = Boolean((d.learned && d.learned.trim()) || (d.reflection && d.reflection.trim()) || (d.growthNotes && d.growthNotes.length > 0));
    if (currentStatus === 'written' && !isWritten) return false;
    if (currentStatus === 'empty' && isWritten) return false;

    if (selectedFieldIds.size > 0) {
      const hasAny = (d.fieldIds || []).some(id => selectedFieldIds.has(id));
      if (!hasAny) return false;
    }
    return true;
  });

  // 주차별 그룹핑
  const weekGroups = new Map();
  for (const d of filteredDays) {
    const w = weekNumber(d.date, baseStartDate);
    if (!weekGroups.has(w)) weekGroups.set(w, []);
    weekGroups.get(w).push(d);
  }

  const groupElements = [];
  const sortedWeeks = Array.from(weekGroups.keys()).sort((a, b) => a - b);

  for (const w of sortedWeeks) {
    const wDays = weekGroups.get(w);
    const writtenCount = wDays.filter(d => (d.learned && d.learned.trim()) || (d.reflection && d.reflection.trim()) || (d.growthNotes && d.growthNotes.length > 0)).length;
    const startD = wDays[0].date.slice(5).replace('-', '.');
    const endD = wDays[wDays.length - 1].date.slice(5).replace('-', '.');

    const groupHeader = h('div', {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        borderBottom: '1px solid var(--color-hairline)',
        paddingBottom: 'var(--space-xs)'
      }
    }, [
      h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, [w > 0 ? `${w}주차` : '과정 전']),
      h('span', { style: { fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' } }, [
        `${startD} – ${endD} · ${wDays.length}일 중 ${writtenCount}일 작성`
      ])
    ]);

    const cardsGrid = h('div', {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 'var(--gutter)',
        marginBottom: 'var(--space-xxl)'
      }
    }, wDays.map(d => renderDayCard(d, {
      dayNumber: dayNumberMap.get(d.date) || 1,
      fieldMap,
      attachmentCount: attCountByDate.get(d.date) || 0
    })));

    groupElements.push(h('div', { className: 'week-group' }, [groupHeader, cardsGrid]));
  }

  // 빈 상태 처리
  let listSection;
  if (days.length === 0) {
    listSection = h('section', { className: 'container' }, [
      h('div', { className: 'empty-box' }, [
        h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['아직 날짜 섹션이 없어요']),
        h('p', { style: { color: 'var(--color-graphite)' } }, ['과정 기간을 설정하거나 날짜를 추가해 학습 기록을 시작해 보세요.']),
        h('div', { style: { display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' } }, [
          h('a', { href: '#/settings', className: 'btn btn--ink' }, ['과정 기간 설정']),
          h('button', { className: 'btn btn--outline-ink', onClick: openAddDayModal }, ['날짜 추가'])
        ])
      ])
    ]);
  } else if (filteredDays.length === 0) {
    listSection = h('section', { className: 'container' }, [
      h('div', { className: 'empty-box' }, [
        h('h2', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['조건에 맞는 날짜가 없어요']),
        h('button', {
          className: 'btn btn--outline-ink',
          onClick: () => { window.location.hash = '#/'; }
        }, ['필터 초기화'])
      ])
    ]);
  } else {
    listSection = h('section', { className: 'container' }, groupElements);
  }

  container.appendChild(heroSection);
  container.appendChild(filterSection);
  container.appendChild(listSection);
}
