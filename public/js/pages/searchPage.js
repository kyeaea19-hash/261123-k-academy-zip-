import { h, clear } from '../utils/dom.js';
import { search, listDays } from '../store.js';
import { formatDateCard } from '../utils/date.js';
import { MAX_SEARCH_QUERY } from '../constants.js';

// 결과 1개 발췌를 텍스트 노드로 조립한다 (일치 부분만 <mark>, innerHTML 사용 안 함)
function excerptEl({ label, excerpt }) {
  return h('p', { className: 'search-hit' }, [
    h('span', { className: 'badge badge--outline search-hit__label' }, [label]),
    h('span', { className: 'search-hit__text' }, [
      excerpt.before,
      h('mark', {}, [excerpt.match]),
      excerpt.after
    ])
  ]);
}

// 검색 결과 화면 (#/search?q=)
export async function render(container, { q = '' } = {}) {
  clear(container);
  const query = String(q).trim();
  document.title = `"${query}" 검색 — 요약.zip`;
  const wrap = h('div', { className: 'content-container section' });
  container.appendChild(wrap);

  if (!query || query.length > MAX_SEARCH_QUERY) {
    wrap.appendChild(h('div', { className: 'empty-box' }, [
      h('p', {}, [`검색어를 1~${MAX_SEARCH_QUERY}자로 입력해 주세요.`])
    ]));
    return;
  }

  let results;
  let days;
  try {
    [results, days] = await Promise.all([search(query), listDays()]);
  } catch {
    wrap.appendChild(h('p', { className: 'form-error' }, ['검색하지 못했어요. 새로고침 후 다시 시도해 주세요.']));
    return;
  }

  const dayNumberOf = new Map(days.map((d, i) => [d.date, i + 1]));
  wrap.appendChild(h('h1', { style: { fontSize: 'var(--fs-display-sm)', fontWeight: '500', marginBottom: 'var(--space-lg)' } }, [
    `"${query}" 검색 결과 ${results.length}건`
  ]));

  if (results.length === 0) {
    wrap.appendChild(h('div', { className: 'empty-box' }, [h('p', {}, ['검색 결과가 없어요. 다른 단어로 찾아보세요.'])]));
    return;
  }

  wrap.appendChild(h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' } },
    results.map(r => h('article', { className: 'card--compact' }, [
      h('a', { href: `#/day/${r.date}`, style: { fontWeight: '600', fontSize: 'var(--fs-body-lg)', color: 'var(--color-ink)' } }, [
        dayNumberOf.has(r.date) ? `${formatDateCard(r.date)} · ${dayNumberOf.get(r.date)}일차 →` : `${formatDateCard(r.date)} →`
      ]),
      ...r.matches.map(excerptEl)
    ]))));
}
