import { h } from '../utils/dom.js';

// 분야 칩/배지 생성 헬퍼
export function renderFieldChip(field, { selected = false, onClick = null, small = false } = {}) {
  const colorMap = {
    blue: 'var(--color-primary)',
    navy: 'var(--color-primary-deep)',
    teal: 'var(--color-storm-deep)',
    sea: 'var(--color-storm-sea)',
    brick: 'var(--color-bloom-deep)',
    charcoal: 'var(--color-charcoal)'
  };

  const dot = h('span', {
    className: 'chip-dot',
    style: { backgroundColor: colorMap[field.color] || colorMap.blue }
  });

  const chip = h('button', {
    type: 'button',
    className: `chip ${selected ? 'chip--active' : ''}`,
    style: small ? { padding: '2px 8px', fontSize: '12px' } : {},
    'aria-pressed': selected ? 'true' : 'false',
    onClick: () => {
      if (onClick) onClick(field);
    }
  }, [
    dot,
    field.name
  ]);

  return chip;
}
