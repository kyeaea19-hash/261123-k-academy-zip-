import { h, clear, $ } from '../utils/dom.js';

const TOAST_DURATION_INFO = 3000;
const TOAST_DURATION_ERROR = 6000;
const MAX_TOASTS = 3;

let toastContainer = null;

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-root');
    if (!toastContainer) {
      toastContainer = h('div', { id: 'toast-root', 'aria-live': 'polite', 'aria-atomic': 'true' });
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

// 토스트 메시지 표시
export function toast(message, { type = 'info', action = null } = {}) {
  const container = getContainer();

  // 최대 3개 유지
  while (container.children.length >= MAX_TOASTS) {
    container.removeChild(container.firstChild);
  }

  const duration = type === 'error' ? TOAST_DURATION_ERROR : TOAST_DURATION_INFO;

  const toastEl = h('div', {
    className: `toast toast--${type}`,
    role: 'status'
  }, [
    h('span', { className: 'toast__message' }, [message])
  ]);

  if (action && action.label && typeof action.onClick === 'function') {
    const actionBtn = h('button', {
      className: 'btn btn--text',
      style: { color: 'var(--color-primary-bright)', marginLeft: 'var(--space-sm)' },
      onClick: () => {
        action.onClick();
        dismiss();
      }
    }, [action.label]);
    toastEl.appendChild(actionBtn);
  }

  let timer = null;
  const startTimer = () => {
    timer = setTimeout(dismiss, duration);
  };
  const stopTimer = () => {
    if (timer) clearTimeout(timer);
  };

  function dismiss() {
    stopTimer();
    toastEl.removeEventListener('mouseenter', stopTimer);
    toastEl.removeEventListener('mouseleave', startTimer);
    if (toastEl.parentNode) {
      toastEl.parentNode.removeChild(toastEl);
    }
  }

  toastEl.addEventListener('mouseenter', stopTimer);
  toastEl.addEventListener('mouseleave', startTimer);

  container.appendChild(toastEl);
  startTimer();
}
