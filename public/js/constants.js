// 글자 수 제한
export const MAX_COURSE_NAME = 40;
export const MAX_TITLE = 60;
export const MAX_LEARNED = 5000;
export const MAX_REFLECTION = 3000;
export const MAX_NOTE = 300;
export const MAX_NOTES_PER_DAY = 30;
export const MAX_FIELD_NAME = 20;
export const MAX_FIELDS = 50;
export const MAX_TEAM_TOPIC = 60;
export const MAX_TEAM_ROLE = 60;
export const MAX_TEAM_GOAL = 500;
export const MAX_TEAM_PURPOSE = 500;
export const MAX_TEAM_MEMBERS = 10;
export const MAX_MEMBER_NAME = 20;
export const MAX_TEAM_MEMO = 1000;
export const MAX_PROGRESS = 2000;
export const MAX_LINK_NAME = 60;
export const MAX_FILE_NAME = 120;
export const MAX_URL = 2000;
export const MAX_SEARCH_QUERY = 50;
// 개수·크기 제한
export const MAX_ATTACHMENTS_PER_LOG = 20;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_GENERATE_DAYS = 366;           // 과정 기간 자동 생성 최대 일수
export const MAX_SEARCH_RESULTS = 100;
// 동작 값
export const AUTOSAVE_DELAY_MS = 800;
export const AI_MIN_CHARS = 20;                 // AI 하루 요약에 필요한 최소 글자 수 (learned + reflection, 공백 제외)
export const AI_FIELD_MAX_ENTRIES = 30;         // AI 분야 요약에 보내는 최대 기록 수 (최신 순)
export const AI_ENTRY_LEARNED_CHARS = 1500;     // 분야 요약 1개 기록의 배운 내용 최대 길이 (넘으면 자름)
export const AI_ENTRY_REFLECTION_CHARS = 500;
export const AI_ENTRY_PROGRESS_CHARS = 500;
export const AI_TIMEOUT_MS = 30000;
export const TOAST_MS = 3000;
export const TOAST_ERROR_MS = 6000;
