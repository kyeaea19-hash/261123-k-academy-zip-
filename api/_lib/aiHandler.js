import { allowMethods, sendJson, sendError, readJson, checkAccess } from './http.js';
import { isConfigured } from './openai.js';

// 모든 AI API 공통 처리 순서
// POST 확인 → 접근 코드 → 환경변수 → JSON 읽기 → 입력 검사 → run(value) → 200 { data }
export function createAiHandler({ validate, run }) {
  return async function handler(req, res) {
    if (!allowMethods(req, res, ['POST'])) return;
    if (!checkAccess(req)) return sendError(res, 401, 'UNAUTHORIZED', 'AI 접근 코드가 맞지 않아요.');
    if (!isConfigured()) return sendError(res, 500, 'NOT_CONFIGURED', '서버에 AI 설정이 안 되어 있어요.');

    let body;
    try {
      body = await readJson(req);
    } catch (err) {
      return sendError(res, err.status || 400, err.code || 'INVALID_INPUT', err.message || '요청을 읽지 못했어요.');
    }

    const checked = validate(body);
    if (!checked.ok) return sendError(res, 400, 'INVALID_INPUT', checked.message);

    try {
      const data = await run(checked.value);
      return sendJson(res, 200, { data });
    } catch (err) {
      if (err && err.status && err.code) return sendError(res, err.status, err.code, err.message);
      console.error('[AI API 처리 오류]', err?.name || 'Error');
      return sendError(res, 502, 'AI_ERROR', 'AI 요약에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };
}
