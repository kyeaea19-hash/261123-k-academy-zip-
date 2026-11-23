// 우리 서버(/api/*)를 부르는 공통 모듈. 브라우저는 OpenAI 에 직접 요청하지 않는다.
import { AI_TIMEOUT_MS } from './constants.js';

const ACCESS_CODE_KEY = 'yz.accessCode';

const ERROR_MESSAGES = {
  NETWORK: '인터넷 연결을 확인해 주세요',
  TIMEOUT: 'AI 응답이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요',
  UNAUTHORIZED: 'AI 접근 코드가 맞지 않아요. 설정에서 코드를 확인해 주세요',
  INVALID_INPUT: '보낸 내용이 너무 길거나 형식이 맞지 않아요',
  NOT_CONFIGURED: '서버에 AI 설정이 안 되어 있어요 (관리자: OPENAI_API_KEY, OPENAI_MODEL 확인)',
  RATE_LIMITED: 'AI 사용량이 많아요. 1분 뒤 다시 시도해 주세요',
  AI_REFUSED: 'AI가 이 내용은 요약할 수 없다고 답했어요',
  AI_ERROR: 'AI 요약에 실패했어요. 잠시 후 다시 시도해 주세요'
};

// 저장된 AI 접근 코드를 읽는다 (없거나 읽을 수 없으면 '')
export function getAccessCode() {
  try { return localStorage.getItem(ACCESS_CODE_KEY) || ''; } catch { return ''; }
}

// AI 접근 코드를 저장한다 (빈 값이면 지운다)
export function setAccessCode(code) {
  try {
    if (code) localStorage.setItem(ACCESS_CODE_KEY, code);
    else localStorage.removeItem(ACCESS_CODE_KEY);
  } catch {}
}

// 오류 코드로 화면 문구가 담긴 Error 를 만든다
function apiError(code) {
  const err = new Error(ERROR_MESSAGES[code] || ERROR_MESSAGES.AI_ERROR);
  err.code = code;
  return err;
}

// 서버 API 에 JSON 을 보내고 data 를 받는다. 30초 넘으면 중단한다.
export async function postJson(path, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  const headers = { 'Content-Type': 'application/json' };
  const code = getAccessCode();
  if (code) headers['x-access-code'] = code;

  let res;
  try {
    res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
  } catch (err) {
    throw apiError(err?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK');
  } finally {
    clearTimeout(timer);
  }

  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok) throw apiError(json?.error?.code || 'AI_ERROR');
  if (!json || typeof json.data !== 'object') throw apiError('AI_ERROR');
  return json.data;
}
