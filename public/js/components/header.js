import { h, clear, $ } from '../utils/dom.js';
import { icon } from './icons.js';
import { goToday } from './goToday.js';

let mobileSheetEl = null;

// 모바일 전체화면 메뉴 토글
function openMobileMenu() {
  if (mobileSheetEl) return;
  const triggerEl = document.activeElement;

  function close() {
    document.removeEventListener('keydown', onKeyDown);
    document.body.style.overflow = '';
    if (mobileSheetEl && mobileSheetEl.parentNode) {
      mobileSheetEl.parentNode.removeChild(mobileSheetEl);
    }
    mobileSheetEl = null;
    if (triggerEl && typeof triggerEl.focus === 'function') {
      triggerEl.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') close();
  }

  const closeBtn = h('button', {
    className: 'icon-btn',
    'aria-label': '메뉴 닫기',
    onClick: close
  }, [icon('close', { size: 24 })]);

  const links = h('div', { className: 'mobile-nav-sheet__links' }, [
    h('a', { href: '#/', onClick: close }, ['날짜별']),
    h('a', { href: '#/fields', onClick: close }, ['분야별']),
    h('a', { href: '#/settings', onClick: close }, ['설정'])
  ]);

  const todayBtn = h('button', {
    className: 'btn btn--ink',
    style: { width: '100%' },
    onClick: () => {
      close();
      goToday();
    }
  }, ['오늘 기록 쓰기']);

  mobileSheetEl = h('div', { className: 'mobile-nav-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': '전체 메뉴' }, [
    h('div', { className: 'mobile-nav-sheet__header' }, [closeBtn]),
    links,
    h('div', { style: { marginTop: 'auto', paddingTop: 'var(--space-xl)' } }, [todayBtn])
  ]);

  document.body.appendChild(mobileSheetEl);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeyDown);
  closeBtn.focus();
}

// 상단 헤더 컴포넌트 렌더링
export function renderHeader(container, { courseName = '전력시장 디지털 인재 아카데미', writtenDays = 0, totalDays = 0 } = {}) {
  clear(container);

  // 1. 유틸리티 스트립
  const utility = h('div', { className: 'utility-strip' }, [
    h('div', { className: 'container' }, [
      h('div', { className: 'utility-strip__title' }, [courseName]),
      h('div', { className: 'utility-strip__meta' }, [
        h('span', { className: 'utility-strip__stat' }, [`기록 ${writtenDays} / ${totalDays}일`]),
        h('span', { 'aria-hidden': 'true' }, ['·']),
        h('a', { href: '#/settings', className: 'utility-strip__settings', 'aria-label': '설정' }, [
          h('span', { className: 'utility-strip__settings-text' }, ['설정']),
          h('span', { className: 'utility-strip__settings-icon' }, [icon('settings', { size: 18 })])
        ])
      ])
    ])
  ]);

  // 2. 상단 내비게이션
  const logo = h('a', { href: '#/', className: 'site-nav__logo' }, [
    icon('chevrons', { size: 16 }),
    h('span', {}, ['요약']),
    h('span', { className: 'site-nav__logo-dot' }, ['.']),
    h('span', {}, ['zip'])
  ]);

  const currentHash = window.location.hash || '#/';
  const isFields = currentHash.startsWith('#/fields');
  const isHome = !isFields && !currentHash.startsWith('#/settings') && !currentHash.startsWith('#/search');

  const menu = h('nav', { className: 'site-nav__menu', 'aria-label': '주요 메뉴' }, [
    h('a', {
      href: '#/',
      className: 'site-nav__link',
      ...(isHome ? { 'aria-current': 'page' } : {})
    }, ['날짜별']),
    h('a', {
      href: '#/fields',
      className: 'site-nav__link',
      ...(isFields ? { 'aria-current': 'page' } : {})
    }, ['분야별'])
  ]);

  // 검색 입력창 (Enter → 검색 화면, Esc → 모바일 검색 줄 닫기)
  const makeSearchInput = (className, onEsc) => h('input', {
    type: 'search',
    className,
    placeholder: '기록 검색',
    'aria-label': '기록 검색',
    maxLength: 50,
    onKeyDown: (e) => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim();
        if (val) window.location.hash = `#/search?q=${encodeURIComponent(val)}`;
      } else if (e.key === 'Escape' && onEsc) {
        onEsc();
      }
    }
  });

  const searchInput = makeSearchInput('site-nav__search-input site-nav__desktop-only');

  const todayBtn = h('button', {
    type: 'button',
    className: 'btn btn--outline-ink site-nav__desktop-only',
    onClick: goToday
  }, ['오늘 기록']);

  // 모바일: 검색 아이콘 → 내비 아래에 검색 줄이 펼쳐짐
  const mobileSearchRow = h('div', { className: 'mobile-search', hidden: true });
  const searchToggle = h('button', {
    type: 'button',
    className: 'icon-btn site-nav__mobile-only',
    'aria-label': '검색 열기',
    'aria-expanded': 'false',
    onClick: () => (mobileSearchRow.hidden ? openSearchRow() : closeSearchRow())
  }, [icon('search', { size: 22 })]);
  const mobileInput = makeSearchInput('input', closeSearchRow);
  mobileSearchRow.appendChild(h('div', { className: 'container' }, [mobileInput]));

  // 모바일 검색 줄을 연다
  function openSearchRow() {
    mobileSearchRow.hidden = false;
    searchToggle.setAttribute('aria-expanded', 'true');
    mobileInput.focus();
  }

  // 모바일 검색 줄을 닫는다
  function closeSearchRow() {
    mobileSearchRow.hidden = true;
    searchToggle.setAttribute('aria-expanded', 'false');
    searchToggle.focus();
  }

  const hamburgerBtn = h('button', {
    type: 'button',
    className: 'icon-btn site-nav__mobile-only',
    'aria-label': '메뉴 열기',
    onClick: openMobileMenu
  }, [icon('menu', { size: 24 })]);

  const actions = h('div', { className: 'site-nav__actions' }, [
    searchInput,
    todayBtn,
    searchToggle,
    hamburgerBtn
  ]);

  const nav = h('header', { className: 'site-nav' }, [
    h('div', { className: 'container' }, [
      logo,
      menu,
      actions
    ])
  ]);

  container.appendChild(utility);
  container.appendChild(nav);
  container.appendChild(mobileSearchRow);
}
