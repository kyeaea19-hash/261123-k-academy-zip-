import { h, clear, $ } from '../utils/dom.js';
import { icon } from './icons.js';

let modalRoot = null;
let activeTriggerEl = null;

function getRoot() {
  if (!modalRoot) {
    modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = h('div', { id: 'modal-root' });
      document.body.appendChild(modalRoot);
    }
  }
  return modalRoot;
}

// 대화상자 열기
export function openModal({ title, body, actions = [] }) {
  return new Promise((resolve) => {
    activeTriggerEl = document.activeElement;
    const root = getRoot();

    let backdrop = null;

    function close(result = null) {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      if (activeTriggerEl && typeof activeTriggerEl.focus === 'function') {
        activeTriggerEl.focus();
      }
      resolve(result);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        close(null);
      } else if (e.key === 'Tab') {
        // 포커스 트랩
        const focusable = backdrop.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    }

    const closeBtn = h('button', {
      className: 'icon-btn',
      'aria-label': '닫기',
      onClick: () => close(null)
    }, [icon('close', { size: 20 })]);

    const header = h('div', { className: 'modal-header' }, [
      h('h2', { className: 'modal-title' }, [title]),
      closeBtn
    ]);

    const bodyContent = typeof body === 'function' ? body(close) : (Array.isArray(body) ? body : [body]);
    const bodyEl = h('div', { className: 'modal-body' }, bodyContent);

    const footerEl = h('div', { className: 'modal-footer' }, actions.map(act => {
      return h('button', {
        className: act.className || 'btn btn--ink',
        onClick: async () => {
          if (act.onClick) {
            const res = await act.onClick(close);
            if (res !== false) close(act.value !== undefined ? act.value : true);
          } else {
            close(act.value !== undefined ? act.value : true);
          }
        }
      }, [act.label]);
    }));

    const content = h('div', {
      className: 'modal-content',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': title
    }, [
      header,
      bodyEl,
      actions.length > 0 ? footerEl : null
    ]);

    backdrop = h('div', {
      className: 'modal-backdrop',
      onClick: (e) => {
        if (e.target === backdrop) close(null);
      }
    }, [content]);

    root.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    // 첫 입력창 또는 버튼에 포커스
    requestAnimationFrame(() => {
      const firstInput = content.querySelector('input, textarea, select, button:not([aria-label="닫기"])');
      if (firstInput) {
        firstInput.focus();
      } else {
        closeBtn.focus();
      }
    });
  });
}

// 확인 모달
export function confirmDialog({ title, message, confirmLabel = '확인', danger = false }) {
  return openModal({
    title,
    body: [h('p', { style: { lineHeight: '1.6', color: 'var(--color-charcoal)' } }, [message])],
    actions: [
      { label: '취소', className: 'btn btn--outline-ink', value: false },
      { label: confirmLabel, className: danger ? 'btn btn--danger' : 'btn btn--ink', value: true }
    ]
  });
}
