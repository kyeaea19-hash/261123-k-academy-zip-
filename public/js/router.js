import * as homePage from './pages/homePage.js';
import * as dayPage from './pages/dayPage.js';
import * as fieldsPage from './pages/fieldsPage.js';
import * as fieldDetailPage from './pages/fieldDetailPage.js';
import * as searchPage from './pages/searchPage.js';
import * as settingsPage from './pages/settingsPage.js';
import * as notFoundPage from './pages/notFoundPage.js';

let mainContainer = null;
let currentPageModule = null;

// 해시 파싱 및 라우팅 디스패치
export function handleRouteChange() {
  if (!mainContainer) {
    mainContainer = document.getElementById('main');
  }

  // 이전 페이지 정리
  if (currentPageModule && typeof currentPageModule.destroy === 'function') {
    try {
      currentPageModule.destroy();
    } catch (err) {
      console.error('[라우터 이전 페이지 해제 오류]', err);
    }
  }

  const hash = window.location.hash || '#/';
  const [path, queryString] = hash.split('?');
  const params = {};

  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    for (const [k, v] of searchParams.entries()) {
      params[k] = v;
    }
  }

  window.scrollTo(0, 0);

  // 1. 홈: #/ 또는 빈 해시
  if (path === '#/' || path === '#' || path === '') {
    currentPageModule = homePage;
    homePage.render(mainContainer, params);
  }
  // 2. 하루 기록: #/day/YYYY-MM-DD
  else if (path.startsWith('#/day/')) {
    const dateStr = path.slice(6);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      currentPageModule = notFoundPage;
      notFoundPage.render(mainContainer);
    } else {
      currentPageModule = dayPage;
      dayPage.render(mainContainer, { ...params, date: dateStr });
    }
  }
  // 3. 분야 목록: #/fields
  else if (path === '#/fields') {
    currentPageModule = fieldsPage;
    fieldsPage.render(mainContainer, params);
  }
  // 4. 분야 상세: #/fields/:id
  else if (path.startsWith('#/fields/')) {
    const id = path.slice(9);
    currentPageModule = fieldDetailPage;
    fieldDetailPage.render(mainContainer, { ...params, id });
  }
  // 5. 검색: #/search
  else if (path === '#/search') {
    currentPageModule = searchPage;
    searchPage.render(mainContainer, params);
  }
  // 6. 설정: #/settings
  else if (path === '#/settings') {
    currentPageModule = settingsPage;
    settingsPage.render(mainContainer, params);
  }
  // 7. 그 외: 404
  else {
    currentPageModule = notFoundPage;
    notFoundPage.render(mainContainer);
  }

  if (mainContainer) {
    mainContainer.focus();
  }
}

export function startRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}
