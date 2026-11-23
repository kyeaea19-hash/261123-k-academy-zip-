import { h } from '../utils/dom.js';
import { icon } from './icons.js';
import { formatDateCard, toDateKey } from '../utils/date.js';

// 날짜 카드 컴포넌트 렌더링
export function renderDayCard(day, { dayNumber, fieldMap = new Map(), attachmentCount = 0 } = {}) {
  const isToday = day.date === toDateKey(new Date());
  const isWritten = Boolean((day.learned && day.learned.trim()) || (day.reflection && day.reflection.trim()) || (day.growthNotes && day.growthNotes.length > 0));

  const badges = [];

  // 1. N일차 배지
  badges.push(h('span', { className: 'badge badge--outline' }, [`${dayNumber}일차`]));

  // 2. TODAY 배지
  if (isToday) {
    const coralDot = h('span', {
      style: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-bloom-coral)',
        display: 'inline-block'
      }
    });
    badges.push(h('span', { className: 'badge' }, [coralDot, 'TODAY']));
  }

  // 상단 줄: 배지들 + 작성 상태
  const statusText = isWritten ? '작성함' : '비어 있음';
  const headerRow = h('div', {
    style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }
  }, [
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xxs)' } }, badges),
    h('span', {
      style: { fontSize: 'var(--fs-caption-md)', color: isWritten ? 'var(--color-graphite)' : 'var(--color-steel)' }
    }, [statusText])
  ]);

  // 날짜 제목 (display-xs)
  const dateTitle = h('h3', {
    style: { fontSize: 'var(--fs-display-xs)', fontWeight: '500', marginBottom: 'var(--space-xxs)' }
  }, [formatDateCard(day.date)]);

  // 하루 제목 (선택)
  const memoTitle = day.title ? h('p', {
    style: {
      fontWeight: '500',
      fontSize: 'var(--fs-body-md)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      marginBottom: 'var(--space-xxs)'
    }
  }, [day.title]) : null;

  // 배운 내용 미리보기 (2줄 말줄임)
  const previewText = (day.learned && day.learned.trim()) || '아직 기록이 없어요';
  const preview = h('p', {
    style: {
      fontSize: 'var(--fs-caption-md)',
      color: (day.learned && day.learned.trim()) ? 'var(--color-charcoal)' : 'var(--color-graphite)',
      display: '-webkit-box',
      WebkitLineClamp: '2',
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      lineHeight: '1.5',
      minHeight: '3em',
      marginBottom: 'var(--space-sm)'
    }
  }, [previewText]);

  // 분야 칩 (최대 2개 + N)
  const chipEls = [];
  const fieldIds = day.fieldIds || [];
  const maxDisplayChips = 2;

  for (let i = 0; i < Math.min(fieldIds.length, maxDisplayChips); i++) {
    const f = fieldMap.get(fieldIds[i]);
    if (f) {
      const dot = h('span', {
        className: 'chip-dot',
        style: { backgroundColor: `var(--color-${f.color === 'blue' ? 'primary' : (f.color === 'navy' ? 'primary-deep' : (f.color === 'teal' ? 'storm-deep' : (f.color === 'sea' ? 'storm-sea' : (f.color === 'brick' ? 'bloom-deep' : 'charcoal'))))})` }
      });
      chipEls.push(h('span', {
        className: 'chip',
        style: { padding: '2px 8px', fontSize: '12px' }
      }, [dot, f.name]));
    }
  }

  if (fieldIds.length > maxDisplayChips) {
    chipEls.push(h('span', {
      className: 'badge badge--outline',
      style: { fontSize: '11px', padding: '2px 6px' }
    }, [`+${fieldIds.length - maxDisplayChips}`]));
  }

  const chipsRow = h('div', {
    style: { display: 'flex', alignItems: 'center', gap: 'var(--space-xxs)', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }
  }, chipEls);

  // 하단 아이콘 (메모지 수, 첨부 수)
  const metaIcons = [];
  const noteCount = day.growthNotes?.length || 0;
  if (noteCount > 0) {
    metaIcons.push(h('span', {
      style: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' }
    }, [
      icon('bulb', { size: 16 }),
      String(noteCount)
    ]));
  }
  if (attachmentCount > 0) {
    metaIcons.push(h('span', {
      style: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-caption-md)', color: 'var(--color-graphite)' }
    }, [
      icon('file', { size: 16 }),
      String(attachmentCount)
    ]));
  }

  const bottomRow = h('div', {
    style: { display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minHeight: '20px' }
  }, metaIcons);

  // 카드 링크 래퍼
  const card = h('a', {
    href: `#/day/${day.date}`,
    className: `card day-card ${!isWritten ? 'day-card--empty' : ''}`,
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: isToday ? '2px solid var(--color-ink)' : 'none',
      backgroundColor: isWritten ? 'var(--color-paper)' : 'var(--color-cloud)'
    },
    'aria-label': `${dayNumber}일차, ${formatDateCard(day.date)}, ${statusText}, 메모지 ${noteCount}장`
  }, [
    h('div', {}, [
      headerRow,
      dateTitle,
      memoTitle,
      preview
    ]),
    h('div', {}, [
      chipsRow,
      bottomRow
    ])
  ]);

  return card;
}
