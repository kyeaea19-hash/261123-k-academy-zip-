import { h, clear } from '../utils/dom.js';

// 404 페이지 렌더링
export function render(container) {
  clear(container);
  document.title = '페이지를 찾을 수 없어요 — 요약.zip';

  const box = h('div', { className: 'empty-box' }, [
    h('h1', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500' } }, ['페이지를 찾을 수 없어요']),
    h('p', { style: { color: 'var(--color-graphite)', fontSize: 'var(--fs-body-md)' } }, [
      '요청하신 주소의 페이지가 존재하지 않거나 이동했어요.'
    ]),
    h('a', {
      href: '#/',
      className: 'btn btn--ink',
      style: { borderRadius: '4px', height: '44px' }
    }, ['홈으로'])
  ]);

  const wrapper = h('div', { className: 'container section' }, [box]);
  container.appendChild(wrapper);
}
