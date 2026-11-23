// 포맷 및 해시 유틸리티

// 바이트 크기 포맷 (845B, 12.3KB, 1.2MB)
export function formatBytes(bytes) {
  if (typeof bytes !== 'number' || bytes < 0) return '0B';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)}KB`;
  }
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)}MB`;
  return `${(mb / 1024).toFixed(1)}GB`; // 예) 1649267441 → '1.5GB'
}

// FNV-1a 32비트 해시 함수 (8자리 소문자 16진수)
export function hashText(str) {
  if (typeof str !== 'string') str = String(str || '');
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// 파일명 자르기 (확장자 유지, 최대 max자)
export function truncateFileName(name, max = 120) {
  if (!name || name.length <= max) return name;
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return name.slice(0, max);
  }
  const ext = name.slice(lastDot);
  const base = name.slice(0, lastDot);
  const allowedBaseLen = max - ext.length;
  if (allowedBaseLen <= 0) {
    return name.slice(0, max);
  }
  return base.slice(0, allowedBaseLen) + ext;
}

// 시각 포맷 'HH:MM'
export function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// 날짜+시각 포맷 '11.23 16:42'
export function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const mon = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${mon}.${day} ${h}:${m}`;
}

// 공백·줄바꿈 제외 글자 수
export function countNonSpace(str) {
  if (typeof str !== 'string') return 0;
  return str.replace(/\s+/g, '').length;
}
