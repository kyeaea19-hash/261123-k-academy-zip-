// 로컬 날짜 기반 순수 함수 모듈
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_NAMES_LONG = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// Date 객체를 로컬 기준 'YYYY-MM-DD'로 변환
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 'YYYY-MM-DD' 문자열을 로컬 자정 Date 객체로 변환
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// 유효한 날짜 문자열 검증
export function isValidDateKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return false;
  }
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// 오늘 날짜의 'YYYY-MM-DD' 반환
export function todayKey() {
  return toDateKey(new Date());
}

// 날짜에 n일 더하기
export function addDays(key, n) {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

// 시작일~종료일 날짜 키 배열 생성
export function listDateRange(startKey, endKey, { includeWeekends = false } = {}) {
  if (!isValidDateKey(startKey) || !isValidDateKey(endKey)) {
    throw new Error('RANGE_INVALID');
  }
  const startDate = fromDateKey(startKey);
  const endDate = fromDateKey(endKey);

  if (endDate < startDate) {
    throw new Error('RANGE_INVALID');
  }

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > 366) {
    throw new Error('RANGE_TOO_LONG');
  }

  const result = [];
  const cur = new Date(startDate.getTime());

  while (cur <= endDate) {
    const dayOfWeek = cur.getDay(); // 0: 일, 6: 토
    if (includeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
      result.push(toDateKey(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

// 주차 계산 공식: 기준일과 대상일이 속한 주의 월요일 기준 차이
export function weekNumber(key, baseKey) {
  const getMonday = (d) => {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const targetDate = fromDateKey(key);
  const baseDate = fromDateKey(baseKey);

  const targetMon = getMonday(targetDate);
  const baseMon = getMonday(baseDate);

  const diffMs = targetMon.getTime() - baseMon.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks + 1;
}

// '11월 23일 월요일'
export function formatDateLong(key) {
  const d = fromDateKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_NAMES_LONG[d.getDay()]}`;
}

// '11월 23일 (월)'
export function formatDateCard(key) {
  const d = fromDateKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
}

// '11.23'
export function formatDateShort(key) {
  const d = fromDateKey(key);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

// '2026.11.23'
export function formatDateDot(key) {
  const [y, m, d] = key.split('-');
  return `${y}.${m}.${d}`;
}
