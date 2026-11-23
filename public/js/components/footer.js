import { h, clear } from '../utils/dom.js';

// 하단 푸터 컴포넌트 렌더링
export function renderFooter(container) {
  clear(container);

  const footer = h('footer', { className: 'site-footer' }, [
    h('div', { className: 'container' }, [
      h('div', { className: 'site-footer__grid' }, [
        // 1열: 로고 + 설명
        h('div', {}, [
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--fs-display-xs)', fontWeight: '700', marginBottom: 'var(--space-xs)' } }, [
            h('span', {}, ['요약']),
            h('span', { style: { color: 'var(--color-primary-bright)' } }, ['.']),
            h('span', {}, ['zip'])
          ]),
          h('p', { style: { color: 'var(--color-steel)', fontSize: 'var(--fs-caption-md)' } }, [
            '전력시장 디지털 인재 아카데미 학습 기록'
          ])
        ]),
        // 2열: 바로가기
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', fontSize: 'var(--fs-caption-md)' } }, [
          h('strong', { style: { color: 'var(--color-on-ink)', marginBottom: 'var(--space-xxs)' } }, ['바로가기']),
          h('a', { href: '#/', style: { color: 'var(--color-steel)' } }, ['날짜별']),
          h('a', { href: '#/fields', style: { color: 'var(--color-steel)' } }, ['분야별']),
          h('a', { href: '#/settings', style: { color: 'var(--color-steel)' } }, ['설정'])
        ]),
        // 3열: 데이터 안내
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', fontSize: 'var(--fs-caption-md)' } }, [
          h('p', { style: { color: 'var(--color-steel)' } }, [
            '기록은 이 브라우저에만 저장돼요. 가끔 백업해 주세요.'
          ]),
          h('a', {
            href: '#/settings',
            className: 'btn btn--text',
            style: { color: 'var(--color-primary-bright)', textAlign: 'left' }
          }, ['백업 파일 내보내기'])
        ])
      ]),
      // 바닥선
      h('div', { className: 'site-footer__bottom' }, [
        '© 2026 요약.zip · 개인 학습 기록용'
      ])
    ])
  ]);

  container.appendChild(footer);
}
