// 디바운스 유틸리티
export function debounce(fn, delayMs) {
  let timer = null;
  const debounced = function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delayMs);
  };

  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  debounced.flush = function (...args) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      return fn.apply(this, args); // 저장 함수의 Promise 를 돌려줘서 기다릴 수 있게 한다
    }
    return undefined;
  };

  return debounced;
}
