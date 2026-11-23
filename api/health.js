import { allowMethods, sendJson, checkAccess } from './_lib/http.js';

// 서버 상태 및 AI 설정 여부 확인
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) {
    return;
  }

  const aiConfigured = Boolean(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.trim() &&
    process.env.OPENAI_MODEL &&
    process.env.OPENAI_MODEL.trim()
  );
  const accessRequired = Boolean(
    process.env.ACCESS_CODE && process.env.ACCESS_CODE.trim()
  );
  const accessGranted = checkAccess(req);

  sendJson(res, 200, {
    data: {
      ok: true,
      aiConfigured,
      accessRequired,
      accessGranted
    }
  });
}
