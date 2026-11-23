import OpenAI from 'openai';

// OpenAI 클라이언트를 한 번만 만든다
let client;
function getClient() {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 });
  return client;
}

// 우리 API 오류 모양 { status, code, message } 을 만든다
function apiError(status, code, message) {
  return { status, code, message };
}

// 키와 모델 이름이 모두 설정됐는지 확인한다
export function isConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_MODEL?.trim());
}

// 정해진 JSON 모양으로 답을 받는다 (실패하면 { status, code, message } 를 던진다)
export async function callStructured({ name, schema, instructions, input }) {
  let response;
  try {
    response = await getClient().responses.create({
      model: process.env.OPENAI_MODEL,
      instructions,
      input,
      store: false,
      text: { format: { type: 'json_schema', name, schema, strict: true } }
    });
  } catch (err) {
    // 로그에는 상태코드와 요청 id 만 남긴다 (기록 내용·키 금지)
    if (err instanceof OpenAI.APIError) {
      console.error('[OpenAI 오류]', err.status ?? '-', err.request_id ?? '-');
      if (err.status === 429) throw apiError(429, 'RATE_LIMITED', 'AI 사용량이 많아요. 1분 뒤 다시 시도해 주세요.');
      if (err.status === 401 || err.status === 403) throw apiError(500, 'NOT_CONFIGURED', '서버의 AI 키 설정을 확인해 주세요.');
    } else {
      console.error('[OpenAI 연결 오류]', err?.name || 'Error');
    }
    throw apiError(502, 'AI_ERROR', 'AI 요약에 실패했어요. 잠시 후 다시 시도해 주세요.');
  }

  // 1) 거절 응답 확인
  const refused = (response.output || []).some(item =>
    item.type === 'message' && (item.content || []).some(c => c.type === 'refusal'));
  if (refused) throw apiError(422, 'AI_REFUSED', 'AI가 이 내용은 요약할 수 없다고 답했어요.');

  // 2) 미완성 응답 확인
  if (response.status !== 'completed') {
    console.error('[OpenAI 미완성 응답]', response.status, response.id);
    throw apiError(502, 'AI_ERROR', 'AI 응답이 끝까지 오지 않았어요. 다시 시도해 주세요.');
  }

  // 3) JSON 해석
  try {
    return JSON.parse(response.output_text);
  } catch {
    console.error('[OpenAI JSON 해석 실패]', response.id);
    throw apiError(502, 'AI_ERROR', 'AI 요약에 실패했어요. 잠시 후 다시 시도해 주세요.');
  }
}
