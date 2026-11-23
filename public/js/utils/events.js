// 데이터가 바뀌었음을 화면에 알린다 (헤더 통계 등이 다시 그려짐)
export function notifyDataChanged(type) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('data-changed', { detail: { type } }));
  }
}
