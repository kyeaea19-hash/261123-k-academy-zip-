// DOM 유틸리티: 요소 생성 h(), clear(), $()
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);

  for (const [key, val] of Object.entries(attrs)) {
    if (val === undefined || val === null) continue;
    if (key.startsWith('on') && typeof val === 'function') {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, val);
    } else if (key === 'className') {
      el.className = val;
    } else if (key === 'style' && typeof val === 'object') {
      // 'fontSize' → 'font-size', 'WebkitLineClamp' → '-webkit-line-clamp' (CSS 변수 '--x' 는 그대로)
      for (const [sKey, sVal] of Object.entries(val)) {
        const cssKey = sKey.startsWith('--') ? sKey : sKey.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        el.style.setProperty(cssKey, sVal);
      }
    } else if (key === 'htmlFor') {
      el.setAttribute('for', val);
    } else if (key === 'dataset' && typeof val === 'object') {
      for (const [dKey, dVal] of Object.entries(val)) {
        el.dataset[dKey] = dVal;
      }
    } else if (typeof val === 'boolean') {
      if (val) el.setAttribute(key, '');
    } else {
      el.setAttribute(key, String(val));
    }
  }

  const childList = Array.isArray(children) ? children : [children];
  for (const child of childList) {
    if (child === undefined || child === null) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

export function clear(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

export function $(selector, context = document) {
  return context.querySelector(selector);
}

export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
