import { h } from './utils/dom.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { startRouter } from './router.js';
import { openDb } from './db.js';
import { getCourse, getStats } from './store.js';
import { showOnboardingModal } from './pages/onboarding.js';

// 애플리케이션 초기화 시작점
async function initApp() {
  const mainEl = document.getElementById('main');
  const headerContainer = document.getElementById('app-header');
  const footerContainer = document.getElementById('app-footer');

  // 1. IndexedDB 열기
  try {
    await openDb();
  } catch (err) {
    // CSP(style-src 'self') 때문에 style 속성 대신 h() 로 그린다
    if (mainEl) {
      mainEl.appendChild(h('div', { className: 'container section' }, [
        h('div', { className: 'empty-box', style: { border: '1px solid var(--color-bloom-deep)' } }, [
          h('h1', { style: { color: 'var(--color-bloom-deep)', fontSize: 'var(--fs-display-sm)' } }, ['기록을 저장할 수 없어요']),
          h('p', { style: { color: 'var(--color-charcoal)', marginTop: 'var(--space-sm)' } }, [
            '이 브라우저에서는 기록을 저장할 수 없어요. 사생활 보호(시크릿) 모드라면 일반 창에서 열어 주세요.'
          ])
        ])
      ]));
    }
    return;
  }

  // 2. storage.persist 요청 (오류 무시)
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist();
    }
  } catch {}

  // 3. 헤더·푸터 업데이트 함수
  async function refreshHeader() {
    if (!headerContainer) return;
    try {
      const [course, stats] = await Promise.all([getCourse(), getStats()]);
      renderHeader(headerContainer, {
        courseName: course?.name || '전력시장 디지털 인재 아카데미',
        writtenDays: stats.writtenDays,
        totalDays: stats.totalDays
      });
    } catch {}
  }

  await refreshHeader();
  if (footerContainer) {
    renderFooter(footerContainer);
  }

  // 4. 첫 실행 확인 (course 가 없으면 온보딩 모달)
  const existingCourse = await getCourse();
  if (!existingCourse) {
    await showOnboardingModal();
    await refreshHeader();
  }

  // 5. 라우터 시작
  startRouter();

  // 6. data-changed 및 hashchange 이벤트 리스너
  window.addEventListener('data-changed', refreshHeader);
  window.addEventListener('hashchange', refreshHeader);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
